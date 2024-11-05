import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      racers: {
        Row: {
          id: number
          name: string
          availability: string[]
          created_at?: string
        }
        Insert: {
          name: string
          availability?: string[]
        }
        Update: {
          name?: string
          availability?: string[]
        }
      }
      races: {
        Row: {
          id: number
          title: string
          date: string
          time: string
          assigned_racers: number[]
          created_at?: string
        }
        Insert: {
          title: string
          date: string
          time: string
          assigned_racers?: number[]
        }
        Update: {
          title?: string
          date?: string
          time?: string
          assigned_racers?: number[]
        }
      }
    }
  }
}