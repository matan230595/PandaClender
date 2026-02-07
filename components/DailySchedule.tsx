
import React from 'react';
import { Task, Priority } from '../lib/types';

interface DailyScheduleProps {
  tasks: Task[];
  onComplete: (id: string) => void;
}

const DailySchedule: React.FC<DailyScheduleProps> = ({ tasks, onComplete }) => {
  const hours = Array.from({ length: 15 }, (_, i) => i + 8); // 8:00 to 22:00
  const today = new Date();
  
  const todayTasks = tasks.filter(t => new Date(t.dueDate).toDateString() === today.toDateString());

  const getTaskForHour = (hour: number) => {
    return todayTasks.filter(t => new Date(t.dueDate).getHours() === hour);
  };
  
  const unscheduledTasks = todayTasks.filter(t => !hours.includes(new Date(t.dueDate).getHours()));

  const priorityColorVar: Record<Priority, string> = {
    [Priority.URGENT]: 'var(--urgent-color)',
    [Priority.IMPORTANT]: 'var(--important-color)',
    [Priority.REGULAR]: 'var(--regular-color)',
  };
  
  const TaskItem: React.FC<{task: Task}> = ({ task }) => (
    <div 
      key={task.id} 
      className={`p-3 rounded-2xl border-e-4 shadow-sm flex items-center justify-between group bg-white ${task.completed ? 'opacity-50' : ''}`}
      style={{ borderInlineEndColor: priorityColorVar[task.priority] }}
    >
      <div className="flex items-center gap-3">
         <button 
          onClick={() => onComplete(task.id)}
          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
            task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
          }`}
        >
          {task.completed && '✓'}
        </button>
         <span className={`text-sm font-bold ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {task.title}
        </span>
      </div>
      <span className="text-[10px] font-bold text-slate-300">{task.category}</span>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        📅 סדר יום לשלווה ופוקוס
      </h2>

      {unscheduledTasks.length > 0 && (
          <div className="mb-6 pb-4 border-b border-dashed border-slate-200">
              <h3 className="text-sm font-bold text-slate-500 mb-3">משימות להיום (ללא שעה)</h3>
              <div className="space-y-2">
                  {unscheduledTasks.map(task => <TaskItem key={task.id} task={task} />)}
              </div>
          </div>
      )}

      <div className="relative space-y-4">
        {hours.map(hour => {
          const hourTasks = getTaskForHour(hour);
          return (
            <div key={hour} className="flex flex-row gap-4 min-h-[60px]">
              <div className="w-12 text-end pt-1">
                <span className="text-xs font-black text-slate-400">{hour}:00</span>
              </div>
              <div className="flex-grow border-t border-slate-100 pt-3 relative">
                {hourTasks.length > 0 ? (
                  <div className="space-y-2">
                    {hourTasks.map(task => <TaskItem key={task.id} task={task} />)}
                  </div>
                ) : (
                  <div className="h-full border-s-2 border-slate-50 border-dashed ms-4"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailySchedule;