import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─────────────────────────────────────────────
//  Database types
// ─────────────────────────────────────────────
export type NeighborhoodMemory = {
  notes: string[];
  photoUrls: string[];
  moods?: string[];
  color?: string;
};

export type AtlasRow = {
  id: string;
  created_at: string;
  neighborhood_data: Record<string, NeighborhoodMemory>;
};
