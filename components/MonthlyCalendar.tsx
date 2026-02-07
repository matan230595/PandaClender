
import React from 'react';
import { Task, Priority } from '../types';

interface MonthlyCalendarProps {
  tasks: Task[];
  onDayClick: (date: Date) => void;
}

const MonthlyCalendar: React.FC<MonthlyCalendarProps> = ({ tasks, onDayClick }) => {
  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const numDays = daysInMonth(currentMonth, currentYear);
  const startDay = firstDayOfMonth(currentMonth, currentYear);

  const daysArr = Array.from({ length: 42 }, (_, i) => {
    const day = i - startDay + 1;
    if (day > 0 && day <= numDays) return day;
    return null;
  });

  const weekLabels = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          {today.toLocaleString('he-IL', { month: 'long', year: 'numeric' })}
        </h2>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekLabels.map(label => (
          <div key={label} className="text-center text-xs font-bold text-slate-400 py-2">{label}</div>
        ))}
        {daysArr.map((day, idx) => {
          if (day === null) return <div key={idx} className="h-20 bg-slate-50/50 rounded-xl" />;
          
          const isToday = day === today.getDate();
          const dayDate = new Date(currentYear, currentMonth, day);
          const dayTasks = tasks.filter(t => t.dueDate.toDateString() === dayDate.toDateString());

          return (
            <button 
              key={idx} 
              onClick={() => onDayClick(dayDate)}
              className={`h-20 border border-slate-100 rounded-xl p-1 overflow-hidden transition-colors text-start ${isToday ? 'bg-indigo-50 border-indigo-200' : 'bg-white hover:bg-slate-50'}`}
            >
              <div className={`text-[10px] font-black mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 2).map(task => (
                  <div 
                    key={task.id} 
                    className="text-[7px] p-0.5 rounded border truncate"
                     style={{
                      backgroundColor: task.priority === Priority.URGENT ? 'var(--urgent-color-light)' : task.priority === Priority.IMPORTANT ? 'var(--important-color-light)' : 'var(--regular-color-light)',
                      borderColor: task.priority === Priority.URGENT ? 'var(--urgent-color)' : task.priority === Priority.IMPORTANT ? 'var(--important-color)' : 'var(--regular-color)',
                    }}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="text-[6px] text-slate-400 font-bold text-center">+{dayTasks.length - 2} נוספים</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MonthlyCalendar;
