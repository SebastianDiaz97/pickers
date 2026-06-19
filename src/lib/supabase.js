import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '⚠️ Supabase credentials not found. Create a .env file with:\n' +
      'VITE_SUPABASE_URL=your_url\n' +
      'VITE_SUPABASE_ANON_KEY=your_key'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
