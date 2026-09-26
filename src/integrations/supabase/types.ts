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
      analyses: {
        Row: {
          commodity_category: string | null
          commodity_name: string
          created_at: string
          id: string
          inputs: Json
          storage_type: string
          user_id: string
        }
        Insert: {
          commodity_category?: string | null
          commodity_name: string
          created_at?: string
          id?: string
          inputs?: Json
          storage_type: string
          user_id: string
        }
        Update: {
          commodity_category?: string | null
          commodity_name?: string
          created_at?: string
          id?: string
          inputs?: Json
          storage_type?: string
          user_id?: string
        }
        Relationships: []
      }
      analysis_material_scores: {
        Row: {
          analysis_id: string
          breakdown: Json
          created_at: string
          id: string
          material_name: string
          material_slug: string
          score: number
          user_id: string
        }
        Insert: {
          analysis_id: string
          breakdown?: Json
          created_at?: string
          id?: string
          material_name: string
          material_slug: string
          score: number
          user_id: string
        }
        Update: {
          analysis_id?: string
          breakdown?: Json
          created_at?: string
          id?: string
          material_name?: string
          material_slug?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_material_scores_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      commodities: {
        Row: {
          category: string
          created_at: string
          default_moisture: number | null
          default_oil: number | null
          default_ph: number | null
          default_respiration: string | null
          fresh_produce: boolean
          id: string
          moisture_sensitivity: string
          name: string
          perishability: string
          respiration_category: string
          typical_storage: string
        }
        Insert: {
          category: string
          created_at?: string
          default_moisture?: number | null
          default_oil?: number | null
          default_ph?: number | null
          default_respiration?: string | null
          fresh_produce?: boolean
          id?: string
          moisture_sensitivity: string
          name: string
          perishability: string
          respiration_category: string
          typical_storage: string
        }
        Update: {
          category?: string
          created_at?: string
          default_moisture?: number | null
          default_oil?: number | null
          default_ph?: number | null
          default_respiration?: string | null
          fresh_produce?: boolean
          id?: string
          moisture_sensitivity?: string
          name?: string
          perishability?: string
          respiration_category?: string
          typical_storage?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string
          cost_index: number
          created_at: string
          data_status: string
          description: string
          fresh_produce_suitable: boolean
          id: string
          light_barrier: number
          map_suitable: boolean
          mechanical_strength: number
          moisture_barrier: number
          name: string
          otr_label: string
          otr_value: number
          oxygen_barrier: number
          recyclability: string
          relative_cost: number
          sealability: number
          slug: string
          sustainability: number
          temp_max: number
          temp_min: number
          thickness_range: string
          wvtr_label: string
          wvtr_value: number
        }
        Insert: {
          category: string
          cost_index: number
          created_at?: string
          data_status?: string
          description: string
          fresh_produce_suitable?: boolean
          id?: string
          light_barrier: number
          map_suitable?: boolean
          mechanical_strength: number
          moisture_barrier: number
          name: string
          otr_label: string
          otr_value: number
          oxygen_barrier: number
          recyclability: string
          relative_cost: number
          sealability: number
          slug: string
          sustainability: number
          temp_max: number
          temp_min: number
          thickness_range: string
          wvtr_label: string
          wvtr_value: number
        }
        Update: {
          category?: string
          cost_index?: number
          created_at?: string
          data_status?: string
          description?: string
          fresh_produce_suitable?: boolean
          id?: string
          light_barrier?: number
          map_suitable?: boolean
          mechanical_strength?: number
          moisture_barrier?: number
          name?: string
          otr_label?: string
          otr_value?: number
          oxygen_barrier?: number
          recyclability?: string
          relative_cost?: number
          sealability?: number
          slug?: string
          sustainability?: number
          temp_max?: number
          temp_min?: number
          thickness_range?: string
          wvtr_label?: string
          wvtr_value?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          organization: string | null
          role: string | null
        }
        Insert: {
          created_at?: string
          id: string
          name?: string | null
          organization?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          organization?: string | null
          role?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          alternatives: Json
          analysis_id: string
          compatibility: number
          created_at: string
          factors: Json
          id: string
          map_conditions: Json
          material_name: string
          material_slug: string
          reasons: Json
          shelf_life_max: number
          shelf_life_min: number
          specifications: Json
          user_id: string
        }
        Insert: {
          alternatives?: Json
          analysis_id: string
          compatibility: number
          created_at?: string
          factors?: Json
          id?: string
          map_conditions?: Json
          material_name: string
          material_slug: string
          reasons?: Json
          shelf_life_max: number
          shelf_life_min: number
          specifications?: Json
          user_id: string
        }
        Update: {
          alternatives?: Json
          analysis_id?: string
          compatibility?: number
          created_at?: string
          factors?: Json
          id?: string
          map_conditions?: Json
          material_name?: string
          material_slug?: string
          reasons?: Json
          shelf_life_max?: number
          shelf_life_min?: number
          specifications?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          analysis_id: string
          content: Json
          created_at: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          analysis_id: string
          content?: Json
          created_at?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          analysis_id?: string
          content?: Json
          created_at?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
