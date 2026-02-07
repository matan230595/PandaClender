
import React, { useState, useEffect } from 'react';
import { Task, ReminderConfig, CustomReminder } from '../lib/types';

interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onSubTaskToggle: (taskId: string, subTaskId: string) => void;
  onAddSubTask: (taskId: string, title: string) => void;
  onStartPomodoro: (task: Task) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
    task, onClose, onUpdateTask, onDeleteTask, onCompleteTask, onSubTaskToggle, onAddSubTask, onStartPomodoro
}) => {
  const [editedTask, setEditedTask] = useState<Task>(task);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');

  // Update local state if the task prop changes from outside
  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const handleInputChange = (field: keyof Task, value: any) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
  };
  
  const handleReminderChange = (field: keyof ReminderConfig, value: any) => {
    setEditedTask(prev => ({ ...prev, reminders: { ...prev.reminders, [field]: value }}));
  };
  
  const handleCustomReminderChange = (value: string, unit: CustomReminder['unit']) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue <= 0) {
      handleReminderChange('custom', null);
    } else {
      handleReminderChange('custom', { value: numValue, unit });
    }
  };

  const handleSave = () => {
    onUpdateTask(editedTask);
    onClose(); // Close after saving
  };
  
  const handleDelete = () => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק את המשימה הזו לצמיתות?")) {
      onDeleteTask(task.id);
      onClose();
    }
  };

  const handleAddSubTaskKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newSubTaskTitle.trim()) {
      onAddSubTask(task.id, newSubTaskTitle);
      // This won't reflect immediately in `editedTask` as state is managed in App.tsx
      // We rely on the parent to pass down the updated task object.
      setNewSubTaskTitle('');
    }
  };
  
  const completedSubTasks = editedTask.subTasks.filter(st => st.completed).length;
  const totalSubTasks = editedTask.subTasks.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">פרטי משימה</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
        </div>

        {/* Main Details */}
        <div className="space-y-4">
          <input type="text" value={editedTask.title} onChange={e => handleInputChange('title', e.target.value)} className="w-full text-2xl font-black border-b-2 border-slate-100 focus:border-indigo-500 outline-none pb-1" />
          <textarea value={editedTask.description || ''} onChange={e => handleInputChange('description', e.target.value)} placeholder="הוסף תיאור או הערות..." className="w-full h-24 p-2 bg-slate-50 rounded-lg text-sm" />
        </div>

        {/* Sub Tasks */}
        <div>
          <h3 className="text-sm font-bold text-slate-600 mb-2">תתי-משימות</h3>
          <div className="space-y-2">
            {editedTask.subTasks.map(st => (
              <label key={st.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg cursor-pointer">
                <input type="checkbox" checked={st.completed} onChange={() => onSubTaskToggle(task.id, st.id)} className="w-4 h-4 accent-indigo-600" />
                <span className={`text-sm ${st.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{st.title}</span>
              </label>
            ))}
             {totalSubTasks > 0 && (
                <div className="flex items-center justify-start gap-2 pt-2">
                    <span className="text-xs font-bold text-slate-400">{completedSubTasks}/{totalSubTasks} הושלמו</span>
                    <progress 
                        className="w-full h-1.5 rounded-full [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:bg-indigo-500 [&::-moz-progress-bar]:bg-indigo-500" 
                        value={completedSubTasks} 
                        max={totalSubTasks} 
                    />
                </div>
            )}
            <input type="text" placeholder="+ הוסף תת-משימה (Enter)" value={newSubTaskTitle} onChange={e => setNewSubTaskTitle(e.target.value)} onKeyPress={handleAddSubTaskKeyPress} className="w-full bg-transparent border-b border-slate-200 text-sm focus:border-indigo-500 outline-none pt-2" />
          </div>
        </div>

        {/* Reminders */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-600 mb-2">תזכורות</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {(['dayBefore', 'hourBefore', 'fifteenMinBefore'] as (keyof ReminderConfig)[]).map(key => (
              <button key={key} onClick={() => handleReminderChange(key, !editedTask.reminders[key])} className={`py-2 rounded-lg text-xs font-bold border ${editedTask.reminders[key] ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {key === 'dayBefore' ? 'יום לפני' : key === 'hourBefore' ? 'שעה לפני' : '15 דקות לפני'}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
            <input type="number" placeholder="זמן" value={editedTask.reminders.custom?.value || ''} onChange={e => handleCustomReminderChange(e.target.value, editedTask.reminders.custom?.unit || 'minutes')} className="w-16 p-1 text-center font-bold border-b-2 border-slate-200 focus:border-indigo-500 outline-none bg-transparent" />
            <select value={editedTask.reminders.custom?.unit || 'minutes'} onChange={e => handleCustomReminderChange(String(editedTask.reminders.custom?.value || ''), e.target.value as any)} className="flex-1 bg-transparent font-bold text-sm text-indigo-800 focus:outline-none">
              <option value="minutes">דקות לפני</option>
              <option value="hours">שעות לפני</option>
              <option value="days">ימים לפני</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
           <button onClick={() => { onStartPomodoro(task); onClose(); }} className="w-full py-3 bg-red-500 text-white rounded-xl font-bold">🍅 הפעל פומודורו</button>
           <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={handleSave} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">שמור שינויים</button>
              <button onClick={() => onCompleteTask(task.id)} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold">סמן כהושלם</button>
              <button onClick={handleDelete} className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-bold">מחק</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;