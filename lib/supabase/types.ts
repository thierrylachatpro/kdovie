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
      app_settings: {
        Row: {
          id: number
          maintenance_mode: boolean
          updated_at: string
        }
        Insert: {
          id?: number
          maintenance_mode?: boolean
          updated_at?: string
        }
        Update: {
          id?: number
          maintenance_mode?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount_cents: number
          created_at: string
          gift_item_id: string
          guest_email: string | null
          guest_name: string | null
          id: string
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          gift_item_id: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          gift_item_id?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contributions_gift_item_id_fkey"
            columns: ["gift_item_id"]
            isOneToOne: false
            referencedRelation: "gift_items"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          deleted_at: string | null
          event_date: string | null
          fee_mode: string
          id: string
          name: string
          organizer_id: string
          slug: string
          status: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          event_date?: string | null
          fee_mode?: string
          id?: string
          name: string
          organizer_id: string
          slug: string
          status?: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          event_date?: string | null
          fee_mode?: string
          id?: string
          name?: string
          organizer_id?: string
          slug?: string
          status?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_items: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          event_id: string
          funded_amount_cents: number
          id: string
          image_url: string | null
          is_priority: boolean
          locked_at: string | null
          mode: string
          original_title: string | null
          position: number
          price_cents: number | null
          source_url: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          funded_amount_cents?: number
          id?: string
          image_url?: string | null
          is_priority?: boolean
          locked_at?: string | null
          mode?: string
          original_title?: string | null
          position?: number
          price_cents?: number | null
          source_url?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          funded_amount_cents?: number
          id?: string
          image_url?: string | null
          is_priority?: boolean
          locked_at?: string | null
          mode?: string
          original_title?: string | null
          position?: number
          price_cents?: number | null
          source_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_stripe_accounts: {
        Row: {
          created_at: string
          id: string
          organizer_id: string
          payouts_enabled: boolean
          stripe_account_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizer_id: string
          payouts_enabled?: boolean
          stripe_account_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          organizer_id?: string
          payouts_enabled?: boolean
          stripe_account_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_stripe_accounts_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          disabled: boolean
          display_name: string | null
          first_name: string | null
          id: string
          is_admin: boolean
          last_name: string | null
          postal_code: string | null
          searchable: boolean
          updated_at: string
          welcome_email_sent_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          disabled?: boolean
          display_name?: string | null
          first_name?: string | null
          id: string
          is_admin?: boolean
          last_name?: string | null
          postal_code?: string | null
          searchable?: boolean
          updated_at?: string
          welcome_email_sent_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          disabled?: boolean
          display_name?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean
          last_name?: string | null
          postal_code?: string | null
          searchable?: boolean
          updated_at?: string
          welcome_email_sent_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          cancelled_at: string | null
          gift_item_id: string
          guest_email: string | null
          guest_name: string | null
          id: string
          reserved_at: string
        }
        Insert: {
          cancelled_at?: string | null
          gift_item_id: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          reserved_at?: string
        }
        Update: {
          cancelled_at?: string | null
          gift_item_id?: string
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          reserved_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_gift_item_id_fkey"
            columns: ["gift_item_id"]
            isOneToOne: true
            referencedRelation: "gift_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_reservation: {
        Args: { p_reservation_id: string }
        Returns: {
          created_at: string
          currency: string
          description: string | null
          event_id: string
          funded_amount_cents: number
          id: string
          image_url: string | null
          is_priority: boolean
          locked_at: string | null
          mode: string
          original_title: string | null
          price_cents: number | null
          source_url: string | null
          status: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "gift_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_contribution: {
        Args: { p_contribution_id: string }
        Returns: {
          created_at: string
          currency: string
          description: string | null
          event_id: string
          funded_amount_cents: number
          id: string
          image_url: string | null
          is_priority: boolean
          locked_at: string | null
          mode: string
          original_title: string | null
          price_cents: number | null
          source_url: string | null
          status: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "gift_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reserve_gift_item: {
        Args: {
          p_gift_item_id: string
          p_guest_email: string
          p_guest_name: string
        }
        Returns: {
          cancelled_at: string | null
          gift_item_id: string
          guest_email: string | null
          guest_name: string | null
          id: string
          reserved_at: string
        }
        SetofOptions: {
          from: "*"
          to: "reservations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      search_organizers: {
        Args: {
          p_city: string
          p_query: string
        }
        Returns: {
          event_id: string
          event_name: string
          event_slug: string
          event_type: string | null
          first_name: string | null
          last_name: string | null
        }[]
      }
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
