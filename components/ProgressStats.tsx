
import React from 'react';
import { Task, Habit, UserProgress, Priority } from '../types';

interface ProgressStatsProps {
  tasks: Task[];
  habits: Habit[];
  progress: UserProgress;
}

const ProgressStats: React.FC<ProgressStatsProps> = ({ tasks, habits, progress }) => {
  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Simple Trend Mockup (Last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('he-IL', { weekday: 'short' });
  });

  const trendData = [3, 5, 2, 8, 4, 6, completedTasks]; // Mock historical data

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6">מדדי הצלחה</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-indigo-50 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">משימות שהושלמו</p>
            <p className="text-3xl font-black text-indigo-700">{completedTasks}</p>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl text-center">
            <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1">שיעור הצלחה</p>
            <p className="text-3xl font-black text-emerald-700">{taskCompletionRate}%</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700">מגמת פרודוקטיביות (שבועית)</h3>
            <span className="text-[10px] font-bold text-slate-400">משימות ליום</span>
          </div>
          <div className="h-32 flex items-end justify-between gap-2 pt-4 border-b border-slate-100">
            {trendData.map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div 
                  className="w-full bg-indigo-500 rounded-t-lg transition-all duration-500 hover:bg-indigo-600 relative cursor-help"
                  style={{ height: `${(val / 10) * 100}%` }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}
                  </div>
                </div>
                <span className="text-[8px] mt-2 font-bold text-slate-400">{last7Days[idx]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6">הישגים ועיטורים</h2>
        <div className="grid grid-cols-2 gap-4">
          {progress.achievements.map(ach => (
            <div 
              key={ach.id} 
              className={`p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
                ach.unlocked ? 'bg-white border-yellow-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-50'
              }`}
            >
              <span className={`text-4xl mb-2 ${ach.unlocked ? 'grayscale-0' : 'grayscale'}`}>{ach.icon}</span>
              <h4 className="text-xs font-bold text-slate-800">{ach.title}</h4>
              <p className="text-[9px] text-slate-400 mt-1 leading-tight">{ach.description}</p>
              {!ach.unlocked && <span className="text-[8px] font-bold text-slate-300 mt-2 uppercase tracking-widest">נעול</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-lg font-bold mb-2">הטיפ היומי לפוקוס 💡</h2>
          <p className="text-xs text-indigo-100 leading-relaxed italic">
            "ניצחונות קטנים מצטברים לשינויים גדולים. אם המשימה נראית גדולה מדי, פרק אותה ל-3 חלקים של 5 דקות."
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default ProgressStats;
