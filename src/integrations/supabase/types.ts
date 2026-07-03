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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      backup_versions: {
        Row: {
          created_at: string
          id: string
          is_auto: boolean
          label: string
          size_bytes: number
          snapshot: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_auto?: boolean
          label?: string
          size_bytes?: number
          snapshot: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_auto?: boolean
          label?: string
          size_bytes?: number
          snapshot?: Json
          user_id?: string
        }
        Relationships: []
      }
      citations: {
        Row: {
          authors: string | null
          citation_type: string
          created_at: string
          doi: string | null
          id: string
          journal: string | null
          note: string | null
          publisher: string | null
          tags: string[] | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          authors?: string | null
          citation_type?: string
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          note?: string | null
          publisher?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          authors?: string | null
          citation_type?: string
          created_at?: string
          doi?: string | null
          id?: string
          journal?: string | null
          note?: string | null
          publisher?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      ollama_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          fail_count: number
          id: string
          is_active: boolean
          last_used: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          fail_count?: number
          id?: string
          is_active?: boolean
          last_used?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          fail_count?: number
          id?: string
          is_active?: boolean
          last_used?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_builder_backups: {
        Row: {
          backup_name: string
          created_at: string
          id: string
          pages_data: Json
          user_id: string
        }
        Insert: {
          backup_name?: string
          created_at?: string
          id?: string
          pages_data?: Json
          user_id: string
        }
        Update: {
          backup_name?: string
          created_at?: string
          id?: string
          pages_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      post_backlinks: {
        Row: {
          created_at: string
          id: string
          source_post_id: string
          target_post_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          source_post_id: string
          target_post_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          source_post_id?: string
          target_post_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      public_post_shares: {
        Row: {
          created_at: string
          created_by: string
          id: string
          post_id: string
          revoked: boolean
          snapshot: Json
          token: string
          updated_at: string
          view_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          post_id: string
          revoked?: boolean
          snapshot: Json
          token: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          post_id?: string
          revoked?: boolean
          snapshot?: Json
          token?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          created_at: string
          id: string
          roadmap_title: string
          score: number
          topics: string
          total_questions: number
        }
        Insert: {
          created_at?: string
          id?: string
          roadmap_title: string
          score: number
          topics: string
          total_questions: number
        }
        Update: {
          created_at?: string
          id?: string
          roadmap_title?: string
          score?: number
          topics?: string
          total_questions?: number
        }
        Relationships: []
      }
      reading_analytics: {
        Row: {
          created_at: string
          id: string
          language: string | null
          post_id: string
          scroll_depth: number
          section_id: string | null
          session_id: string
          time_on_page: number
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          post_id: string
          scroll_depth?: number
          section_id?: string | null
          session_id: string
          time_on_page?: number
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          post_id?: string
          scroll_depth?: number
          section_id?: string | null
          session_id?: string
          time_on_page?: number
        }
        Relationships: []
      }
      saved_explanations: {
        Row: {
          created_at: string
          explanation: string
          id: string
          language_name: string
          roadmap_title: string
          topics: string
        }
        Insert: {
          created_at?: string
          explanation: string
          id?: string
          language_name: string
          roadmap_title: string
          topics: string
        }
        Update: {
          created_at?: string
          explanation?: string
          id?: string
          language_name?: string
          roadmap_title?: string
          topics?: string
        }
        Relationships: []
      }
      shared_gallery_items: {
        Row: {
          author_name: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          is_public: boolean
          likes_count: number
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          is_public?: boolean
          likes_count?: number
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          is_public?: boolean
          likes_count?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_item_comments: {
        Row: {
          author_name: string | null
          body: string
          created_at: string
          id: string
          item_id: string
          item_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          body: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          body?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_item_likes: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_snippets: {
        Row: {
          author_name: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          language: string
          likes_count: number
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          language?: string
          likes_count?: number
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          language?: string
          likes_count?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
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
    Enums: {},
  },
} as const
