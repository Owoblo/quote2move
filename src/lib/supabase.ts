import { createClient } from '@supabase/supabase-js';

// Using SOLD2MOVE as the single active database
// This database contains EVERYTHING: listings, projects, quotes, users, etc.
const supabaseUrl = process.env.REACT_APP_SOLD2MOVE_URL || process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SOLD2MOVE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Single Supabase client for everything (listings, projects, quotes, users)
// All tables are in the public schema of the Sold2Move database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Legacy aliases - all point to the same client
export const supabasePublic = supabase;
export const supabaseSold2Move = supabase;
