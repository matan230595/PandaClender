
import React from 'react';
import { Task, Priority } from '../lib/types';

interface WeeklyCalendarProps {
  tasks: Task[];
  onDayClick: (date: Date) => void;
}

const WeeklyCalendar: React.FC<WeeklyCalendarProps> = ({ tasks, onDayClick }) => {
  const days = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - today.getDay() + i);
    return d;
  });

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <h2 className="text-xl font-bold text-slate-800 mb-6">השבוע במבט על</h2>
      
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((date, idx) => {
          const isToday = date.toDateString() === today.toDateString();
          const dayTasks = tasks.filter(t => t.dueDate.toDateString() === date.toDateString());

          return (
            <button key={idx} onClick={() => onDayClick(date)} className="flex flex-col min-h-[160px] border border-slate-100 rounded-2xl overflow-hidden bg-slate-50 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
              <div className={`p-2 text-center border-b ${isToday ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>
                <div className="text-[10px] font-bold uppercase">{days[idx]}</div>
                <div className="text-sm font-black">{date.getDate()}</div>
              </div>
              
              <div className="p-1 flex flex-col gap-1 overflow-y-auto max-h-[120px]">
                {dayTasks.map(task => (
                  <div 
                    key={task.id}
                    className="text-[9px] font-bold p-1 rounded-md border truncate"
                    style={{
                      backgroundColor: task.priority === Priority.URGENT ? 'var(--urgent-color-light)' : task.priority === Priority.IMPORTANT ? 'var(--important-color-light)' : 'var(--regular-color-light)',
                      borderColor: task.priority === Priority.URGENT ? 'var(--urgent-color)' : task.priority === Priority.IMPORTANT ? 'var(--important-color)' : 'var(--regular-color)',
                      color: task.priority === Priority.URGENT ? 'var(--urgent-color)' : task.priority === Priority.IMPORTANT ? 'var(--important-color)' : 'var(--regular-color)',
                    }}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length === 0 && <div className="h-4" />}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 flex gap-4 text-xs font-bold text-slate-400">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--urgent-color)'}}></div> דחוף</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--important-color)'}}></div> חשוב</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--regular-color)'}}></div> רגיל</div>
      </div>
    </div>
  );
};

export default WeeklyCalendar;