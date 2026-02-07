import React, { useState } from 'react';
import { tasksApi } from '../lib/db/tasks';
import { useAuth } from '../providers/AuthProvider';
import Alert from './Alert';

interface TaskFormProps {
  onSuccess: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setLoading(true);
    setError('');

    try {
      await tasksApi.create(user.id, title.trim());
      setTitle('');
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <Alert message={error} type="error" />
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task..."
          className="flex-1 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="px-6 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? '...' : 'Add'}
        </button>
      </form>
    </div>
  );
};

export default TaskForm;