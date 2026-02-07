
import React, { useState, useEffect } from 'react';

interface BodyDoublingProps {
  onClose: () => void;
}

const BodyDoubling: React.FC<BodyDoublingProps> = ({ onClose }) => {
    const [timer, setTimer] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [goal, setGoal] = useState('');
    const [isGoalSet, setIsGoalSet] = useState(false);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timer > 0) {
          interval = setInterval(() => setTimer(t => t - 1), 1000);
        } else if (timer === 0) {
          setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timer]);
    
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleStart = () => {
        if (goal.trim()) {
            setIsGoalSet(true);
            setIsActive(true);
        }
    }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl p-8 flex flex-col gap-6 animate-in zoom-in duration-300 relative">
        <button onClick={onClose} className="absolute top-4 inset-inline-start-4 text-slate-300 hover:text-slate-500 text-2xl font-bold z-10">×</button>
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">👥</div>
          <h2 className="text-2xl font-black text-slate-800">סשן פוקוס משותף (Body Doubling)</h2>
          <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed max-w-lg mx-auto">
            Body Doubling היא טכניקה בה עובדים "לצד" אדם אחר (אמיתי או וירטואלי) כדי להגביר את המיקוד. השתמש בסביבה הווירטואלית הזו כדי להישאר במסלול.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="w-full aspect-video bg-slate-800 rounded-2xl overflow-hidden">
                 <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/gGoT_c2kY5w?autoplay=1&mute=1&loop=1&playlist=gGoT_c2kY5w" 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen>
                </iframe>
            </div>
            <div className="text-center space-y-4">
                 <div className="text-6xl font-mono font-bold text-slate-800">{formatTime(timer)}</div>
                 {isGoalSet ? (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-400">המטרה שלך לסשן זה:</p>
                        <p className="font-bold text-indigo-700">{goal}</p>
                    </div>
                 ) : (
                    <input 
                        type="text"
                        value={goal}
                        onChange={e => setGoal(e.target.value)}
                        placeholder="מה המטרה שלך ל-25 הדקות הקרובות?"
                        className="w-full text-center p-3 rounded-lg border border-slate-200"
                    />
                 )}
                 {!isGoalSet ? (
                    <button onClick={handleStart} disabled={!goal.trim()} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50">התחל סשן</button>
                ) : (
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className={`w-full py-4 rounded-2xl font-bold text-lg ${isActive ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white'}`}
                    >
                        {isActive ? 'השהה' : 'המשך'}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default BodyDoubling;