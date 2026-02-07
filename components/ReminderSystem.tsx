
import React, { useState, useEffect, useRef } from 'react';
import { Task, Priority } from '../types';

interface ReminderSystemProps {
  tasks: Task[];
  onComplete: (taskId: string) => void;
  onSnooze: (taskId: string, minutes: number) => void;
}

interface ReminderData {
  task: Task;
  type: 'dayBefore' | 'hourBefore' | 'fifteenMin' | 'now' | 'custom';
  label: string;
  advice: string;
  severity: 'info' | 'warning' | 'danger';
}

const getAdhdAdvice = (task: Task, type: ReminderData['type']): string => {
  const adviceMap = {
    dayBefore: "הכנת חומרים מראש מפחיתה עומס קוגניטיבי מחר.",
    hourBefore: "זמן לסגור הסחות דעת. שתה מים והתחל להתמקד.",
    fifteenMin: "זמן מעבר! פתח את כל מה שצריך. פוקוס מלא בדרך.",
    custom: "תזכורת מותאמת אישית שהגדרת. התכונן בהתאם.",
    now: "אל תחשוב על כל המטלה, רק על הצעד הראשון. התחל עכשיו!",
  };
  
  let advice = adviceMap[type];
  if (task.priority === Priority.URGENT) {
    advice = `🚨 דחוף: ${advice} פעל בנחישות, אין זמן לדחיינות!`;
  }
  return advice;
};

const ReminderSystem: React.FC<ReminderSystemProps> = ({ tasks, onComplete, onSnooze }) => {
  const [activeReminder, setActiveReminder] = useState<ReminderData | null>(null);
  const [showCustomSnooze, setShowCustomSnooze] = useState(false);
  const [customSnoozeMinutes, setCustomSnoozeMinutes] = useState('45');
  const firedReminders = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkReminders = () => {
      if(activeReminder) return; // Don't show new reminder if one is already active
      const now = Date.now();
      
      for (const task of tasks) {
        if (task.completed) continue;

        const dueTime = task.dueDate.getTime();
        const diffInMs = dueTime - now;
        const diffInMin = Math.round(diffInMs / 60000);

        const checkAndTrigger = (type: ReminderData['type'], condition: boolean, label: string, severity: ReminderData['severity']) => {
            const key = `${task.id}-${type}-${new Date(task.dueDate).toISOString()}`; // Make key unique to due date
            if (condition && !firedReminders.current.has(key)) {
                const advice = getAdhdAdvice(task, type);
                setActiveReminder({ task, type, label, advice, severity });
                firedReminders.current.add(key);
                 if ("Notification" in window && Notification.permission === "granted") {
                    new Notification(label, { body: task.title });
                }
                return true; // Stop checking for this task
            }
            return false;
        };

        if(checkAndTrigger('now', diffInMin <= 0 && diffInMin > -5, 'תזכורת: עכשיו!', 'danger')) break;
        if(checkAndTrigger('fifteenMin', task.reminders.fifteenMinBefore && diffInMin <= 15 && diffInMin > 10, 'תזכורת: 15 דקות!', 'danger')) break;
        if(checkAndTrigger('hourBefore', task.reminders.hourBefore && diffInMin <= 60 && diffInMin > 55, 'תזכורת: עוד שעה!', 'warning')) break;

        if(task.reminders.custom) {
            const { value, unit } = task.reminders.custom;
            let reminderMinutes = 0;
            if (unit === 'minutes') reminderMinutes = value;
            if (unit === 'hours') reminderMinutes = value * 60;
            if (unit === 'days') reminderMinutes = value * 60 * 24;
            
            if(checkAndTrigger('custom', diffInMin <= reminderMinutes && diffInMin > reminderMinutes - 5, `תזכורת: ${value} ${unit === 'days' ? 'ימים' : unit === 'hours' ? 'שעות' : 'דקות'} לפני`, 'warning')) break;
        }
        if(checkAndTrigger('dayBefore', task.reminders.dayBefore && diffInMin <= 1440 && diffInMin > 1430, 'תזכורת: מחר!', 'info')) break;
      }
    };

    const interval = setInterval(checkReminders, 5000); // Check more frequently
    return () => clearInterval(interval);
  }, [tasks, activeReminder]);

  const handleClose = () => {
    setShowCustomSnooze(false);
    setActiveReminder(null);
  };
  const handleSnooze = (minutes: number) => {
    if(activeReminder) onSnooze(activeReminder.task.id, minutes);
    handleClose();
  };
  const handleComplete = () => {
    if(activeReminder) onComplete(activeReminder.task.id);
    handleClose();
  };

  const handleCustomSnoozeSubmit = () => {
    const customMinutes = parseInt(customSnoozeMinutes, 10);
    if (!isNaN(customMinutes) && customMinutes > 0) {
      handleSnooze(customMinutes);
    }
  };


  if (!activeReminder) return null;

  const severityStyles = {
    info: 'border-indigo-400 bg-indigo-50 text-indigo-900',
    warning: 'border-orange-400 bg-orange-50 text-orange-900',
    danger: 'border-red-500 bg-red-50 text-red-900'
  };

  const severityIcon = { info: '📅', warning: '⏳', danger: '🚨', custom: '🔔' };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full max-w-sm rounded-[40px] shadow-2xl border-4 p-8 text-center bg-white relative ${severityStyles[activeReminder.severity]}`}>
        <button onClick={handleClose} className="absolute top-4 inset-inline-start-4 text-slate-400 hover:text-slate-600 text-2xl font-bold">×</button>
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${activeReminder.severity === 'danger' ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100'}`}>
          <span className="text-4xl">{severityIcon[activeReminder.type] || '🔔'}</span>
        </div>
        
        <h2 className="text-2xl font-black mb-1">{activeReminder.label}</h2>
        <p className="text-xl font-bold text-slate-800 mb-4 leading-tight">"{activeReminder.task.title}"</p>
        
        <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-200">
          <p className="text-sm font-bold text-slate-400 mb-1">טיפ ADHD לפוקוס:</p>
          <p className="text-sm font-medium text-slate-600 leading-relaxed">
            {activeReminder.advice}
          </p>
        </div>
        
        <div className="space-y-3">
            <button 
                onClick={handleComplete}
                className="w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 bg-emerald-500 text-white hover:bg-emerald-600"
            >
                🎉 סיימתי!
            </button>
            {!showCustomSnooze ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    <button onClick={() => handleSnooze(5)} className="col-span-1 sm:col-span-1 py-2 text-xs font-bold bg-white/50 border border-slate-200 text-slate-500 rounded-lg">5 דקות</button>
                    <button onClick={() => handleSnooze(10)} className="col-span-1 sm:col-span-1 py-2 text-xs font-bold bg-white/50 border border-slate-200 text-slate-500 rounded-lg">10 דקות</button>
                    <button onClick={() => handleSnooze(15)} className="col-span-1 sm:col-span-1 py-2 text-xs font-bold bg-white/50 border border-slate-200 text-slate-500 rounded-lg">15 דקות</button>
                    <button onClick={() => handleSnooze(30)} className="col-span-1 sm:col-span-1 py-2 text-xs font-bold bg-white/50 border border-slate-200 text-slate-500 rounded-lg">30 דקות</button>
                    <button onClick={() => setShowCustomSnooze(true)} className="col-span-2 sm:col-span-1 py-2 text-xs font-bold bg-white/50 border border-slate-200 text-slate-500 rounded-lg">מותאם</button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={customSnoozeMinutes}
                        onChange={e => setCustomSnoozeMinutes(e.target.value)}
                        className="w-20 p-2 text-center font-bold bg-white/50 border border-slate-200 text-slate-500 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none"
                        autoFocus
                    />
                    <button
                        onClick={handleCustomSnoozeSubmit}
                        className="flex-1 py-2 text-xs font-bold bg-indigo-600 text-white rounded-lg"
                    >
                        הפעל נודניק
                    </button>
                    <button
                        onClick={() => setShowCustomSnooze(false)}
                        className="py-2 px-3 text-xs font-bold bg-slate-100 text-slate-500 rounded-lg"
                    >
                        ביטול
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ReminderSystem;