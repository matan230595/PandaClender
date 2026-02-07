import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { Task, UserProgress, Priority, Habit, SubTask, DbTask } from '../lib/types';
import { ACHIEVEMENTS } from '../lib/constants';
import { generateContentWithFallback, parseTaskFromCommand } from '../utils/ai';

// Components
import Header from '../components/Header';
import WeeklyCalendar from '../components/WeeklyCalendar';
import MonthlyCalendar from '../components/MonthlyCalendar';
import DailySchedule from '../components/DailySchedule';
import FocusMode from '../components/FocusMode';
import Pomodoro from '../components/Pomodoro';
import HabitTracker from '../components/HabitTracker';
import TaskManager from '../components/TaskManager';
import ReminderSystem from '../components/ReminderSystem';
import ProgressStats from '../components/ProgressStats';
import DashboardView from '../components/DashboardView'; // The summary view
import BrainDump from '../components/BrainDump';
import Settings from '../components/Settings';
import RewardsStore from '../components/RewardsStore';
import AiCoach from '../components/AiCoach';
import BodyDoubling from '../components/BodyDoubling';
import CalendarDayModal from '../components/CalendarDayModal';
import HabitReminderSystem from '../components/HabitReminderSystem';
import TaskDetailModal from '../components/TaskDetailModal';
import StruggleModeModal from '../components/StruggleModeModal';
import AiAudioTools from '../components/AiAudioTools';

// --- DB CONVERSION HELPERS ---

const fromDbTask = (dbTask: DbTask): Task => ({
    id: dbTask.id,
    user_id: dbTask.user_id,
    title: dbTask.title,
    description: dbTask.description || '',
    priority: dbTask.priority,
    dueDate: new Date(dbTask.due_date),
    creationDate: new Date(dbTask.creation_date),
    completed: dbTask.completed,
    subTasks: dbTask.sub_tasks || [],
    category: dbTask.category,
    reminders: dbTask.reminders,
    energyLevel: dbTask.energy_level,
    snoozedUntil: dbTask.snoozed_until ? new Date(dbTask.snoozed_until).getTime() : undefined,
});

const toDbTask = (task: Task) => ({
    user_id: task.user_id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    due_date: task.dueDate.toISOString(),
    creation_date: task.creationDate.toISOString(),
    completed: task.completed,
    sub_tasks: task.subTasks,
    category: task.category,
    reminders: task.reminders,
    energy_level: task.energyLevel,
    snoozed_until: task.snoozedUntil ? new Date(task.snoozedUntil).toISOString() : null,
});

const fromDbProgress = (dbProgress: any): UserProgress => ({
    points: dbProgress.points ?? 0,
    level: dbProgress.level ?? 1,
    streak: dbProgress.streak ?? 0,
    achievements: dbProgress.achievements || [],
    purchasedThemes: dbProgress.purchased_themes || ['default'],
    activeTheme: dbProgress.active_theme || 'default',
    purchasedSoundPacks: dbProgress.purchased_sound_packs || ['none'],
    purchasedConfettiPacks: dbProgress.purchased_confetti_packs || [],
    activePowerUp: dbProgress.active_power_up || null,
    apiKeys: dbProgress.api_keys || [],
});

const initialProgress: UserProgress = {
    points: 0, 
    level: 1, 
    streak: 0,
    achievements: ACHIEVEMENTS.map(a => ({...a, unlocked: false})),
    purchasedThemes: ['default'],
    activeTheme: 'default',
    purchasedSoundPacks: ['none'],
    purchasedConfettiPacks: [],
    activePowerUp: null,
    apiKeys: [],
};

const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [progress, setProgress] = useState<UserProgress>(initialProgress);
  const [loading, setLoading] = useState(true);

  // Views & UI State
  const [mainView, setMainView] = useState<'dashboard' | 'calendar' | 'tasks' | 'habits' | 'stats' | 'rewards' | 'settings'>('dashboard');
  const [calendarSubView, setCalendarSubView] = useState<'day' | 'week' | 'month'>('week');
  
  // Modals & Features
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroTask, setPomodoroTask] = useState<Task | null>(null);
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [showAiCoach, setShowAiCoach] = useState(false);
  const [showBodyDoubling, setShowBodyDoubling] = useState(false);
  const [showAiAudioTools, setShowAiAudioTools] = useState(false);
  const [isSyncing, setIsSyncing] = useState<false | 'day' | 'week'>(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [struggleTask, setStruggleTask] = useState<Task | null>(null);

  // Local Preferences
  const [customColors, setCustomColors] = useState<any>(() => {
    const saved = localStorage.getItem('ff_custom_colors');
    return saved ? JSON.parse(saved) : {
      [Priority.URGENT]: '#ef4444',
      [Priority.IMPORTANT]: '#fb923c',
      [Priority.REGULAR]: '#10b981',
    };
  });
  const [activeSound, setActiveSound] = useState(localStorage.getItem('ff_active_sound') || 'none');
  const activeFocusTask = tasks.find(t => t.id === focusTaskId);

  // Load Data Effect
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const fetchData = async () => {
        // 1. Fetch Tasks
        const { data: tasksData } = await supabase.from('tasks').select('*').eq('user_id', user.id);
        if (tasksData) setTasks(tasksData.map(fromDbTask));

        // 2. Fetch Progress (or create)
        const { data: progressData } = await supabase.from('user_profile_progress').select('*').eq('user_id', user.id).maybeSingle();
        if (progressData) {
            setProgress(fromDbProgress(progressData));
        } else {
             // Create initial profile if missing
             const newProfile = {
                 user_id: user.id,
                 points: 0,
                 level: 1,
                 streak: 0,
                 achievements: ACHIEVEMENTS,
                 purchased_themes: ['default'],
                 active_theme: 'default'
             };
             await supabase.from('user_profile_progress').insert(newProfile);
             setProgress(initialProgress);
        }

        // 3. Fetch Habits
        const { data: habitsData } = await supabase.from('habits').select('*').eq('user_id', user.id);
        if (habitsData) {
             setHabits(habitsData.map(h => ({
                 id: h.id, title: h.title, icon: h.icon, timeOfDay: h.time_of_day, completedDays: h.completed_days || []
             })));
        }

        setLoading(false);
    };

    fetchData();
  }, [user]);

  // Persist local preferences
  useEffect(() => {
    localStorage.setItem('ff_active_sound', activeSound);
  }, [activeSound]);

  useEffect(() => {
    localStorage.setItem('ff_custom_colors', JSON.stringify(customColors));
  }, [customColors]);

  // Handlers
  const triggerConfetti = () => {
    if (typeof window.confetti === 'function') {
      const isRainbow = progress.purchasedConfettiPacks.includes('rainbow_confetti');
      const particleColors = isRainbow
        ? ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        : [customColors.URGENT, customColors.IMPORTANT, customColors.REGULAR, '#4f46e5'];

      window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: particleColors });
    }
  };

  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'creationDate' | 'completed' | 'user_id'>) => {
    if (!user) return;
    const fullNewTask: Task = {
        ...newTaskData,
        id: '', // Supabase will gen ID, but we set empty for now
        user_id: user.id,
        creationDate: new Date(),
        completed: false
    };

    const { data, error } = await supabase.from('tasks').insert([toDbTask(fullNewTask)]).select().single();
    if (!error && data) {
        setTasks(prev => [fromDbTask(data as DbTask), ...prev]);
        triggerConfetti();
        // Update points
        const newPoints = progress.points + 10;
        await supabase.from('user_profile_progress').update({ points: newPoints }).eq('user_id', user.id);
        setProgress(p => ({ ...p, points: newPoints }));
    }
  };

  const handleAddTaskFromNaturalLanguage = async (command: string) => {
    try {
      const parsedTask = await parseTaskFromCommand(command);
      if (!parsedTask) throw new Error("לא הצלחתי להבין את הבקשה.");
      
      const newTaskData = {
        title: parsedTask.title,
        description: '',
        dueDate: new Date(parsedTask.dueDate),
        reminders: { ...parsedTask.reminders, custom: null },
        priority: parsedTask.priority || Priority.REGULAR,
        subTasks: [],
        category: 'אישי' as const, 
      };
      await handleAddTask(newTaskData);
    } catch (error: any) {
      console.error("AI Command Error:", error);
      alert("שגיאה בפענוח: " + error.message);
    }
  };

  const handleToggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const isNowCompleted = !task.completed;
    const updatedTask = { 
        ...task, 
        completed: isNowCompleted, 
        subTasks: task.subTasks.map(st => ({...st, completed: isNowCompleted})),
        snoozedUntil: undefined
    };

    const { error } = await supabase.from('tasks').update(toDbTask(updatedTask)).eq('id', taskId);

    if (!error) {
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
        if (isNowCompleted) {
          const isPowerUpActive = progress.activePowerUp && progress.activePowerUp.expires > Date.now();
          const pointsEarned = isPowerUpActive ? 40 : 20;
          const newPoints = progress.points + pointsEarned;
          
          await supabase.from('user_profile_progress').update({ points: newPoints }).eq('user_id', user!.id);
          setProgress(p => ({ ...p, points: newPoints }));
          triggerConfetti();
        }
    }
  };

  const handleSnoozeTask = async (taskId: string, minutes: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const now = Date.now();
    const newDueDate = new Date(now + minutes * 60000);
    const snoozedUntil = now + minutes * 60000;
    const updatedTask = { ...task, dueDate: newDueDate, snoozedUntil };

    const { error } = await supabase.from('tasks').update({ 
        due_date: newDueDate.toISOString(),
        snoozed_until: new Date(snoozedUntil).toISOString() 
    }).eq('id', taskId);

    if (!error) {
        setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));
    }
  };

  const handleSubTaskToggle = async (taskId: string, subTaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubTasks = task.subTasks.map(st => st.id === subTaskId ? { ...st, completed: !st.completed } : st);
    const allSubTasksNowComplete = newSubTasks.length > 0 && newSubTasks.every(st => st.completed);
    const updatedTask = { ...task, subTasks: newSubTasks, completed: allSubTasksNowComplete };

    const { error } = await supabase.from('tasks').update({ sub_tasks: newSubTasks, completed: allSubTasksNowComplete }).eq('id', taskId);

    if (!error) {
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    }
  };

  const handleAddSubTask = async (taskId: string, subTaskTitle: string) => {
    if (!subTaskTitle.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubTask: SubTask = { id: `${taskId}-${Math.random().toString(36).substr(2, 9)}`, title: subTaskTitle.trim(), completed: false };
    const newSubTasks = [...task.subTasks, newSubTask];
    const updatedTask = { ...task, subTasks: newSubTasks, completed: false };

    const { error } = await supabase.from('tasks').update({ sub_tasks: newSubTasks, completed: false }).eq('id', taskId);

    if (!error) {
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const isCompletedToday = habit.completedDays.includes(todayStr);
    const newCompletedDays = isCompletedToday ? habit.completedDays.filter(d => d !== todayStr) : [...habit.completedDays, todayStr];
    const updatedHabit = { ...habit, completedDays: newCompletedDays };

    const { error } = await supabase.from('habits').update({ completed_days: newCompletedDays }).eq('id', habitId);

    if (!error) {
        setHabits(prev => prev.map(h => (h.id === habitId ? updatedHabit : h)));
        if (!isCompletedToday) {
            const isPowerUpActive = progress.activePowerUp && progress.activePowerUp.expires > Date.now();
            const pointsEarned = isPowerUpActive ? 20 : 10;
            const newPoints = progress.points + pointsEarned;
            
            await supabase.from('user_profile_progress').update({ points: newPoints }).eq('user_id', user!.id);
            setProgress(p => ({...p, points: newPoints}));
            triggerConfetti();
        }
    }
  };

  const handleAddHabit = async (habitData: Omit<Habit, 'id' | 'completedDays'>) => {
    if (!user) return;
    const dbHabit = {
        title: habitData.title,
        icon: habitData.icon,
        time_of_day: habitData.timeOfDay,
        user_id: user.id,
        completed_days: [],
    };
    const { data, error } = await supabase.from('habits').insert([dbHabit]).select().single();
    if (!error && data) {
        const frontendHabit: Habit = {
            id: data.id,
            title: data.title,
            icon: data.icon,
            timeOfDay: data.time_of_day,
            completedDays: data.completed_days || []
        };
        setHabits(prev => [frontendHabit, ...prev]);
    }
  };

  const handleUpdateHabit = async (updatedHabit: Habit) => {
    const { error } = await supabase.from('habits').update({
        title: updatedHabit.title,
        icon: updatedHabit.icon,
        time_of_day: updatedHabit.timeOfDay,
    }).eq('id', updatedHabit.id);
    
    if (!error) {
        setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    const { error } = await supabase.from('habits').delete().eq('id', habitId);
    if (!error) {
        setHabits(prev => prev.filter(h => h.id !== habitId));
    }
  };

  const handlePurchase = async (type: 'theme' | 'sound' | 'visualEffect' | 'powerUp', cost: number, id: string) => {
    if (progress.points < cost) return;
    
    let updatedProgress = { ...progress, points: progress.points - cost };
    let shouldUpdate = false;

    switch(type) {
        case 'theme':
            if (!progress.purchasedThemes.includes(id)) { 
                updatedProgress.purchasedThemes = [...progress.purchasedThemes, id]; 
                shouldUpdate = true; 
            }
            break;
        case 'sound':
            if (!progress.purchasedSoundPacks.includes(id)) { 
                updatedProgress.purchasedSoundPacks = [...progress.purchasedSoundPacks, id]; 
                shouldUpdate = true; 
            }
            break;
        case 'visualEffect':
            if (!progress.purchasedConfettiPacks.includes(id)) { 
                updatedProgress.purchasedConfettiPacks = [...progress.purchasedConfettiPacks, id]; 
                shouldUpdate = true; 
            }
            break;
        case 'powerUp':
                if (id === 'double_points_24h' && (!progress.activePowerUp || progress.activePowerUp.expires < Date.now())) {
                const expiry = Date.now() + 24 * 60 * 60 * 1000;
                updatedProgress.activePowerUp = { type: 'doublePoints', expires: expiry };
                shouldUpdate = true;
                }
            break;
    }

    if (shouldUpdate) {
        // Sync to DB
        await supabase.from('user_profile_progress').update({
            points: updatedProgress.points,
            purchased_themes: updatedProgress.purchasedThemes,
            purchased_sound_packs: updatedProgress.purchasedSoundPacks,
            purchased_confetti_packs: updatedProgress.purchasedConfettiPacks,
            active_power_up: updatedProgress.activePowerUp
        }).eq('user_id', user!.id);
        
        setProgress(updatedProgress);
        triggerConfetti();
    }
  };

  const handleUpdateApiKeys = async (newKeys: string[]) => {
    if (!user) return;
    await supabase.from('user_profile_progress').update({ api_keys: newKeys }).eq('user_id', user.id);
    setProgress(prev => ({...prev, apiKeys: newKeys}));
  };

  const sendEmailReport = async (type: 'day' | 'week') => {
    setIsSyncing(type);
    try {
      const relevantTasks = tasks.filter(t => !t.completed);
      const habitsStatus = habits.map(h => ({ title: h.title, done: h.completedDays.includes(new Date().toISOString().split('T')[0]) }));
      const prompt = `Generate a supportive, ADHD-friendly email summary for the user's ${type === 'day' ? 'today\'s' : 'this week\'s'} schedule. Tasks: ${JSON.stringify(relevantTasks)} Habits: ${JSON.stringify(habitsStatus)} User Points: ${progress.points} Include: A warm greeting, a clear prioritized list of 3 things to focus on, and a motivational closing. Format: Return ONLY the email body in Hebrew.`;
      const response = await generateContentWithFallback(prompt);
      if (response?.text) {
          const subject = encodeURIComponent(`PandaClender: סיכום ${type === 'day' ? 'יומי' : 'שבועי'}`);
          const body = encodeURIComponent(response.text);
          window.open(`mailto:?subject=${subject}&body=${body}`);
          triggerConfetti();
      } else {
          setMainView('settings');
      }
    } catch (error) {
      console.error("Email Error", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const { error } = await supabase.from('tasks').update(toDbTask(updatedTask)).eq('id', updatedTask.id);
    if (!error) {
        setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
        if(viewingTask?.id === updatedTask.id) setViewingTask(updatedTask);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (!error) {
        setTasks(prev => prev.filter(t => t.id !== taskId));
        if(viewingTask?.id === taskId) setViewingTask(null);
    }
  };

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
  );

  return (
    <div className={`theme-${progress.activeTheme}`}>
      <div className="min-h-screen pb-24 bg-slate-50 relative overflow-x-hidden">
        <style>{`
          :root { 
            --urgent-color: ${customColors.URGENT}; 
            --important-color: ${customColors.IMPORTANT}; 
            --regular-color: ${customColors.REGULAR};
            --urgent-color-light: ${customColors.URGENT}20;
            --important-color-light: ${customColors.IMPORTANT}20;
            --regular-color-light: ${customColors.REGULAR}20;
          }
        `}</style>

        {/* Global Overlays */}
        <ReminderSystem tasks={tasks} onComplete={handleToggleTaskCompletion} onSnooze={handleSnoozeTask} />
        <HabitReminderSystem habits={habits} onToggleHabit={handleToggleHabit} />
        
        {/* Modals */}
        {focusTaskId && activeFocusTask && <FocusMode task={activeFocusTask} onClose={() => setFocusTaskId(null)} onComplete={() => { handleToggleTaskCompletion(focusTaskId); setFocusTaskId(null); }} activeSound={activeSound} purchasedSoundPacks={progress.purchasedSoundPacks} />}
        {showAiCoach && <AiCoach tasks={tasks} progress={progress} onClose={() => setShowAiCoach(false)} />}
        {showBodyDoubling && <BodyDoubling onClose={() => setShowBodyDoubling(false)} />}
        {showAiAudioTools && <AiAudioTools onClose={() => setShowAiAudioTools(false)} />}
        {struggleTask && <StruggleModeModal task={struggleTask} onClose={() => setStruggleTask(null)} />}
        {showBrainDump && <BrainDump onClose={() => setShowBrainDump(false)} onAddTasks={(titles) => {
             titles.forEach(title => handleAddTask({ title, description: '', priority: Priority.REGULAR, dueDate: new Date(), subTasks: [], category: 'אישי', reminders: { dayBefore: true, hourBefore: true, fifteenMinBefore: true, custom: null } }));
        }} />}

        {selectedCalendarDate && <CalendarDayModal date={selectedCalendarDate} tasks={tasks.filter(t => t.dueDate.toDateString() === selectedCalendarDate.toDateString())} onClose={() => setSelectedCalendarDate(null)} onAddTask={(title) => {
            handleAddTask({ title, description: '', priority: Priority.REGULAR, dueDate: selectedCalendarDate, subTasks: [], category: 'אישי', reminders: { dayBefore: true, hourBefore: true, fifteenMinBefore: true, custom: null }});
          }} onCompleteTask={handleToggleTaskCompletion}
        />}
        
        {viewingTask && (
            <TaskDetailModal 
              task={viewingTask}
              onClose={() => setViewingTask(null)}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCompleteTask={(taskId) => { handleToggleTaskCompletion(taskId); setViewingTask(null); }}
              onSubTaskToggle={handleSubTaskToggle}
              onAddSubTask={handleAddSubTask}
              onStartPomodoro={setPomodoroTask}
            />
          )}

        <Header progress={progress} />

        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-6 sticky top-4 z-10 border border-slate-200 overflow-x-auto no-scrollbar">
            {[
              { id: 'dashboard', label: 'דשבורד', icon: '🏠' },
              { id: 'calendar', label: 'לוח שנה', icon: '📅' }, { id: 'tasks', label: 'משימות', icon: '📝' },
              { id: 'habits', label: 'הרגלים', icon: '🌱' }, { id: 'stats', label: 'התקדמות', icon: '📈' },
              { id: 'rewards', label: 'פרסים', icon: '🎁' }, { id: 'settings', label: 'הגדרות', icon: '⚙️' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setMainView(tab.id as any)}
                className={`flex-1 min-w-[70px] flex flex-col items-center py-2 rounded-xl transition-all ${mainView === tab.id ? 'bg-indigo-600 text-white shadow-md scale-105' : 'text-slate-500 hover:bg-slate-50'}`}>
                <span className="text-xl mb-1">{tab.icon}</span>
                <span className="text-[10px] font-bold">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {mainView === 'dashboard' && <DashboardView tasks={tasks} onSendEmail={sendEmailReport} isProcessing={isSyncing} onOpenAiCoach={() => setShowAiCoach(true)} onOpenBodyDoubling={() => setShowBodyDoubling(true)} onOpenAiAudioTools={() => setShowAiAudioTools(true)} onComplete={handleToggleTaskCompletion} onViewTask={setViewingTask} onAddTaskFromNaturalLanguage={handleAddTaskFromNaturalLanguage} />}
            {mainView === 'calendar' && (
              <div className="flex flex-col gap-6">
                <div className="flex gap-2 mb-2 bg-slate-100 p-1 rounded-xl w-fit mx-auto">
                  {[{ id: 'day', label: 'יומי' }, { id: 'week', label: 'שבועי' }, { id: 'month', label: 'חודשי' }].map(sub => (
                    <button key={sub.id} onClick={() => setCalendarSubView(sub.id as any)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${calendarSubView === sub.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      {sub.label}
                    </button>
                  ))}
                </div>
                {calendarSubView === 'day' && <DailySchedule tasks={tasks} onComplete={handleToggleTaskCompletion} />}
                {calendarSubView === 'week' && <WeeklyCalendar tasks={tasks} onDayClick={setSelectedCalendarDate} />}
                {calendarSubView === 'month' && <MonthlyCalendar tasks={tasks} onDayClick={setSelectedCalendarDate} />}
              </div>
            )}
            {mainView === 'tasks' && <TaskManager 
                tasks={tasks} onAddTask={handleAddTask} onComplete={handleToggleTaskCompletion} 
                onViewTask={setViewingTask}
                onStruggle={setStruggleTask}
            />}
            {mainView === 'habits' && <HabitTracker 
                habits={habits} 
                onToggleHabit={handleToggleHabit}
                onAddHabit={handleAddHabit}
                onUpdateHabit={handleUpdateHabit}
                onDeleteHabit={handleDeleteHabit} 
            />}
            {mainView === 'stats' && <ProgressStats tasks={tasks} progress={progress} />}
            {mainView === 'rewards' && <RewardsStore progress={progress} onPurchase={handlePurchase} activeTheme={progress.activeTheme} onThemeChange={(t) => { setProgress(p => ({...p, activeTheme: t}));  supabase.from('user_profile_progress').update({ active_theme: t }).eq('user_id', user!.id); }} />}
            {mainView === 'settings' && <Settings 
                onGoogleLogin={() => alert('מחובר דרך Supabase Auth')} 
                isGoogleConnected={true} 
                onLogout={signOut}
                isConnectingToGoogle={false}
                googleUser={user} 
                customColors={customColors} setCustomColors={setCustomColors} 
                progress={progress}
                onThemeChange={(t) => { setProgress(p => ({...p, activeTheme: t})); supabase.from('user_profile_progress').update({ active_theme: t }).eq('user_id', user!.id); }}
                activeSound={activeSound}
                onSoundChange={setActiveSound}
                tasks={tasks}
                habits={habits}
                onUpdateApiKeys={handleUpdateApiKeys}
            />}
          </div>
        </main>

        <div className="fixed bottom-6 inset-inline-end-6 z-40">
          <button 
            onClick={() => setShowBrainDump(true)}
            className="w-16 h-16 bg-indigo-600 text-white rounded-full font-black flex items-center justify-center text-2xl hover:scale-110 transition-transform shadow-xl"
            aria-label="Brain Dump"
          >
            🧠
          </button>
        </div>

        <div className="fixed bottom-6 inset-inline-start-6 z-40">
          <button 
            onClick={() => setShowPomodoro(!showPomodoro)}
            className="w-16 h-16 bg-red-500 text-white rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform"
            aria-label="Pomodoro Timer"
          >
            🍅
          </button>
        </div>

        {(showPomodoro || pomodoroTask) && 
            <div className="fixed bottom-24 inset-inline-start-6 z-40 w-72">
                <Pomodoro 
                    onClose={() => { setShowPomodoro(false); setPomodoroTask(null); }} 
                    task={pomodoroTask} 
                    activeSound={activeSound}
                    purchasedSoundPacks={progress.purchasedSoundPacks}
                />
            </div>
        }
      </div>
    </div>
  );
};

export default Dashboard;