export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          config: Json
          id: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          id?: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      device_sessions: {
        Row: {
          created_at: string
          device_id: string
          id: string
          last_seen: string
          server_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          last_seen?: string
          server_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          last_seen?: string
          server_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      iptv_server_owner_notes: {
        Row: {
          note: string
          server_id: string
          updated_at: string
        }
        Insert: {
          note?: string
          server_id: string
          updated_at?: string
        }
        Update: {
          note?: string
          server_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iptv_server_owner_notes_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: true
            referencedRelation: "iptv_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      iptv_servers: {
        Row: {
          connection_capacity: number | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          url: string
        }
        Insert: {
          connection_capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          url: string
        }
        Update: {
          connection_capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          url?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          created_by: string | null
          display_name: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_connections: number
          plan_id: string | null
          referral_code: string | null
          referred_by_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          expires_at?: string | null
          id: string
          is_active?: boolean
          max_connections?: number
          plan_id?: string | null
          referral_code?: string | null
          referred_by_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_connections?: number
          plan_id?: string | null
          referral_code?: string | null
          referred_by_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      server_credentials: {
        Row: {
          created_at: string | null
          dns: string
          id: string
          password: string
          server_id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          dns: string
          id?: string
          password: string
          server_id: string
          username: string
        }
        Update: {
          created_at?: string | null
          dns?: string
          id?: string
          password?: string
          server_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "server_credentials_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "iptv_servers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          duration_days: number
          duration_unit: string | null
          duration_value: number
          id: string
          max_connections: number
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_days: number
          duration_unit?: string | null
          duration_value: number
          id?: string
          max_connections?: number
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_days?: number
          duration_unit?: string | null
          duration_value?: number
          id?: string
          max_connections?: number
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string | null
          created_at: string
          file_type: string | null
          file_url: string | null
          id: string
          metadata: Json
          sender_id: string | null
          message_type: string
          thread_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json
          sender_id?: string | null
          message_type?: string
          thread_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          metadata?: Json
          sender_id?: string | null
          message_type?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          closed_at: string | null
          closed_by_role: string | null
          closed_by_user_id: string | null
          closure_prompt_at: string | null
          created_at: string
          id: string
          last_message: string | null
          last_message_at: string
          last_owner_message_at: string | null
          last_user_message_at: string | null
          status: string
          protocol: string | null
          satisfaction_note: string | null
          satisfaction_requested_at: string | null
          satisfaction_score: number | null
          satisfaction_submitted_at: string | null
          unread_count_owner: number
          unread_count_user: number
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string | null
          closed_by_role?: string | null
          closed_by_user_id?: string | null
          closure_prompt_at?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          last_owner_message_at?: string | null
          last_user_message_at?: string | null
          status?: string
          protocol?: string | null
          satisfaction_note?: string | null
          satisfaction_requested_at?: string | null
          satisfaction_score?: number | null
          satisfaction_submitted_at?: string | null
          unread_count_owner?: number
          unread_count_user?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string | null
          closed_by_role?: string | null
          closed_by_user_id?: string | null
          closure_prompt_at?: string | null
          created_at?: string
          id?: string
          last_message?: string | null
          last_message_at?: string
          last_owner_message_at?: string | null
          last_user_message_at?: string | null
          status?: string
          protocol?: string | null
          satisfaction_note?: string | null
          satisfaction_requested_at?: string | null
          satisfaction_score?: number | null
          satisfaction_submitted_at?: string | null
          unread_count_owner?: number
          unread_count_user?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      test_device_tracking: {
        Row: {
          created_at: string | null
          fingerprint: string
          id: string
          ip_address: string | null
        }
        Insert: {
          created_at?: string | null
          fingerprint: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          created_at?: string | null
          fingerprint?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      test_links: {
        Row: {
          bonus_days_monthly: number | null
          bonus_days_quarterly: number | null
          created_at: string
          created_by_id: string | null
          description: string | null
          duration_minutes: number
          allow_repeat_device: boolean
          id: string
          is_active: boolean
          max_connections: number
          owner_only: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          bonus_days_monthly?: number | null
          bonus_days_quarterly?: number | null
          created_at?: string
          created_by_id?: string | null
          description?: string | null
          duration_minutes?: number
          allow_repeat_device?: boolean
          id?: string
          is_active?: boolean
          max_connections?: number
          owner_only?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          bonus_days_monthly?: number | null
          bonus_days_quarterly?: number | null
          created_at?: string
          created_by_id?: string | null
          description?: string | null
          duration_minutes?: number
          allow_repeat_device?: boolean
          id?: string
          is_active?: boolean
          max_connections?: number
          owner_only?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_server_access: {
        Row: {
          created_at: string
          id: string
          server_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          server_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          server_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_server_access_server_id_fkey"
            columns: ["server_id"]
            isOneToOne: false
            referencedRelation: "iptv_servers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_device_session: {
        Args: {
          p_device_id: string
          p_server_id: string
          p_user_agent?: string | null
          p_user_id: string
        }
        Returns: {
          allowed: boolean
          reason: string
          server_active: number
          server_limit: number | null
          user_active: number
          user_limit: number | null
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "owner", "user"],
    },
  },
} as const
