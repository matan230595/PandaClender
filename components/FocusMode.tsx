
import React, { useState, useEffect, useRef } from 'react';
import { Task, Priority } from '../lib/types';

interface FocusModeProps {
  task: Task;
  onClose: () => void;
  onComplete: () => void;
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

const FocusMode: React.FC<FocusModeProps> = ({ task, onClose, onComplete, activeSound = 'none', purchasedSoundPacks }) => {
  const [timer, setTimer] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [selectedSound, setSelectedSound] = useState(activeSound);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => t - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timer]);

  // Initialize Audio element instance on mount
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


  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 min-h-screen flex flex-col items-center justify-center p-6 text-white text-center overflow-y-auto">
      <button 
        onClick={onClose}
        className="fixed top-8 inset-inline-start-8 text-slate-400 hover:text-white text-3xl font-light transition-colors z-20"
      >
        ✕
      </button>

      <div className="fixed top-6 inset-inline-end-6 z-10 bg-slate-800/50 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-4">
        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-full">
            {Object.entries(SOUNDS)
              .filter(([key]) => purchasedSoundPacks.includes(key))
              .map(([key, { icon, name }]) => (
                <button
                    key={key}
                    onClick={() => setSelectedSound(key)}
                    className={`w-8 h-8 rounded-full text-sm transition-all flex items-center justify-center ${
                        selectedSound === key ? 'bg-indigo-600 text-white scale-110' : 'bg-transparent text-slate-300 hover:bg-white/10'
                    }`}
                    title={name}
                >
                    {icon}
                </button>
            ))}
        </div>
        <div className="flex items-center gap-2 w-24">
            <span className="text-xs text-slate-400">🔉</span>
            <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                disabled={selectedSound === 'none'}
            />
        </div>
      </div>


      <div className="max-w-xl w-full py-12">
        <div className="mb-4 inline-block px-4 py-1 rounded-full bg-indigo-600/30 text-indigo-400 text-xs font-bold border border-indigo-500/50">
          מצב פוקוס פעיל
        </div>
        
        <h2 className="text-4xl md:text-5xl font-black mb-6 focus-pulse leading-tight px-4">{task.title}</h2>
        
        {task.subTasks.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 mb-12 border border-white/10 text-end mx-auto w-full">
            <h3 className="text-sm font-bold text-slate-400 mb-4">צעדים קטנים לביצוע:</h3>
            <div className="space-y-3">
              {task.subTasks.map(st => (
                <div key={st.id} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border shrink-0 ${st.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'}`} />
                  <span className={`text-base ${st.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{st.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-12">
          <div className="text-8xl font-mono font-bold mb-8 tracking-tighter text-indigo-400">
            {formatTime(timer)}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
            {!isActive ? (
              <button 
                onClick={() => setIsActive(true)}
                className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🚀 התחל עכשיו</span>
                {task.priority === Priority.URGENT && <span className="text-xs bg-white/20 px-2 py-1 rounded-lg">דחוף!</span>}
              </button>
            ) : (
              <button 
                onClick={() => setIsActive(false)}
                className="flex-1 py-5 bg-red-500/20 text-red-400 border border-red-500/50 rounded-3xl font-black text-xl hover:bg-red-500/30 transition-all active:scale-95"
              >
                השהה טיימר
              </button>
            )}
            
            <button 
              onClick={onComplete}
              className="flex-1 py-5 bg-emerald-500 text-white rounded-3xl font-black text-xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-3"
            >
              <span>🎉 סיימתי!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusMode;