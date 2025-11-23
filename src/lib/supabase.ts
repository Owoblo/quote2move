import { createClient } from '@supabase/supabase-js';

// Using SOLD2MOVE as the single active database
// This database contains EVERYTHING: listings, projects, quotes, users, etc.
const getEnvVar = (key1: string, key2: string): string => {
  const val = process.env[key1] || process.env[key2] || '';
  return val.trim();
};

const supabaseUrl = getEnvVar('REACT_APP_SOLD2MOVE_URL', 'REACT_APP_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('REACT_APP_SOLD2MOVE_ANON_KEY', 'REACT_APP_SUPABASE_ANON_KEY');

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
