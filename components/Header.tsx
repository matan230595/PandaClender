
import React, { useState, useEffect } from 'react';
import { UserProgress } from '../types';

interface HeaderProps {
  progress: UserProgress;
}

const PowerUpTimer: React.FC<{ expires: number }> = ({ expires }) => {
    const calculateTimeLeft = () => {
        const difference = expires - Date.now();
        let timeLeft = { hours: 0, minutes: 0, seconds: 0 };

        if (difference > 0) {
            timeLeft = {
                hours: Math.floor(difference / (1000 * 60 * 60)),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearTimeout(timer);
    });

    const format = (num: number) => num.toString().padStart(2, '0');

    return (
        <div className="flex items-center gap-2 bg-yellow-400 text-yellow-900 px-3 py-2 rounded-xl border-2 border-yellow-500 shadow-lg animate-in fade-in zoom-in duration-300">
            <span className="text-xl animate-pulse">✨</span>
            <div className="flex flex-col">
                <span className="text-xs font-black leading-none">x2 נקודות</span>
                <span className="text-[10px] font-bold opacity-75">
                    {format(timeLeft.hours)}:{format(timeLeft.minutes)}:{format(timeLeft.seconds)}
                </span>
            </div>
        </div>
    );
};


const Header: React.FC<HeaderProps> = ({ progress }) => {
  const nextLevelPoints = 500;
  const progressPercent = (progress.points / nextLevelPoints) * 100;
  const isPowerUpActive = progress.activePowerUp && progress.activePowerUp.expires > Date.now();

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900">PandaClender</h1>
          <p className="text-slate-500 text-sm">הפוקוס שלך, השקט שלך ✨</p>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
          {/* Points & Level */}
          <div className="flex flex-col items-end flex-grow md:flex-grow-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-400">רמה {progress.level}</span>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">
                {progress.points} נקודות
              </span>
            </div>
            <div className="w-full max-w-[128px] h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          
          {isPowerUpActive && <PowerUpTimer expires={progress.activePowerUp!.expires} />}

          {/* Streak */}
          <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-xl border border-orange-100">
            <span className="text-xl">🔥</span>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-orange-600 leading-none">{progress.streak}</span>
              <span className="text-[10px] text-orange-400 font-bold uppercase">רצף ימים</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;