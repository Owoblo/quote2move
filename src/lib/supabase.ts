import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Sold2Move project for listings
const sold2MoveUrl = process.env.REACT_APP_SOLD2MOVE_URL;
const sold2MoveAnonKey = process.env.REACT_APP_SOLD2MOVE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!sold2MoveUrl || !sold2MoveAnonKey) {
  throw new Error('Missing Sold2Move Supabase environment variables');
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

// Client for Sold2Move project (property listings)
export const supabaseSold2Move = createClient(sold2MoveUrl, sold2MoveAnonKey);
