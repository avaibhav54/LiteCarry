// This file will be auto-generated from Supabase schema
// Placeholder until generation is set up

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          base_price: number;
          compare_at_price: number | null;
          brand: string | null;
          is_published: boolean;
          stock_quantity: number;
          sku: string;
          created_at: string;
          updated_at: string;
          search_vector: unknown;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at' | 'search_vector'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          storage_path: string;
          is_primary: boolean;
          display_order: number;
          alt_text: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_images']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['product_images']['Insert']>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          name: string;
          price_adjustment: number;
          stock_quantity: number;
          attributes: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['product_variants']['Insert']>;
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          parent_id: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };
      product_categories: {
        Row: {
          product_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: Database['public']['Tables']['product_categories']['Row'];
        Update: Partial<Database['public']['Tables']['product_categories']['Row']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
