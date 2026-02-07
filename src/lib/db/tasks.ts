import { supabase } from '../supabaseClient';
import { Task, TaskStatus } from '../types';

export const tasksApi = {
  list: async (userId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Task[];
  },

  create: async (userId: string, title: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title,
        status: 'todo',
        description: ''
      })
      .select()
      .single();

    if (error) throw error;
    return data as Task;
  },

  updateStatus: async (taskId: string, status: TaskStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) throw error;
  },

  delete: async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  }
};