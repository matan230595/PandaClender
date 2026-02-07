
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These environment variables must be set in your deployment environment (e.g., Vercel).
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// The application now expects these variables to be present.
// If they are not, Supabase API calls will fail, which is the expected behavior
// when environment variables are not configured correctly.
export const supabase: SupabaseClient = createClient(supabaseUrl || '', supabaseAnonKey || '');
