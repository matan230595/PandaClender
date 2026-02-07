import React, { useState, useEffect } from 'react';
import { Task, Habit, Priority, CustomColors, UserProgress } from '../lib/types';
import { GoogleGenAI } from "@google/genai";
import { APP_REWARDS } from '../lib/constants';
import { exportToCsv } from '../utils/export';

type Status = 'unchecked' | 'checking' | 'valid' | 'invalid';
type AccordionSection = 'integrations' | 'customization' | 'data' | 'danger';

interface SettingsProps {
  onGoogleLogin: () => void;
  isGoogleConnected: boolean;
  isConnectingToGoogle: boolean;
  onLogout: () => void;
  googleUser: any;
  customColors: CustomColors;
  setCustomColors: React.Dispatch<React.SetStateAction<CustomColors>>;
  progress: UserProgress;
  onThemeChange: (themeId: string) => void;
  activeSound: string;
  onSoundChange: (soundId: string) => void;
  tasks: Task[];
  habits: Habit[];
  onUpdateApiKeys: (keys: string[]) => void;
}

const Accordion: React.FC<{
    title: string;
    icon: string;
    isOpen: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ title, icon, isOpen, onClick, children }) => (
    <div className="border border-slate-200 rounded-3xl overflow-hidden">
        <button onClick={onClick} className="w-full flex justify-between items-center p-6 bg-slate-50 hover:bg-slate-100 transition-colors text-start">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <h3 className="font-bold text-slate-800">{title}</h3>
            </div>
            <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
            <div className="p-6 space-y-6">
                {children}
            </div>
        </div>
    </div>
);

const Settings: React.FC<SettingsProps> = ({ 
  onGoogleLogin, isGoogleConnected, isConnectingToGoogle, onLogout, googleUser,
  customColors, setCustomColors, progress, onThemeChange, activeSound, onSoundChange,
  tasks, habits, onUpdateApiKeys
}) => {
  const [openSection, setOpenSection] = useState<AccordionSection | null>('integrations');
  const [apiKeys, setApiKeys] = useState<string[]>(progress.apiKeys || []);
  const [keyStatuses, setKeyStatuses] = useState<Record<string, Status>>({});
  const [newApiKey, setNewApiKey] = useState('');
  
  const [dailyReminderTime, setDailyReminderTime] = useState(localStorage.getItem('ff_daily_reminder_time') || '');
  const [habitReminderTimes, setHabitReminderTimes] = useState(() => {
    const saved = localStorage.getItem('ff_habit_reminder_times');
    const defaults = { morning: '08:00', noon: '13:00', evening: '20:00' };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const testApiKey = async (key: string) => {
    setKeyStatuses(prev => ({ ...prev, [key]: 'checking' }));
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: "test" });
      setKeyStatuses(prev => ({ ...prev, [key]: 'valid' }));
    } catch (error) {
      console.warn(`API key test failed for key ending in ${key.slice(-4)}`, error);
      setKeyStatuses(prev => ({ ...prev, [key]: 'invalid' }));
    }
  };

  useEffect(() => {
    setApiKeys(progress.apiKeys || []);
    const initialStatuses: Record<string, Status> = {};
    (progress.apiKeys || []).forEach((key: string) => { 
        initialStatuses[key] = keyStatuses[key] || 'unchecked' 
    });
    setKeyStatuses(initialStatuses);

    // Test any unchecked keys
    (progress.apiKeys || []).forEach(key => {
        if (!keyStatuses[key] || keyStatuses[key] === 'unchecked') {
            testApiKey(key);
        }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.apiKeys]);
  
  useEffect(() => {
    localStorage.setItem('ff_habit_reminder_times', JSON.stringify(habitReminderTimes));
  }, [habitReminderTimes]);

  const toggleSection = (section: AccordionSection) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  const addApiKey = () => {
    if (newApiKey.trim() && !apiKeys.includes(newApiKey.trim())) {
      const newKey = newApiKey.trim();
      const updatedKeys = [...apiKeys, newKey];
      onUpdateApiKeys(updatedKeys);
      setNewApiKey('');
      testApiKey(newKey);
    }
  };

  const removeApiKey = (keyToRemove: string) => {
    const updatedKeys = apiKeys.filter(key => key !== keyToRemove);
    onUpdateApiKeys(updatedKeys);
    const newStatuses = { ...keyStatuses };
    delete newStatuses[keyToRemove];
    setKeyStatuses(newStatuses);
  };
  
  const handleColorChange = (priority: Priority, color: string) => {
    setCustomColors((prev: CustomColors) => ({ ...prev, [priority]: color }));
  };
  
  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
        console.error("הדפדפן שלך אינו תומך בהתראות.");
        return;
    }
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            new Notification("התראות הופעלו!", { body: "נהדר! עכשיו נוכל לשלוח לך תזכורות." });
        }
    }
  };

  const handleTimeChange = (time: string) => {
    setDailyReminderTime(time);
    if(time){
      localStorage.setItem('ff_daily_reminder_time', time);
    } else {
      localStorage.removeItem('ff_daily_reminder_time');
    }
  }

  const handleHabitTimeChange = (partOfDay: 'morning' | 'noon' | 'evening', time: string) => {
    setHabitReminderTimes((prev: { morning: string; noon: string; evening: string; }) => ({ ...prev, [partOfDay]: time }));
  };

  const handleExportTasks = () => {
    exportToCsv('pandaclender_tasks', tasks.map(task => ({...task, subTasks: task.subTasks.map(st => st.title).join('; ')})));
  };
  const handleExportHabits = () => {
    exportToCsv('pandaclender_habits', habits.map(h => ({...h, completedDays: h.completedDays.join('; ')})));
  };
  const handleExportProgress = () => {
    exportToCsv('pandaclender_progress', [progress]);
  };

  const StatusIndicator: React.FC<{ status: Status, textOverride?: string }> = ({ status, textOverride }) => {
      const styles = {
          unchecked: { icon: '❓', text: 'לא נבדק', classes: 'text-slate-500 bg-slate-200' },
          checking: { icon: '⏳', text: 'בודק...', classes: 'text-blue-500 bg-blue-100 animate-pulse' },
          valid: { icon: '✅', text: 'מחובר', classes: 'text-emerald-600 bg-emerald-100' },
          invalid: { icon: '❌', text: 'שגיאה', classes: 'text-red-600 bg-red-100' },
      };
      const current = styles[status];
      return (
        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${current.classes}`}>
            {current.icon} {textOverride || current.text}
        </span>
      )
  }

  const IntegrationRow: React.FC<{icon: string, name: string, status: Status, statusText?: string, children: React.ReactNode}> = ({icon, name, status, statusText, children}) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <h4 className="font-bold text-slate-700">{name}</h4>
            </div>
            <StatusIndicator status={status} textOverride={statusText}/>
        </div>
        <div>{children}</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-4 sm:p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800">הגדרות וסנכרון ⚙️</h2>
          <p className="text-sm text-slate-400 font-medium">נהל את החיבורים וההעדפות שלך במקום אחד.</p>
        </div>

        <div className="space-y-4">
            <Accordion title="אינטגרציות והתראות" icon="🔌" isOpen={openSection === 'integrations'} onClick={() => toggleSection('integrations')}>
                <IntegrationRow icon="🤖" name="Google AI (Gemini)" status={Object.values(keyStatuses).some(s => s === 'valid') ? 'valid' : Object.values(keyStatuses).some(s => s === 'checking') ? 'checking' : 'invalid'} statusText={Object.values(keyStatuses).some(s => s === 'valid') ? 'מחובר' : 'לא מחובר'}>
                    <p className="text-xs text-slate-500 mb-4">נדרש עבור תכונות AI. המפתחות מסונכרנים עם החשבון שלך.</p>
                    <div className="space-y-2">
                        {apiKeys.map((key) => (
                        <div key={key} className="flex items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200">
                            <div className="flex items-center gap-2">
                                <StatusIndicator status={keyStatuses[key] || 'unchecked'} />
                                <input type="text" value={`••••••••${key.slice(-4)}`} readOnly className="bg-transparent text-xs font-mono text-slate-500 w-24"/>
                            </div>
                            <div className="flex items-center gap-2">
                                {keyStatuses[key] === 'invalid' && <button onClick={() => testApiKey(key)} className="text-xs font-bold text-blue-600 hover:underline">בדוק שוב</button>}
                                <button onClick={() => removeApiKey(key)} className="text-red-500 font-bold text-lg">×</button>
                            </div>
                        </div>
                        ))}
                    </div>
                    <div className="flex gap-2 pt-4"><input type="password" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} placeholder="הדבק מפתח API חדש כאן" className="flex-grow p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-100"/><button onClick={addApiKey} className="px-6 bg-indigo-600 text-white rounded-xl font-bold text-sm">הוסף</button></div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center"><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 underline">ניתן להנפיק מפתח Gemini בחינם כאן</a>.</p>
                </IntegrationRow>
                
                <IntegrationRow icon="📅" name="Google Calendar" status={'invalid'} statusText="לא מחובר">
                    <p className="text-xs text-slate-500 mb-4">סנכרן את המשימות שלך ליומן גוגל. (בקרוב!)</p>
                    <button disabled className="w-full py-3 bg-slate-200 text-slate-500 rounded-xl font-bold text-sm cursor-not-allowed">חבר את יומן גוגל</button>
                </IntegrationRow>
                
                 <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-700">🔔 התראות</h4>
                  <button onClick={handleEnableNotifications} className="w-full py-3 bg-white text-sm font-bold rounded-xl border border-slate-200">הפעל התראות דפדפן</button>
                  <div>
                    <label className="text-xs font-black text-slate-500 block mb-2">תזכורת יומית למשימות:</label>
                    <input type="time" value={dailyReminderTime} onChange={(e) => handleTimeChange(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-mono"/>
                  </div>
              </div>
            </Accordion>
            
            <Accordion title="התאמה אישית" icon="🎨" isOpen={openSection === 'customization'} onClick={() => toggleSection('customization')}>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-slate-700">צבעי עדיפויות</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(Object.keys(customColors) as Priority[]).map(p => (
                            <div key={p}><label className="text-xs font-bold text-slate-700 mb-2 block">{p === Priority.URGENT ? 'דחוף' : p === Priority.IMPORTANT ? 'חשוב' : 'רגיל'}</label><div className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-lg"><input type="color" value={customColors[p]} onChange={e => handleColorChange(p, e.target.value)} className="w-8 h-8 rounded border-none cursor-pointer" /><span className="font-mono text-sm">{customColors[p]}</span></div></div>
                        ))}
                    </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-slate-700">הפרסים שלי</h4>
                    <h5 className="font-bold text-sm text-slate-600">ערכות נושא</h5>
                    <div className="flex gap-2 overflow-x-auto pb-2">{APP_REWARDS.themes.filter(t => progress.purchasedThemes.includes(t.id)).map(theme => (<button key={theme.id} onClick={() => onThemeChange(theme.id)} className={`p-2 rounded-lg border-2 text-center transition-all ${progress.activeTheme === theme.id ? 'border-indigo-500 scale-105' : 'border-transparent'}`}><div className={`w-16 h-10 rounded-md ${theme.previewColor} mb-2`}></div><span className="text-xs font-bold">{theme.name}</span></button>))}</div>
                    <h5 className="font-bold text-sm text-slate-600 pt-2 border-t border-slate-200">צלילי אווירה</h5>
                    <div className="flex gap-2 overflow-x-auto pb-2">{APP_REWARDS.sounds.filter(s => progress.purchasedSoundPacks.includes(s.id)).map(sound => (<button key={sound.id} onClick={() => onSoundChange(sound.id)} className={`p-2 rounded-lg border-2 text-center transition-all w-20 ${activeSound === sound.id ? 'border-indigo-500 scale-105' : 'border-transparent'}`}><div className={`w-16 h-10 rounded-md bg-slate-100 mb-2 flex items-center justify-center text-2xl`}>{sound.previewIcon}</div><span className="text-xs font-bold">{sound.name}</span></button>))}</div>
                </div>
            </Accordion>
             <Accordion title="ניהול נתונים" icon="🗃️" isOpen={openSection === 'data'} onClick={() => toggleSection('data')}>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-700">ייצוא נתונים</h4>
                <p className="text-xs text-slate-500">שמור גיבוי של הנתונים שלך על ידי ייצוא לקבצי CSV.</p>
                <div className="flex flex-col sm:flex-row gap-3"><button onClick={handleExportTasks} className="flex-1 py-3 bg-white text-sm font-bold rounded-xl border border-slate-200 hover:bg-slate-50">ייצא משימות</button><button onClick={handleExportHabits} className="flex-1 py-3 bg-white text-sm font-bold rounded-xl border border-slate-200 hover:bg-slate-50">ייצא הרגלים</button><button onClick={handleExportProgress} className="flex-1 py-3 bg-white text-sm font-bold rounded-xl border border-slate-200 hover:bg-slate-50">ייצא התקדמות</button></div>
              </div>
            </Accordion>
             <Accordion title="אזור סכנה" icon="⚠️" isOpen={openSection === 'danger'} onClick={() => toggleSection('danger')}>
                <div className="bg-red-50 p-4 rounded-2xl border-2 border-dashed border-red-200 text-center space-y-4">
                    <h4 className="font-bold text-red-800">פעולות בלתי הפיכות</h4>
                    {!isGoogleConnected ? 
                        <button onClick={onGoogleLogin} className="w-full max-w-xs mx-auto py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300"><img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google icon" /> התחבר עם גוגל</button> :
                        <div className="bg-white border border-emerald-200 rounded-2xl p-3 flex items-center justify-center text-sm font-bold text-emerald-800">מחובר כ: {googleUser?.email}</div>
                    }
                    <button onClick={onLogout} disabled={!isGoogleConnected} className="w-full max-w-xs mx-auto py-3 bg-red-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed">התנתק ומחק נתונים מקומיים</button>
                </div>
             </Accordion>
        </div>
      </div>
    </div>
  );
};

export default Settings;