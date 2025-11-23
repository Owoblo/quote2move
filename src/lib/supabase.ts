import { createClient } from '@supabase/supabase-js';

// Using SOLD2MOVE as the single active database
// This database contains EVERYTHING: listings, projects, quotes, users, etc.

// Helper to safely get and trim environment variables
// Explicitly accessing process.env properties ensures bundlers (Webpack/Vite) correctly replace them
const getSupabaseUrl = () => {
  const url = process.env.REACT_APP_SOLD2MOVE_URL || process.env.REACT_APP_SUPABASE_URL || '';
  // Ensure no hidden whitespace characters (like \r \n etc) are present
  return url.replace(/\s+/g, '').trim();
};

const getSupabaseKey = () => {
  const key = process.env.REACT_APP_SOLD2MOVE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY || '';
  // Ensure no hidden whitespace characters (like \r \n etc) are present
  return key.replace(/\s+/g, '').trim();
};

const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseKey();

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Key is missing!');
  throw new Error('Missing Supabase environment variables. Please check your .env file or Vercel settings.');
}

// Single Supabase client for everything (listings, projects, quotes, users)
// All tables are in the public schema of the Sold2Move database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Legacy aliases - all point to the same client
export const supabasePublic = supabase;
export const supabaseSold2Move = supabase;
