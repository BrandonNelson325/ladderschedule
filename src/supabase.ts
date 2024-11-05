import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      racers: {
        Row: {
          id: number
          name: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          created_at?: string
        }
      }
      races: {
        Row: {
          id: number
          name: string
          datetime: string // UTC datetime
          signup_url?: string
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          datetime: string
          signup_url?: string
          created_at?: string
        }
      }
      racer_availability: {
        Row: {
          id: number
          racer_id: number
          date: string
          created_at: string
        }
        Insert: {
          id?: number
          racer_id: number
          date: string
          created_at?: string
        }
      }
      race_assignments: {
        Row: {
          id: number
          race_id: number
          racer_id: number
          created_at: string
        }
        Insert: {
          id?: number
          race_id: number
          racer_id: number
          created_at?: string
        }
      }
    }
  }
}