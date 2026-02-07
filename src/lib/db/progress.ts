import { supabase } from '../supabaseClient';
import { UserProgress } from '../types';

export const progressApi = {
  // Get progress for a user
  get: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data as UserProgress | null;
  },

  // Initialize new user progress
  initialize: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_progress')
      .insert({
        user_id: userId,
        achievements: [],
        streak: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data as UserProgress;
  },

  // Ensure row exists (called on Dashboard load)
  ensureExists: async (userId: string) => {
    const existing = await progressApi.get(userId);
    if (existing) return existing;
    return await progressApi.initialize(userId);
  }
};