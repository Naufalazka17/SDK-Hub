import { supabase } from '../lib/supabase';
import { Profile, Role, TaskWithDetails } from '../types';
import { assertPermission } from '../lib/permissions';

export interface CreateUserInput {
  full_name: string;
  email: string;
  role_id: Role;
  department?: string;
  position?: string;
  phone?: string;
  avatar_url?: string;
  max_weekly_hours?: number;
  client_id?: string | null;
}

export interface UserProjectAllocation {
  id: string; // project_id
  project_member_id?: string;
  title: string;
  code: string;
  role_in_project: string;
  allocated_hours_per_week: number;
}

export interface UserWithDetails extends Profile {
  assigned_projects_count?: number;
  total_allocated_hours?: number;
  utilization_percentage?: number;
  assigned_projects?: UserProjectAllocation[];
}

export const userService = {
  /**
   * Fetches all user profiles from Supabase with their assigned projects and allocation metrics
   */
  async getUsers(): Promise<UserWithDetails[]> {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    // Fetch project memberships with allocated hours
    const { data: memberships } = await supabase
      .from('project_members')
      .select(`
        id,
        project_id,
        user_id,
        role_in_project,
        allocated_hours_per_week,
        project:projects(id, title, code)
      `);

    return (profiles || []).map((prof) => {
      const userProjects: UserProjectAllocation[] = (memberships || [])
        .filter((m) => m.user_id === prof.id)
        .map((m: any) => ({
          id: m.project?.id || m.project_id,
          project_member_id: m.id,
          title: m.project?.title || 'Unknown Project',
          code: m.project?.code || 'PRJ',
          role_in_project: m.role_in_project || 'Member',
          allocated_hours_per_week: m.allocated_hours_per_week || 0,
        }));

      const totalAllocated = userProjects.reduce((sum, p) => sum + (p.allocated_hours_per_week || 0), 0);
      const maxHours = prof.max_weekly_hours && prof.max_weekly_hours > 0 ? prof.max_weekly_hours : 40;
      const utilization = Math.round((totalAllocated / maxHours) * 100);

      return {
        ...prof,
        assigned_projects_count: userProjects.length,
        total_allocated_hours: totalAllocated,
        utilization_percentage: utilization,
        assigned_projects: userProjects,
      };
    });
  },

  /**
   * Creates a new user profile in Supabase
   */
  async createUser(input: CreateUserInput, callerRole?: Role): Promise<Profile> {
    if (callerRole && callerRole !== 'ADMIN' && !(callerRole === 'PROJECT_LEAD' && input.role_id === 'CLIENT')) {
      assertPermission(callerRole, 'user:manage', 'Hanya Administrator yang dapat menambahkan user baru.');
    }

    const trimmedEmail = input.email.trim().toLowerCase();
    const trimmedName = input.full_name.trim();

    if (!trimmedName) throw new Error('Nama lengkap user wajib diisi.');
    if (!trimmedEmail) throw new Error('Email user wajib diisi.');

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        full_name: trimmedName,
        email: trimmedEmail,
        role_id: input.role_id,
        department: input.department || (input.role_id === 'CLIENT' ? 'Client Organization' : 'Engineering'),
        position: input.position || (input.role_id === 'CLIENT' ? 'Client PIC' : 'Team Member'),
        phone: input.phone || null,
        client_id: input.client_id || null,
        avatar_url: input.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}&backgroundColor=0284c7`,
        max_weekly_hours: input.max_weekly_hours || 40,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }

    return data as Profile;
  },

  /**
   * Updates an existing user's details and role
   */
  async updateUser(userId: string, updates: Partial<Profile>, callerRole?: Role): Promise<Profile> {
    if (callerRole) {
      assertPermission(callerRole, 'user:manage', 'Hanya Administrator yang dapat mengubah data user.');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw error;
    }

    return data as Profile;
  },

  /**
   * Deletes a user profile (Admin only)
   */
  async deleteUser(userId: string, callerRole?: Role): Promise<void> {
    if (callerRole) {
      assertPermission(callerRole, 'user:manage', 'Hanya Administrator yang berwenang menghapus user.');
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  /**
   * Updates a user's maximum weekly capacity and per-project allocated hours
   */
  async updateAllocation(
    userId: string,
    maxWeeklyHours: number,
    projectAllocations: { projectId: string; allocatedHours: number }[],
    callerRole?: Role
  ): Promise<void> {
    if (callerRole) {
      assertPermission(callerRole, 'resource:edit', 'Hanya Administrator atau Project Lead yang berwenang mengubah alokasi sumber daya.');
    }

    // 1. Update user profile max_weekly_hours
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ max_weekly_hours: maxWeeklyHours })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating user profile max_weekly_hours:', profileError);
      throw profileError;
    }

    // 2. Fetch current memberships for this user to preserve roles and identify removed projects
    const { data: currentMembers, error: fetchErr } = await supabase
      .from('project_members')
      .select('id, project_id, role_in_project')
      .eq('user_id', userId);

    if (fetchErr) {
      console.error('Error fetching existing project memberships:', fetchErr);
      throw fetchErr;
    }

    const currentMap = new Map((currentMembers || []).map((m) => [m.project_id, m]));
    const targetProjectIds = new Set(projectAllocations.map((a) => a.projectId));

    // 3. Upsert allocations for current/new projects
    for (const alloc of projectAllocations) {
      const existing = currentMap.get(alloc.projectId);
      const roleInProject = existing?.role_in_project || 'MEMBER';

      const { error: upsertErr } = await supabase
        .from('project_members')
        .upsert(
          {
            user_id: userId,
            project_id: alloc.projectId,
            allocated_hours_per_week: alloc.allocatedHours,
            role_in_project: roleInProject,
          },
          { onConflict: 'user_id,project_id' }
        );

      if (upsertErr) {
        console.error('Failed to upsert project member allocation:', upsertErr);
        throw upsertErr;
      }
    }

    // 4. Delete memberships for projects that were removed from allocations
    const projectsToDelete: string[] = [];
    currentMap.forEach((_, projId) => {
      if (!targetProjectIds.has(projId)) {
        projectsToDelete.push(projId);
      }
    });

    if (projectsToDelete.length > 0) {
      const { error: deleteErr } = await supabase
        .from('project_members')
        .delete()
        .eq('user_id', userId)
        .in('project_id', projectsToDelete);

      if (deleteErr) {
        console.error('Failed to remove omitted project memberships:', deleteErr);
        throw deleteErr;
      }
    }
  },

  /**
   * Fetches all tasks assigned to a specific user
   */
  async getUserTasks(userId: string): Promise<TaskWithDetails[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        project:projects(id, title, code)
      `)
      .eq('assignee_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user tasks:', error);
      throw error;
    }

    return (data || []) as TaskWithDetails[];
  },
};
