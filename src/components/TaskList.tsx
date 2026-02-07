import React from 'react';
import { Task, TaskStatus } from '../lib/types';
import { tasksApi } from '../lib/db/tasks';

interface TaskListProps {
  tasks: Task[];
  onChange: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, onChange }) => {
  const handleStatusChange = async (task: Task) => {
    try {
      const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
      await tasksApi.updateStatus(task.id, nextStatus);
      onChange();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(id);
      onChange();
    } catch (err) {
      alert('Failed to delete task');
    }
  };

  if (tasks.length === 0) {
    return <div className="text-center py-12 text-slate-500">No tasks yet.</div>;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleStatusChange(task)}
              className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                task.status === 'done' 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              {task.status === 'done' && '✓'}
            </button>
            <span className={`font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
              {task.title}
            </span>
          </div>
          <button
            onClick={() => handleDelete(task.id)}
            className="text-xs font-bold text-red-500 hover:text-red-700 px-2 py-1"
          >
            DELETE
          </button>
        </li>
      ))}
    </ul>
  );
};

export default TaskList;