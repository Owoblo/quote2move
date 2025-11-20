import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Main client for MovSense tables (movsense schema)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'movsense'
  }
});

// Secondary client for accessing public schema tables (e.g., listings from Sold2Move)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  }
});
