import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

export type Dashboard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type UserCep = {
  id: string;
  cep: string;
  city: string;
  state: string;
  region: string;
  neighborhood: string;
  latitude: number;
  longitude: number;
  age_group: string;
  enrollment_status: 'active' | 'prospect' | 'alumni';
  program: string;
  intensity: number;
  created_at: string;
};
