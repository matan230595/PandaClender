// Fix: Add reference to vite/client to provide types for import.meta.env
/// <reference types="vite/client" />

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;
let initializationError: string | null = null;

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("משתני סביבה של Supabase אינם מוגדרים. אנא הגדר את VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY בסביבת הפריסה שלך.");
  }
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} catch (error: any) {
  initializationError = error.message;
  console.error("Supabase initialization error:", error.message);
}

export const supabase = supabaseInstance;
export const supabaseInitializationError = initializationError;