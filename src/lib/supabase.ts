import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Sold2Move project for listings
const sold2MoveUrl = process.env.REACT_APP_SOLD2MOVE_URL;
const sold2MoveAnonKey = process.env.REACT_APP_SOLD2MOVE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Main client for MovSense tables
// Note: Using default 'public' schema until movsense schema is created in database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Secondary client for accessing public schema tables
// Same as main client since both use public schema
export const supabasePublic = supabase;

// Client for Sold2Move project (property listings)
// Falls back to supabasePublic if Sold2Move credentials are not available
export const supabaseSold2Move = (sold2MoveUrl && sold2MoveAnonKey)
  ? createClient(sold2MoveUrl, sold2MoveAnonKey)
  : supabasePublic;
