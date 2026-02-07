
import React, { useState } from 'react';
import { Task } from '../lib/types';

interface CalendarDayModalProps {
  date: Date;
  tasks: Task[];
  onClose: () => void;
  onAddTask: (title: string) => void;
  onCompleteTask: (id: string) => void;
}

const CalendarDayModal: React.FC<CalendarDayModalProps> = ({ date, tasks, onClose, onAddTask, onCompleteTask }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in duration-300">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">
            משימות ליום {date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {tasks.length > 0 ? tasks.map(task => (
                <div key={task.id} className={`p-3 rounded-lg flex items-center gap-3 ${task.completed ? 'bg-slate-50 opacity-60' : 'bg-white'}`}>
                    <button onClick={() => onCompleteTask(task.id)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                        {task.completed && '✓'}
                    </button>
                    <span className={`font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{task.title}</span>
                </div>
            )) : (
                <p className="text-center text-slate-400 py-8">אין משימות מתוכננות ליום זה.</p>
            )}
        </div>

        <div className="pt-4 border-t border-slate-100">
            <input 
                type="text"
                placeholder="+ הוסף משימה חדשה ליום זה (Enter)"
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                onKeyPress={handleAddTask}
                className="w-full bg-slate-50 p-3 rounded-lg border border-slate-200 placeholder:text-slate-400"
            />
        </div>
      </div>
    </div>
  );
};

export default CalendarDayModal;