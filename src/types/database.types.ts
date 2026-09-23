export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          project_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          project_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          client_id: string | null
          created_at: string | null
          decision_date: string | null
          deliverable_id: string | null
          id: string
          project_id: string
          reason: string | null
          status: string
          title: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          decision_date?: string | null
          deliverable_id?: string | null
          id?: string
          project_id: string
          reason?: string | null
          status?: string
          title: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          decision_date?: string | null
          deliverable_id?: string | null
          id?: string
          project_id?: string
          reason?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          pic_email: string
          pic_name: string
          pic_phone: string | null
        }
        Insert: {
          company: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          pic_email: string
          pic_name: string
          pic_phone?: string | null
        }
        Update: {
          company?: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          pic_email?: string
          pic_name?: string
          pic_phone?: string | null
        }
        Relationships: []
      }
      conversation_members: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          is_internal: boolean | null
          project_id: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          project_id?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          project_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      file_versions: {
        Row: {
          change_summary: string | null
          created_at: string | null
          file_id: string
          id: string
          storage_path: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          created_at?: string | null
          file_id: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          change_summary?: string | null
          created_at?: string | null
          file_id?: string
          id?: string
          storage_path?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "file_versions_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "file_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          category: string
          created_at: string | null
          file_size: number | null
          id: string
          is_confidential: boolean | null
          mime_type: string | null
          name: string
          project_id: string
          storage_path: string
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          file_size?: number | null
          id?: string
          is_confidential?: boolean | null
          mime_type?: string | null
          name: string
          project_id: string
          storage_path: string
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          file_size?: number | null
          id?: string
          is_confidential?: boolean | null
          mime_type?: string | null
          name?: string
          project_id?: string
          storage_path?: string
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          message_id: string
        }
        Insert: {
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message_id: string
        }
        Update: {
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          is_system: boolean | null
          reply_to_id: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_system?: boolean | null
          reply_to_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          is_system?: boolean | null
          reply_to_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completion_percentage: number | null
          created_at: string | null
          description: string | null
          id: string
          project_id: string
          status: string
          target_date: string
          title: string
        }
        Insert: {
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id: string
          status?: string
          target_date: string
          title: string
        }
        Update: {
          completion_percentage?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          project_id?: string
          status?: string
          target_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          client_id: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          id: string
          max_weekly_hours: number | null
          phone: string | null
          position: string | null
          role_id: string
        }
        Insert: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          id?: string
          max_weekly_hours?: number | null
          phone?: string | null
          position?: string | null
          role_id?: string
        }
        Update: {
          avatar_url?: string | null
          client_id?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          id?: string
          max_weekly_hours?: number | null
          phone?: string | null
          position?: string | null
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          allocated_hours_per_week: number | null
          created_at: string | null
          id: string
          project_id: string
          role_in_project: string
          user_id: string
        }
        Insert: {
          allocated_hours_per_week?: number | null
          created_at?: string | null
          id?: string
          project_id: string
          role_in_project?: string
          user_id: string
        }
        Update: {
          allocated_hours_per_week?: number | null
          created_at?: string | null
          id?: string
          project_id?: string
          role_in_project?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_stages: {
        Row: {
          completed_at: string | null
          id: string
          is_current: boolean | null
          name: string
          project_id: string
          sequence_order: number
          stage_key: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          is_current?: boolean | null
          name: string
          project_id: string
          sequence_order: number
          stage_key: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_current?: boolean | null
          name?: string
          project_id?: string
          sequence_order?: number
          stage_key?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_timelines: {
        Row: {
          created_at: string | null
          delay_days: number | null
          end_date: string
          id: string
          phase_name: string
          progress: number | null
          project_id: string
          start_date: string
          status: string
        }
        Insert: {
          created_at?: string | null
          delay_days?: number | null
          end_date: string
          id?: string
          phase_name: string
          progress?: number | null
          project_id: string
          start_date: string
          status?: string
        }
        Update: {
          created_at?: string | null
          delay_days?: number | null
          end_date?: string
          id?: string
          phase_name?: string
          progress?: number | null
          project_id?: string
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_timelines_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          author_id: string | null
          created_at: string | null
          id: string
          progress_delta: number | null
          project_id: string
          stage_from: string | null
          stage_to: string | null
          summary: string
          title: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          progress_delta?: number | null
          project_id: string
          stage_from?: string | null
          stage_to?: string | null
          summary: string
          title: string
        }
        Update: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          progress_delta?: number | null
          project_id?: string
          stage_from?: string | null
          stage_to?: string | null
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end_date: string | null
          budget: number | null
          client_id: string | null
          code: string
          created_at: string | null
          delivery_model: string
          description: string | null
          health_score: number | null
          id: string
          lead_id: string | null
          progress_percentage: number | null
          stage: string
          start_date: string | null
          target_end_date: string | null
          template_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_end_date?: string | null
          budget?: number | null
          client_id?: string | null
          code: string
          created_at?: string | null
          delivery_model?: string
          description?: string | null
          health_score?: number | null
          id?: string
          lead_id?: string | null
          progress_percentage?: number | null
          stage?: string
          start_date?: string | null
          target_end_date?: string | null
          template_type?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_end_date?: string | null
          budget?: number | null
          client_id?: string | null
          code?: string
          created_at?: string | null
          delivery_model?: string
          description?: string | null
          health_score?: number | null
          id?: string
          lead_id?: string | null
          progress_percentage?: number | null
          stage?: string
          start_date?: string | null
          target_end_date?: string | null
          template_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      revision_comments: {
        Row: {
          author_id: string
          comment: string
          created_at: string | null
          id: string
          revision_id: string
        }
        Insert: {
          author_id: string
          comment: string
          created_at?: string | null
          id?: string
          revision_id: string
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string | null
          id?: string
          revision_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revision_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revision_comments_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      revisions: {
        Row: {
          affected_task_id: string | null
          client_id: string | null
          created_at: string | null
          description: string
          id: string
          impact_level: string
          potential_delay_days: number | null
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          affected_task_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description: string
          id?: string
          impact_level?: string
          potential_delay_days?: number | null
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          affected_task_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string
          id?: string
          impact_level?: string
          potential_delay_days?: number | null
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revisions_affected_task_id_fkey"
            columns: ["affected_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          task_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          task_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string | null
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          blocked_reason: string | null
          client_waiting_since: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          is_blocked: boolean | null
          is_waiting_for_client: boolean | null
          position_order: number | null
          priority: string
          project_id: string
          reporter_id: string | null
          source_message_id: string | null
          stage_key: string
          start_date: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          blocked_reason?: string | null
          client_waiting_since?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_blocked?: boolean | null
          is_waiting_for_client?: boolean | null
          position_order?: number | null
          priority?: string
          project_id: string
          reporter_id?: string | null
          source_message_id?: string | null
          stage_key?: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          blocked_reason?: string | null
          client_waiting_since?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          is_blocked?: boolean | null
          is_waiting_for_client?: boolean | null
          position_order?: number | null
          priority?: string
          project_id?: string
          reporter_id?: string | null
          source_message_id?: string | null
          stage_key?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          project_id: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          project_id?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          project_id?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          delivery_model: string
          description: string | null
          estimated_duration_weeks: number | null
          id: string
          name: string
        }
        Insert: {
          delivery_model: string
          description?: string | null
          estimated_duration_weeks?: number | null
          id: string
          name: string
        }
        Update: {
          delivery_model?: string
          description?: string | null
          estimated_duration_weeks?: number | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
