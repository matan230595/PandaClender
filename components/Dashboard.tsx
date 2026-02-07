
import React, { useState, useEffect } from 'react';
import { Task, Habit, UserProgress, Priority, EnergyLevel } from '../types';
import { ENERGY_LEVEL_ICONS, CATEGORY_ICONS } from '../constants';

interface DashboardProps {
  tasks: Task[];
  habits: Habit[];
  progress: UserProgress;
  onSendEmail: (type: 'day' | 'week') => Promise<void>;
  isProcessing: false | 'day' | 'week';
  onOpenAiCoach: () => void;
  onOpenBodyDoubling: () => void;
  onOpenAiAudioTools: () => void;
  onFocus: (id: string) => void;
  onComplete: (id: string) => void;
  onViewTask: (task: Task) => void;
}

const CountdownTimer: React.FC<{ snoozedUntil: number }> = ({ snoozedUntil }) => {
    const calculateTimeLeft = () => {
        const difference = snoozedUntil - Date.now();
        if (difference <= 0) return '00:00:00';
        
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
        const minutes = Math.floor((difference / 1000 / 60) % 60).toString().padStart(2, '0');
        const seconds = Math.floor((difference / 1000) % 60).toString().padStart(2, '0');
        
        return `${hours}:${minutes}:${seconds}`;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    return <span className="font-mono text-sm font-bold text-slate-500">{timeLeft}</span>;
};


const Dashboard: React.FC<DashboardProps> = ({ 
  tasks, habits, progress, onSendEmail, isProcessing, onOpenAiCoach, onOpenBodyDoubling, onOpenAiAudioTools, onFocus, onComplete, onViewTask
}) => {
  const [currentEnergy, setCurrentEnergy] = useState<EnergyLevel>('medium');

  const topTasks = tasks
      .filter(t => !t.completed && !t.snoozedUntil)
      .sort((a, b) => {
        const priorityOrder = { [Priority.URGENT]: 0, [Priority.IMPORTANT]: 1, [Priority.REGULAR]: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority] || a.dueDate.getTime() - b.dueDate.getTime();
      })
      .slice(0, 3);
  
  const suggestedTasks = tasks
    .filter(t => !t.completed && t.energyLevel === currentEnergy && !t.snoozedUntil)
    .slice(0, 3);
    
  const snoozedTasks = tasks.filter(t => t.snoozedUntil && t.snoozedUntil > Date.now());
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">היי, איזה כיף לראות אותך! 👋</h2>
          <p className="text-sm text-slate-400 font-bold">הנה מה שחשוב להיום:</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
           <button disabled={!!isProcessing} onClick={() => onSendEmail('day')} className="px-4 py-2 bg-white border border-indigo-100 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2">
             {isProcessing === 'day' ? '⌛' : '✉️'} שלח סיכום יומי
           </button>
           <button disabled={!!isProcessing} onClick={() => onSendEmail('week')} className="px-4 py-2 bg-white border border-indigo-100 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2">
             {isProcessing === 'week' ? '⌛' : '📅'} שלח סיכום שבועי
           </button>
        </div>
      </div>

      {/* Top 3 Tasks */}
      <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
         <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2 mb-4">
            🎯 3 המשימות הכי חשובות
          </h2>
          {topTasks.length === 0 ? (
            <p className="text-slate-400 font-medium text-center py-4">אין משימות דחופות כרגע. איזה כיף!</p>
          ) : (
            <div className="space-y-3">
              {topTasks.map(task => (
                <button key={task.id} onClick={() => onViewTask(task)} className="w-full bg-slate-50/50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between group text-start">
                  <div className="flex items-center gap-3">
                    <div onClick={(e) => { e.stopPropagation(); onComplete(task.id); }} className="w-5 h-5 rounded-full border-2 border-slate-300 hover:border-indigo-400 shrink-0 cursor-pointer"></div>
                    <div>
                      <h3 className="font-bold text-slate-800">{task.title}</h3>
                      <span className="text-xs text-slate-400">{CATEGORY_ICONS[task.category]}</span>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 bg-white text-slate-500 rounded-xl text-[10px] font-bold border border-slate-200 hover:bg-indigo-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                    🚀 פוקוס
                  </div>
                </button>
              ))}
            </div>
          )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Energy based tasks */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-700">מה רמת האנרגיה שלך כרגע?</h3>
          <div className="flex gap-2">
              {(['low', 'medium', 'high'] as EnergyLevel[]).map(level => (
                  <button key={level} onClick={() => setCurrentEnergy(level)} className={`flex-1 py-3 rounded-2xl text-xs font-black border-2 transition-all flex items-center justify-center gap-2 ${ currentEnergy === level ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'border-slate-100 text-slate-400 hover:bg-slate-50' }`}>
                    <span>{ENERGY_LEVEL_ICONS[level]}</span>
                    {level === 'low' ? 'נמוכה' : level === 'medium' ? 'בינונית' : 'גבוהה'}
                  </button>
              ))}
          </div>
          {suggestedTasks.length > 0 && (
            <div className="pt-4 border-t border-slate-50 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400">משימות מומלצות עבורך:</h4>
              {suggestedTasks.map(task => (
                <button onClick={() => onViewTask(task)} key={task.id} className="w-full text-start bg-slate-50 text-slate-700 text-xs font-bold p-2 rounded-lg hover:bg-slate-100">{task.title}</button>
              ))}
            </div>
          )}
        </div>
        
        {/* Quick actions */}
        <div className="space-y-4">
             <button onClick={onOpenAiCoach} className="w-full bg-indigo-50 p-5 rounded-[28px] border border-indigo-200 text-indigo-800 shadow-sm flex items-center gap-4 hover:bg-indigo-100 transition-colors text-start">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shrink-0">🤖</div>
                <div>
                  <p className="font-black">מאמן AI אישי</p>
                  <p className="text-[10px]">קבל טיפ מותאם אישית</p>
                </div>
            </button>
            <button onClick={onOpenBodyDoubling} className="w-full bg-emerald-50 p-5 rounded-[28px] border border-emerald-200 text-emerald-800 shadow-sm flex items-center gap-4 hover:bg-emerald-100 transition-colors text-start">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shrink-0">👥</div>
                <div>
                  <p className="font-black">Body Doubling</p>
                  <p className="text-[10px]">הישאר בפוקוס עם חבר</p>
                </div>
            </button>
             <button onClick={onOpenAiAudioTools} className="w-full bg-cyan-50 p-5 rounded-[28px] border border-cyan-200 text-cyan-800 shadow-sm flex items-center gap-4 hover:bg-cyan-100 transition-colors text-start">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shrink-0">🎙️</div>
                <div>
                  <p className="font-black">כלי אודיו AI</p>
                  <p className="text-[10px]">שיחה, תמלול ו-TTS</p>
                </div>
            </button>
        </div>
      </div>
      
      {snoozedTasks.length > 0 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                משימות בהמתנה
            </h3>
            <div className="space-y-2">
                {snoozedTasks.map(task => (
                    <div key={task.id} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-600">{task.title}</span>
                        <CountdownTimer snoozedUntil={task.snoozedUntil!} />
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
