
import React, { useState } from 'react';
import { Habit } from '../types';

interface HabitTrackerProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  onToggleHabit: (habitId: string) => void;
}

const HabitFormModal: React.FC<{
    habit?: Habit | null;
    onSave: (habit: Habit) => void;
    onClose: () => void;
}> = ({ habit, onSave, onClose }) => {
    const [title, setTitle] = useState(habit?.title || '');
    const [icon, setIcon] = useState(habit?.icon || '💧');
    const [timeOfDay, setTimeOfDay] = useState(habit?.timeOfDay || 'morning');
    const isEditing = !!habit;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        const newHabit: Habit = {
            id: habit?.id || Math.random().toString(36).substr(2, 9),
            title: title.trim(),
            icon,
            timeOfDay,
            completedDays: habit?.completedDays || []
        };
        onSave(newHabit);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in duration-300">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">{isEditing ? 'עריכת הרגל' : 'הוספת הרגל חדש'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500">שם ההרגל</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full mt-1 p-2 border border-slate-200 rounded-lg" required />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">אייקון</label>
                        <input type="text" value={icon} onChange={e => setIcon(e.target.value)} maxLength={2} className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-center" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500">זמן ביום</label>
                        <select value={timeOfDay} onChange={e => setTimeOfDay(e.target.value as any)} className="w-full mt-1 p-2 border border-slate-200 rounded-lg bg-white">
                            <option value="morning">בוקר</option>
                            <option value="noon">צהריים</option>
                            <option value="evening">ערב</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">{isEditing ? 'שמור שינויים' : 'הוסף הרגל'}</button>
                </form>
            </div>
        </div>
    );
};

const HabitTracker: React.FC<HabitTrackerProps> = ({ habits, setHabits, onToggleHabit }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handleSaveHabit = (habit: Habit) => {
      const exists = habits.some(h => h.id === habit.id);
      if (exists) {
          setHabits(habits.map(h => h.id === habit.id ? habit : h));
      } else {
          setHabits([...habits, habit]);
      }
  };

  const handleDeleteHabit = (id: string) => {
      if (window.confirm("בטוח למחוק את ההרגל הזה?")) {
        setHabits(habits.filter(h => h.id !== id));
      }
  };

  const sections = [
    { id: 'morning', label: 'בוקר טוב', icon: '☀️', color: 'bg-orange-50 text-orange-700' },
    { id: 'noon', label: 'צהריים', icon: '🌤️', color: 'bg-indigo-50 text-indigo-700' },
    { id: 'evening', label: 'לילה טוב', icon: '🌙', color: 'bg-slate-800 text-white' }
  ];

  return (
    <div className="space-y-6">
      {showForm && <HabitFormModal habit={editingHabit} onSave={handleSaveHabit} onClose={() => { setShowForm(false); setEditingHabit(null); }} />}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-2">
            <div>
                <h2 className="text-xl font-bold text-slate-800">שימור הרגלים</h2>
                <p className="text-slate-400 text-sm">עקביות היא המפתח להצלחה עם ADHD.</p>
            </div>
            <button onClick={() => { setEditingHabit(null); setShowForm(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-colors">
              + הוסף הרגל
            </button>
        </div>

        <div className="space-y-8 mt-6">
          {sections.map(section => (
            <div key={section.id}>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl w-fit font-bold text-sm mb-4 ${section.color}`}>
                <span>{section.icon}</span>
                <span>{section.label}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {habits.filter(h => h.timeOfDay === section.id).map(habit => {
                  const done = habit.completedDays.includes(todayStr);
                  return (
                    <div key={habit.id} className="group relative">
                        <button
                          onClick={() => onToggleHabit(habit.id)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                            done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{habit.icon}</span>
                            <span className="font-bold">{habit.title}</span>
                          </div>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${done ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300'}`}>
                            {done ? '✓' : '+'}
                          </div>
                        </button>
                        <div className="absolute top-2 inset-inline-start-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingHabit(habit); setShowForm(true); }} className="w-6 h-6 bg-white/70 backdrop-blur-sm text-xs rounded-md">✏️</button>
                            <button onClick={() => handleDeleteHabit(habit.id)} className="w-6 h-6 bg-white/70 backdrop-blur-sm text-xs rounded-md">🗑️</button>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HabitTracker;
