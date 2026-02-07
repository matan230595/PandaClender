
import React, { useState, useMemo } from 'react';
import { UserProgress } from '../types';
import { APP_REWARDS } from '../constants';

interface RewardsStoreProps {
  progress: UserProgress;
  onPurchase: (type: 'theme' | 'sound' | 'visualEffect' | 'powerUp', cost: number, id: string) => void;
  activeTheme: string;
  onThemeChange: (themeId: string) => void;
}

const RewardsStore: React.FC<RewardsStoreProps> = ({ progress, onPurchase, activeTheme, onThemeChange }) => {
    const [sortBy, setSortBy] = useState<'default' | 'costAsc' | 'costDesc'>('default');
    const [justPurchasedId, setJustPurchasedId] = useState<string | null>(null);
    
    const isPowerUpActive = progress.activePowerUp && progress.activePowerUp.expires > Date.now();

    const sortedRewards = useMemo(() => {
        const sorter = (a: { cost: number }, b: { cost: number }) => {
            if (sortBy === 'costAsc') return a.cost - b.cost;
            if (sortBy === 'costDesc') return b.cost - a.cost;
            return 0; // default order
        };
        
        return {
            themes: [...APP_REWARDS.themes].sort(sorter),
            sounds: [...APP_REWARDS.sounds].sort(sorter),
            visualEffects: [...APP_REWARDS.visualEffects].sort(sorter),
            powerUps: [...APP_REWARDS.powerUps].sort(sorter),
        };
    }, [sortBy]);

    const handlePurchaseClick = (type: 'theme' | 'sound' | 'visualEffect' | 'powerUp', cost: number, id: string) => {
        // We only trigger the animation if the purchase is likely to succeed.
        // The parent component handles the actual logic.
        const isPurchasable = (type === 'powerUp' && !isPowerUpActive) || 
                              (type !== 'powerUp' && !progress.purchasedThemes.includes(id) && !progress.purchasedSoundPacks.includes(id) && !progress.purchasedConfettiPacks.includes(id));
        
        if (progress.points >= cost && isPurchasable) {
            setJustPurchasedId(id);
            setTimeout(() => {
                setJustPurchasedId(null);
            }, 1500); // Animation duration + buffer
        }
        // Always call the parent function to handle the logic
        onPurchase(type, cost, id);
    };

    const RewardItem: React.FC<{
        item: { id: string, name: string, cost: number, previewIcon?: string, previewColor?: string };
        type: 'theme' | 'sound' | 'visualEffect' | 'powerUp';
        isJustPurchased: boolean;
    }> = ({ item, type, isJustPurchased }) => {
        const isPurchased = type === 'theme' ? progress.purchasedThemes.includes(item.id) :
                            type === 'sound' ? progress.purchasedSoundPacks.includes(item.id) :
                            type === 'visualEffect' ? progress.purchasedConfettiPacks.includes(item.id) :
                            false;
        const isActive = type === 'theme' && activeTheme === item.id;
        const canAfford = progress.points >= item.cost;

        const getButton = () => {
            if (type === 'powerUp') {
                return <button onClick={() => handlePurchaseClick('powerUp', item.cost, item.id)} disabled={isPowerUpActive || !canAfford} className={`w-full py-3 rounded-2xl font-bold text-sm text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isPowerUpActive ? 'bg-yellow-500' : canAfford ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300'}`}>
                    {isPowerUpActive ? 'פעיל ✅' : 'הפעל'}
                </button>;
            }
            if (isActive) {
                return <button disabled className="w-full py-3 rounded-2xl font-bold text-sm bg-emerald-500 text-white">מופעל ✅</button>;
            }
            if (isPurchased) {
                if (type === 'theme') {
                    return <button onClick={() => onThemeChange(item.id)} className="w-full py-3 rounded-2xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700">הפעל</button>;
                }
                return <button disabled className="w-full py-3 rounded-2xl font-bold text-sm bg-emerald-500 text-white">בבעלותך</button>;
            }
            return (
                <button onClick={() => handlePurchaseClick(type, item.cost, item.id)} disabled={!canAfford} className="w-full py-3 rounded-2xl font-bold text-sm text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed bg-slate-400 hover:bg-slate-500">
                    קנה עכשיו
                </button>
            );
        };

        return (
             <div className={`p-6 rounded-3xl border-2 flex flex-col items-center text-center gap-4 transition-all ${isJustPurchased ? 'item-purchased-animation' : ''} ${isPowerUpActive && type === 'powerUp' ? 'bg-yellow-50 border-yellow-200' : isPurchased ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                <div className={`w-24 h-16 rounded-2xl bg-white flex items-center justify-center text-4xl shadow-inner ${item.previewColor || ''}`}>
                  {item.previewIcon}
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-slate-800">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                      {isPowerUpActive && type === 'powerUp' ? 'פעיל כעת' : isPurchased ? 'בבעלותך' : `עלות: ${item.cost} נקודות`}
                  </p>
                </div>
                {getButton()}
            </div>
        );
    };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-800">חנות הפרסים 🎁</h2>
            <p className="text-sm text-slate-400 mt-1">השתמש בנקודות שצברת כדי לשדרג את האפליקציה!</p>
            <div className="mt-4 inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-2xl font-bold border border-yellow-200">
                יתרה: {progress.points} נקודות ✨
            </div>
        </div>

        <div className="flex justify-center items-center gap-1 mb-10 bg-slate-100 p-1 rounded-full w-fit mx-auto flex-wrap">
            <span className="text-xs font-bold text-slate-500 px-2">מיין לפי:</span>
            {[
                {id: 'default', label: 'מומלץ'},
                {id: 'costAsc', label: 'מחיר (נמוך לגבוה)'},
                {id: 'costDesc', label: 'מחיר (גבוה לנמוך)'},
            ].map(sortOption => (
                <button 
                    key={sortOption.id} 
                    onClick={() => setSortBy(sortOption.id as any)} 
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all ${sortBy === sortOption.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                >
                    {sortOption.label}
                </button>
            ))}
        </div>
        
        <div className="space-y-10">
            {/* Power Ups */}
            <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4">⚡️ Power-Ups</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {sortedRewards.powerUps.map(item => <RewardItem key={item.id} item={item} type="powerUp" isJustPurchased={justPurchasedId === item.id} />)}
                </div>
            </div>
            
            {/* Themes */}
            <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4">🎨 ערכות נושא</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {sortedRewards.themes.map(theme => <RewardItem key={theme.id} item={theme} type="theme" isJustPurchased={justPurchasedId === theme.id} />)}
                </div>
            </div>

            {/* Sounds */}
            <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4">🎵 צלילי אווירה</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {sortedRewards.sounds.map(sound => <RewardItem key={sound.id} item={sound} type="sound" isJustPurchased={justPurchasedId === sound.id} />)}
                </div>
            </div>

            {/* Visual Effects */}
            <div>
                <h3 className="text-lg font-bold text-slate-700 mb-4">✨ אפקטים ויזואליים</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {sortedRewards.visualEffects.map(effect => <RewardItem key={effect.id} item={effect} type="visualEffect" isJustPurchased={justPurchasedId === effect.id} />)}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default RewardsStore;
