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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          id: number
          role: string
          session_id: string
          timestamp: string
        }
        Insert: {
          content: string
          id?: number
          role: string
          session_id: string
          timestamp?: string
        }
        Update: {
          content?: string
          id?: number
          role?: string
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "conversation_sessions"
            referencedColumns: ["session_id"]
          },
        ]
      }
      conversation_sessions: {
        Row: {
          created_at: string
          id: number
          last_activity: string
          session_id: string
          user_context: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          last_activity?: string
          session_id: string
          user_context?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          last_activity?: string
          session_id?: string
          user_context?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          category: string
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          answer: string
          category: string
          confidence_score: number
          created_at: string
          id: number
          last_updated: string
          question: string
          source_document: string | null
          urgency_level: string
        }
        Insert: {
          answer: string
          category: string
          confidence_score?: number
          created_at?: string
          id?: number
          last_updated?: string
          question: string
          source_document?: string | null
          urgency_level?: string
        }
        Update: {
          answer?: string
          category?: string
          confidence_score?: number
          created_at?: string
          id?: number
          last_updated?: string
          question?: string
          source_document?: string | null
          urgency_level?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          faculty: string | null
          id: string
          name: string
          registration_number: string
        }
        Insert: {
          created_at?: string
          email: string
          faculty?: string | null
          id: string
          name: string
          registration_number: string
        }
        Update: {
          created_at?: string
          email?: string
          faculty?: string | null
          id?: string
          name?: string
          registration_number?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          auto_created: boolean
          category: string
          created_at: string
          department: string | null
          description: string
          escalated: boolean
          escalated_at: string | null
          id: number
          last_updated: string
          priority: string
          resolution: string | null
          resolved_at: string | null
          status: string
          student_email: string
          student_faculty: string | null
          student_id: string
          student_name: string
          student_registration_no: string
          ticket_id: string
          title: string
          user_question: string | null
        }
        Insert: {
          assigned_to?: string | null
          auto_created?: boolean
          category: string
          created_at?: string
          department?: string | null
          description: string
          escalated?: boolean
          escalated_at?: string | null
          id?: number
          last_updated?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          student_email: string
          student_faculty?: string | null
          student_id: string
          student_name: string
          student_registration_no: string
          ticket_id: string
          title: string
          user_question?: string | null
        }
        Update: {
          assigned_to?: string | null
          auto_created?: boolean
          category?: string
          created_at?: string
          department?: string | null
          description?: string
          escalated?: boolean
          escalated_at?: string | null
          id?: number
          last_updated?: string
          priority?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          student_email?: string
          student_faculty?: string | null
          student_id?: string
          student_name?: string
          student_registration_no?: string
          ticket_id?: string
          title?: string
          user_question?: string | null
        }
        Relationships: []
      }
      ticket_responses: {
        Row: {
          author_name: string
          author_role: string
          author_user_id: string | null
          created_at: string
          id: string
          message: string
          ticket_id: number
        }
        Insert: {
          author_name: string
          author_role: string
          author_user_id?: string | null
          created_at?: string
          id?: string
          message: string
          ticket_id: number
        }
        Update: {
          author_name?: string
          author_role?: string
          author_user_id?: string | null
          created_at?: string
          id?: string
          message?: string
          ticket_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          created_at: string
          feedback: string | null
          helpful: boolean | null
          id: number
          rating: number | null
          session_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          helpful?: boolean | null
          id?: number
          rating?: number | null
          session_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          helpful?: boolean | null
          id?: number
          rating?: number | null
          session_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          department_category: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          department_category?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          department_category?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_department_category: {
        Args: { _user_id: string }
        Returns: string
      }
      get_email_by_registration: { Args: { _reg_no: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_department_for_category: {
        Args: { _category: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "student" | "department"
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
      app_role: ["admin", "student", "department"],
    },
  },
} as const
