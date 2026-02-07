
import React, { useState, useEffect, useRef } from 'react';
import { Habit } from '../lib/types';

interface HabitReminderSystemProps {
  habits: Habit[];
  onToggleHabit: (habitId: string) => void;
}

const getDefaultReminderTimes = (): Record<Habit['timeOfDay'], string> => {
    const defaults = { morning: '08:00', noon: '13:00', evening: '20:00' };
    try {
        const stored = localStorage.getItem('ff_habit_reminder_times');
        if (stored) {
            return { ...defaults, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error("Failed to parse habit reminder times", e);
    }
    return defaults;
};


const HabitReminderSystem: React.FC<HabitReminderSystemProps> = ({ habits, onToggleHabit }) => {
  const [activeReminder, setActiveReminder] = useState<Habit | null>(null);
  const firedReminders = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkHabitReminders = () => {
        if(activeReminder) return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        const todayStr = now.toISOString().split('T')[0];
        const reminderTimes = getDefaultReminderTimes();

        for(const habit of habits) {
            const timeStr = reminderTimes[habit.timeOfDay]; // e.g., "08:00"
            const [reminderHour, reminderMinute] = timeStr.split(':').map(Number);

            const isCompleted = habit.completedDays.includes(todayStr);
            const reminderKey = `${habit.id}-${todayStr}`;
            
            const isTime = currentHour === reminderHour && currentMinutes === reminderMinute;

            if (!isCompleted && isTime && !firedReminders.current.has(reminderKey)) {
                setActiveReminder(habit);
                firedReminders.current.add(reminderKey);
                if ("Notification" in window && Notification.permission === "granted") {
                    new Notification(`זמן להרגל!`, { body: `רק רציתי להזכיר לך על "${habit.title}"` });
                }
                break; // Show one at a time
            }
        }
    };

    const interval = setInterval(checkHabitReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [habits, activeReminder]);
  
  const handleClose = () => setActiveReminder(null);
  const handleComplete = () => {
      if(activeReminder) onToggleHabit(activeReminder.id);
      handleClose();
  };

  if (!activeReminder) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-3xl shadow-2xl p-6 bg-white relative border-4 border-emerald-300 animate-in slide-in-from-bottom-5 duration-500">
        <button onClick={handleClose} className="absolute top-4 inset-inline-start-4 text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
        
        <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
                {activeReminder.icon}
            </div>
            <h2 className="text-xl font-black text-slate-800 mb-1">הגיע הזמן להרגל שלך!</h2>
            <p className="text-lg font-bold text-emerald-600 mb-4">"{activeReminder.title}"</p>
            <p className="text-xs text-slate-400 mb-4">בניית הרגלים קטנים מובילה להצלחות גדולות. אתה יכול לעשות את זה!</p>
        </div>
        
        <div className="flex gap-3">
            <button onClick={handleClose} className="flex-1 py-3 text-sm font-bold bg-slate-100 text-slate-500 rounded-xl">אחרי זה</button>
            <button 
                onClick={handleComplete}
                className="flex-1 py-3 text-sm font-bold bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-200"
            >
                בוצע!
            </button>
        </div>
      </div>
    </div>
  );
};

export default HabitReminderSystem;