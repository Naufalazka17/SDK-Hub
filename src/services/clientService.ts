import { supabase } from '../lib/supabase';
import { Client, Role } from '../types';
import { assertPermission } from '../lib/permissions';

export interface CreateClientInput {
  name: string;
  pic_name?: string;
  pic_email: string;
  pic_phone?: string;
  company?: string;
  address?: string;
}

export const clientService = {
  /**
   * Fetches all registered clients from Supabase
   */
  async getClients(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }

    return (data || []) as Client[];
  },

  /**
   * Creates a new client organization in Supabase
   */
  async createClient(input: CreateClientInput, callerRole?: Role): Promise<Client> {
    if (callerRole) {
      assertPermission(callerRole, 'client:create', 'Hanya Admin atau Project Lead yang dapat mendaftarkan client baru.');
    }

    const trimmedName = input.name.trim();
    const trimmedEmail = input.pic_email.trim().toLowerCase();
    const company = (input.company && input.company.trim()) || trimmedName;
    const picName = (input.pic_name && input.pic_name.trim()) || trimmedName;

    if (!trimmedName) {
      throw new Error('Nama client / organisasi wajib diisi.');
    }
    if (!trimmedEmail) {
      throw new Error('Email PIC wajib diisi.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error('Format email client tidak valid.');
    }

    // Check for duplicate client email or company
    const { data: existingClients, error: checkError } = await supabase
      .from('clients')
      .select('id, name, pic_email, company')
      .or(`pic_email.ilike.${trimmedEmail},name.ilike.${trimmedName}`);

    if (checkError) {
      console.warn('Warning during client duplicate check:', checkError);
    } else if (existingClients && existingClients.length > 0) {
      const match = existingClients[0];
      if (match.pic_email?.toLowerCase() === trimmedEmail) {
        throw new Error(`Client dengan email "${trimmedEmail}" sudah terdaftar (${match.name}).`);
      }
    }

    const insertPayload: any = {
      name: trimmedName,
      pic_name: picName,
      pic_email: trimmedEmail,
      pic_phone: input.pic_phone?.trim() || null,
      company: company,
      address: input.address?.trim() || null,
      logo_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(company)}&backgroundColor=f97316`,
    };

    const { data: newClient, error: insertError } = await supabase
      .from('clients')
      .insert(insertPayload)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting client into database:', insertError);
      throw new Error(`Gagal menyimpan client: ${insertError.message}`);
    }

    return newClient as Client;
  },

  /**
   * Updates an existing client
   */
  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      throw error;
    }
    return data as Client;
  },

  /**
   * Deletes a client
   */
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  /**
   * Simulates sending an onboarding invitation link to client PIC
   */
  async sendInvitation(clientId: string, picEmail: string, picName?: string): Promise<{ success: boolean; inviteUrl: string }> {
    const inviteToken = Math.random().toString(36).substring(2, 10);
    const inviteUrl = `${window.location.origin}/login?invite=${inviteToken}&email=${encodeURIComponent(picEmail)}`;

    // Log the invitation dispatch to activity logs
    try {
      await supabase.from('activity_logs').insert({
        actor_id: null,
        action: 'CLIENT_INVITATION_SENT',
        entity_type: 'CLIENT',
        entity_id: clientId,
        details: { pic_email: picEmail, pic_name: picName, invite_url: inviteUrl },
      });
    } catch (e) {
      console.warn('Could not log activity for invitation:', e);
    }

    return { success: true, inviteUrl };
  },
};
