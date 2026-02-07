
import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../types';

interface PomodoroProps {
  onClose: () => void;
  task?: Task | null;
  activeSound?: string;
  purchasedSoundPacks: string[];
}

const SOUNDS: Record<string, { name: string; src: string; icon: string }> = {
  none: { name: 'ללא', src: '', icon: '🔇' },
  brownNoise: { name: 'רעש חום', src: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Brown-noise.ogg', icon: '🌊' },
  lofi: { name: 'Lofi Beats', src: 'https://assets.mixkit.co/music/preview/mixkit-lofi-chill-medium-version-120.mp3', icon: '🎧' },
  nature: { name: 'צלילי טבע', src: 'https://assets.mixkit.co/sfx/preview/mixkit-calm-river-ambience-2541.mp3', icon: '🏞️' },
  cafe: { name: 'רעשי בית קפה', src: 'https://assets.mixkit.co/sfx/preview/mixkit-country-cafe-ambience-223.mp3', icon: '☕' },
};

const TIME_OPTIONS: Record<string, { work: number; break: number; label: string }> = {
  '15/3': { work: 15 * 60, break: 3 * 60, label: '15/3' },
  '25/5': { work: 25 * 60, break: 5 * 60, label: '25/5' },
  '50/10': { work: 50 * 60, break: 10 * 60, label: '50/10' },
};

const Pomodoro: React.FC<PomodoroProps> = ({ onClose, task, activeSound = 'none', purchasedSoundPacks }) => {
  const [workDuration, setWorkDuration] = useState(25 * 60);
  const [breakDuration, setBreakDuration] = useState(5 * 60);
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  
  const [selectedSound, setSelectedSound] = useState(activeSound);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);


  // Initialize notification sound
  useEffect(() => {
    notificationAudioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3');
  }, []);

  // Main timer logic effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false); 
      if (notificationAudioRef.current) {
        notificationAudioRef.current.play().catch(e => console.error("Notification sound failed", e));
      }
      const nextMode = mode === 'work' ? 'break' : 'work';
      setMode(nextMode);
      setTimeLeft(nextMode === 'work' ? workDuration : breakDuration);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, workDuration, breakDuration]);
  
  // Initialize Audio element instance on mount for ambient sound
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    const audioEl = audioRef.current;

    // Cleanup on component unmount
    return () => {
      audioEl.pause();
      audioEl.src = '';
    };
  }, []);

  // Effect to control audio playback based on state changes
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const soundSrc = SOUNDS[selectedSound]?.src || '';
    const shouldPlay = isActive && selectedSound !== 'none' && !!soundSrc;

    audioEl.volume = volume;

    if (shouldPlay) {
      // If the source is incorrect, update it
      if (audioEl.currentSrc !== soundSrc) {
        audioEl.src = soundSrc;
      }
      // Play if it's currently paused
      if (audioEl.paused) {
        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error("Audio playback failed:", error);
          });
        }
      }
    } else {
      // Pause if it's currently playing
      if (!audioEl.paused) {
        audioEl.pause();
      }
    }
  }, [isActive, selectedSound, volume]);


  const togglePlayPause = () => {
    setIsActive(prev => !prev);
  };
  
  const selectTimeOption = (key: string) => {
    const { work, break: breakTime } = TIME_OPTIONS[key];
    setIsActive(false);
    setWorkDuration(work);
    setBreakDuration(breakTime);
    setMode('work');
    setTimeLeft(work);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? workDuration : breakDuration);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 shadow-2xl p-6 relative w-full max-w-xs animate-in slide-in-from-bottom-5 duration-300">
      <button onClick={onClose} className="absolute top-4 inset-inline-start-4 text-slate-300 hover:text-slate-500 text-lg font-bold">×</button>
      
      <div className="text-center mt-2 space-y-4">
        {task && (
          <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100 text-center">
            <p className="text-[10px] font-bold text-indigo-400">בפוקוס על:</p>
            <p className="text-xs font-bold text-indigo-800 truncate">{task.title}</p>
          </div>
        )}
        <div className="flex justify-center bg-slate-50 p-1 rounded-full">
          {Object.entries(TIME_OPTIONS).map(([key, { label }]) => (
            <button key={key} onClick={() => selectTimeOption(key)} 
              className={`flex-1 text-[10px] font-black px-2 py-1 rounded-full transition-all ${
                workDuration === TIME_OPTIONS[key].work ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'
              }`}>
              {label}
            </button>
          ))}
        </div>
        
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
          mode === 'work' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
        }`}>
          {mode === 'work' ? 'זמן עבודה' : 'זמן הפסקה'}
        </span>
        
        <div className="text-5xl font-black text-slate-800 font-mono">
          {formatTime(timeLeft)}
        </div>

        <div className="flex gap-2">
          <button onClick={togglePlayPause} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isActive ? 'bg-slate-100 text-slate-600' : 'bg-red-500 text-white shadow-md'}`}>
            {isActive ? 'השהה' : 'התחל'}
          </button>
          <button onClick={resetTimer} className="px-4 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 text-lg">
            🔄
          </button>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex justify-around items-center">
                {Object.entries(SOUNDS)
                    .filter(([key]) => purchasedSoundPacks.includes(key))
                    .map(([key, { icon, name }]) => (
                    <button key={key} onClick={() => setSelectedSound(key)} title={name} className={`w-8 h-8 rounded-full text-sm transition-all flex items-center justify-center ${
                      selectedSound === key ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-100 text-slate-500'
                    }`}>
                        {icon}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">🔉</span>
                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  disabled={selectedSound === 'none'}
                />
                <span className="text-xs text-slate-400">🔊</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Pomodoro;
