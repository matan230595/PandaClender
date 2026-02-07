
import React, { useState, useEffect } from 'react';
import { Task, Habit, UserProgress, Priority, SubTask, CustomColors, DbTask } from './types';
import { ACHIEVEMENTS } from './constants';
import Header from './components/Header';
import WeeklyCalendar from './components/WeeklyCalendar';
import MonthlyCalendar from './components/MonthlyCalendar';
import DailySchedule from './components/DailySchedule';
import FocusMode from './components/FocusMode';
import Pomodoro from './components/Pomodoro';
import HabitTracker from './components/HabitTracker';
import TaskManager from './components/TaskManager';
import ReminderSystem from './components/ReminderSystem';
import ProgressStats from './components/ProgressStats';
import Dashboard from './components/Dashboard';
import BrainDump from './components/BrainDump';
import Settings from './components/Settings';
import RewardsStore from './components/RewardsStore';
import AiCoach from './components/AiCoach';
import BodyDoubling from './components/BodyDoubling';
import CalendarDayModal from './components/CalendarDayModal';
import { generateContentWithFallback } from './utils/ai';
import HabitReminderSystem from './components/HabitReminderSystem';
import TaskDetailModal from './components/TaskDetailModal';
import StruggleModeModal from './components/StruggleModeModal';
import AiAudioTools from './components/AiAudioTools';
import { supabase } from './utils/supabase';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';

// Helper function to convert DB task to frontend task
const fromDbTask = (dbTask: DbTask): Task => ({
    id: dbTask.id,
    user_id: dbTask.user_id,
    title: dbTask.title,
    description: dbTask.description,
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

// Helper function to convert frontend task to DB task
const toDbTask = (task: Task) => ({
    id: task.id,
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


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  
  const [progress, setProgress] = useState<UserProgress>(() => {
    // This can also be migrated to Supabase later
    const savedPowerUp = localStorage.getItem('ff_active_powerup');
    let activePowerUp = null;
    if (savedPowerUp) {
        const parsed = JSON.parse(savedPowerUp);
        if (parsed.expires > Date.now()) {
            activePowerUp = parsed;
        } else {
            localStorage.removeItem('ff_active_powerup');
        }
    }
    return { 
        points: 0, 
        level: 1, 
        streak: 0,
        achievements: ACHIEVEMENTS.map(a => ({...a, unlocked: false})),
        purchasedThemes: ['default'],
        activeTheme: 'default',
        purchasedSoundPacks: ['none'],
        purchasedConfettiPacks: [],
        activePowerUp: activePowerUp,
    };
  });
  
  const [mainView, setMainView] = useState<'dashboard' | 'calendar' | 'tasks' | 'habits' | 'stats' | 'rewards' | 'settings'>('dashboard');
  const [calendarSubView, setCalendarSubView] = useState<'day' | 'week' | 'month'>('week');
  
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

  const [customColors, setCustomColors] = useState<CustomColors>(() => {
    const saved = localStorage.getItem('ff_custom_colors');
    return saved ? JSON.parse(saved) : {
      [Priority.URGENT]: '#ef4444',
      [Priority.IMPORTANT]: '#fb923c',
      [Priority.REGULAR]: '#10b981',
    };
  });
  
  const [activeSound, setActiveSound] = useState(localStorage.getItem('ff_active_sound') || 'none');

  // Supabase Auth and Data Loading
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (session) {
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', session.user.id);
          
        if (tasksError) {
            console.error('Error fetching tasks:', tasksError);
            alert(`שגיאה בטעינת המשימות: ${tasksError.message}. האם יצרת את טבלת ה-tasks לפי ההוראות?`);
        } else {
            const formattedTasks = (tasksData as DbTask[] || []).map(fromDbTask);
            setTasks(formattedTasks);
        }

      } else {
        setTasks([]);
        setHabits([]);
      }
    };

    fetchData();
  }, [session]);


  useEffect(() => {
    document.body.className = `theme-${progress.activeTheme}`;
  }, [progress.activeTheme]);
  
  useEffect(() => {
    localStorage.setItem('ff_active_sound', activeSound);
  }, [activeSound]);

  useEffect(() => {
    localStorage.setItem('ff_custom_colors', JSON.stringify(customColors));
  }, [customColors]);

  useEffect(() => {
    const interval = setInterval(() => {
        const scheduledTime = localStorage.getItem('ff_daily_reminder_time');
        if (!scheduledTime || Notification.permission !== 'granted') return;

        const now = new Date();
        const [hours, minutes] = scheduledTime.split(':');
        
        if (now.getHours() === parseInt(hours) && now.getMinutes() === parseInt(minutes)) {
            const lastNotifDate = localStorage.getItem('ff_last_daily_notif');
            const todayStr = now.toISOString().split('T')[0];
            
            if (lastNotifDate !== todayStr) {
                new Notification('PandaClender: בוקר טוב!', { 
                    body: 'הגיע הזמן לתכנן את היום שלך. לחץ כדי לראות את המשימות שלך.',
                    icon: '/favicon.ico'
                });
                localStorage.setItem('ff_last_daily_notif', todayStr);
            }
        }
    }, 60000);

    return () => clearInterval(interval);
  }, []);


  const triggerConfetti = () => {
    if (typeof window.confetti === 'function') {
      const isRainbow = progress.purchasedConfettiPacks.includes('rainbow_confetti');
      const particleColors = isRainbow
        ? ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        : [customColors.URGENT, customColors.IMPORTANT, customColors.REGULAR, '#4f46e5'];

      window.confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: particleColors,
      });
    }
  };
  
  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'creationDate' | 'completed' | 'user_id'>) => {
    if (!session) return;
    const fullNewTask: Task = {
        ...newTaskData,
        id: '', // Will be set by DB
        creationDate: new Date(),
        completed: false,
        user_id: session.user.id
    };
    
    const { data, error } = await supabase
        .from('tasks')
        .insert(toDbTask(fullNewTask))
        .select()
        .single();
        
    if (error) {
        console.error("Error adding task:", error);
    } else if (data) {
        setTasks(prev => [fromDbTask(data as DbTask), ...prev]);
        triggerConfetti();
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
    
    const { error } = await supabase
        .from('tasks')
        .update(toDbTask(updatedTask))
        .eq('id', taskId);

    if (error) {
        console.error("Error updating task completion:", error);
    } else {
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
        if (isNowCompleted) {
          const isPowerUpActive = progress.activePowerUp && progress.activePowerUp.expires > Date.now();
          const pointsEarned = isPowerUpActive ? 40 : 20;
          setProgress(p => ({ ...p, points: p.points + pointsEarned }));
          triggerConfetti();
        }
    }
  };
  
  const handleSnoozeTask = (taskId: string, minutes: number) => {
    // TODO: Update in Supabase
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const now = Date.now();
        const newDueDate = new Date(now + minutes * 60000);
        const snoozedUntil = now + minutes * 60000;
        return { ...t, dueDate: newDueDate, snoozedUntil };
      }
      return t;
    }));
  };

  const handleSubTaskToggle = (taskId: string, subTaskId: string) => {
    // TODO: Update in Supabase
    setTasks(prevTasks => {
      const newTasks = prevTasks.map(task => {
        if (task.id === taskId) {
          const newSubTasks = task.subTasks.map(st => {
            if (st.id === subTaskId) return { ...st, completed: !st.completed };
            return st;
          });
          const allSubTasksNowComplete = newSubTasks.length > 0 && newSubTasks.every(st => st.completed);
          if (allSubTasksNowComplete && !task.completed) {
              const isPowerUpActive = progress.activePowerUp && progress.activePowerUp.expires > Date.now();
              const pointsEarned = isPowerUpActive ? 40 : 20;
              setProgress(p => ({ ...p, points: p.points + pointsEarned }));
              triggerConfetti();
          }
          return { ...task, subTasks: newSubTasks, completed: allSubTasksNowComplete };
        }
        return task;
      });
      return newTasks;
    });
  };
  
  const handleAddSubTask = (taskId: string, subTaskTitle: string) => {
    // TODO: Update in Supabase
    if (!subTaskTitle.trim()) return;
    setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
            const newSubTask: SubTask = { id: `${taskId}-${Math.random().toString(36).substr(2, 9)}`, title: subTaskTitle.trim(), completed: false };
            return { ...task, subTasks: [...task.subTasks, newSubTask], completed: false };
        }
        return task;
    }));
  };
  
  const handleToggleHabit = (habitId: string) => {
    // TODO: Update in Supabase
    const todayStr = new Date().toISOString().split('T')[0];
    setHabits(prev => prev.map(h => {
      if (h.id === habitId) {
        const isCompletedToday = h.completedDays.includes(todayStr);
        let newCompletedDays;
        if (isCompletedToday) {
          newCompletedDays = h.completedDays.filter(d => d !== todayStr);
        } else {
          newCompletedDays = [...h.completedDays, todayStr];
          const isPowerUpActive = progress.activePowerUp && progress.activePowerUp.expires > Date.now();
          const pointsEarned = isPowerUpActive ? 20 : 10;
          setProgress(p => ({...p, points: p.points + pointsEarned}));
          triggerConfetti();
        }
        return { ...h, completedDays: newCompletedDays };
      }
      return h;
    }));
  };

  const handlePurchase = (type: 'theme' | 'sound' | 'visualEffect' | 'powerUp', cost: number, id: string) => {
    // TODO: Update in Supabase
    if (progress.points < cost) return;
    
    let success = false;
    setProgress(prev => {
        const newProgress = { ...prev, points: prev.points - cost };
        switch(type) {
            case 'theme':
                if (!prev.purchasedThemes.includes(id)) {
                    newProgress.purchasedThemes = [...prev.purchasedThemes, id];
                    success = true;
                }
                break;
            case 'sound':
                if (!prev.purchasedSoundPacks.includes(id)) {
                    newProgress.purchasedSoundPacks = [...prev.purchasedSoundPacks, id];
                    success = true;
                }
                break;
            case 'visualEffect':
                if (!prev.purchasedConfettiPacks.includes(id)) {
                    newProgress.purchasedConfettiPacks = [...prev.purchasedConfettiPacks, id];
                    success = true;
                }
                break;
            case 'powerUp':
                 if (id === 'double_points_24h' && (!prev.activePowerUp || prev.activePowerUp.expires < Date.now())) {
                    const expiry = Date.now() + 24 * 60 * 60 * 1000;
                    newProgress.activePowerUp = { type: 'doublePoints', expires: expiry };
                    localStorage.setItem('ff_active_powerup', JSON.stringify(newProgress.activePowerUp));
                    success = true;
                 }
                break;
        }
        return newProgress;
    });

    if (success) triggerConfetti();
  };

  const handleThemeChange = (themeId: string) => {
    // TODO: Update in Supabase
    setProgress(prev => ({ ...prev, activeTheme: themeId }));
  };
  
  const handleSoundChange = (soundId: string) => {
    setActiveSound(soundId);
  };

  const sendEmailReport = async (type: 'day' | 'week') => {
    setIsSyncing(type);
    try {
      const relevantTasks = tasks.filter(t => !t.completed);
      const habitsStatus = habits.map(h => ({ title: h.title, done: h.completedDays.includes(new Date().toISOString().split('T')[0]) }));
      const prompt = `Generate a supportive, ADHD-friendly email summary for the user's ${type === 'day' ? 'today\'s' : 'this week\'s'} schedule. Tasks: ${JSON.stringify(relevantTasks)} Habits: ${JSON.stringify(habitsStatus)} User Points: ${progress.points} Include: A warm greeting, a clear prioritized list of 3 things to focus on, and a motivational closing. Format: Return ONLY the email body in Hebrew. Use professional yet caring tone. Use bullet points.`;
      const response = await generateContentWithFallback(prompt);
      if (!response) {
        alert("שגיאה ביצירת המייל. בדוק את מפתחות ה-API שלך בהגדרות.");
        setMainView('settings');
        return;
      }
      const emailBody = response.text;
      const subject = encodeURIComponent(`PandaClender: סיכום ${type === 'day' ? 'יומי' : 'שבועי'} ומפת דרכים לפוקוס`);
      const body = encodeURIComponent(emailBody || '');
      window.open(`mailto:?subject=${subject}&body=${body}`);
      triggerConfetti();
    } catch (error) {
      console.error("Email Generation Error", error);
      alert("שגיאה ביצירת המייל. בדוק שמפתח ה-API שהזנת תקין.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) console.error('Error logging in with Google:', error);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
  };

  const activeFocusTask = tasks.find(t => t.id === focusTaskId);

  const handleUpdateTask = async (updatedTask: Task) => {
    const { error } = await supabase
        .from('tasks')
        .update(toDbTask(updatedTask))
        .eq('id', updatedTask.id);

    if (error) {
        console.error("Error updating task:", error);
    } else {
        setTasks(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));
        if(viewingTask?.id === updatedTask.id) {
            setViewingTask(updatedTask);
        }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
        console.error("Error deleting task:", error);
    } else {
        setTasks(tasks.filter(t => t.id !== taskId));
        if(viewingTask?.id === taskId) {
            setViewingTask(null);
        }
    }
  };

  const handleStartPomodoro = (task: Task) => {
    setPomodoroTask(task);
  };
  
  const handleAddTasksFromBrainDump = (newTitles: string[]) => {
      newTitles.forEach(title => {
        const newTaskData = { 
            title, 
            priority: Priority.REGULAR, 
            dueDate: new Date(), 
            subTasks: [], 
            category: 'אישי' as const, 
            reminders: { dayBefore: true, hourBefore: true, fifteenMinBefore: true, custom: null }
        };
        handleAddTask(newTaskData);
      });
  };

  if (!session) {
    return <Auth />;
  }

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
        <ReminderSystem tasks={tasks} onComplete={handleToggleTaskCompletion} onSnooze={handleSnoozeTask} />
        <HabitReminderSystem habits={habits} onToggleHabit={handleToggleHabit} />
        {focusTaskId && activeFocusTask && <FocusMode task={activeFocusTask} onClose={() => setFocusTaskId(null)} onComplete={() => { handleToggleTaskCompletion(focusTaskId); setFocusTaskId(null); }} activeSound={activeSound} purchasedSoundPacks={progress.purchasedSoundPacks} />}
        {showAiCoach && <AiCoach tasks={tasks} progress={progress} onClose={() => setShowAiCoach(false)} />}
        {showBodyDoubling && <BodyDoubling onClose={() => setShowBodyDoubling(false)} />}
        {showAiAudioTools && <AiAudioTools onClose={() => setShowAiAudioTools(false)} />}
        {selectedCalendarDate && <CalendarDayModal date={selectedCalendarDate} tasks={tasks.filter(t => t.dueDate.toDateString() === selectedCalendarDate.toDateString())} onClose={() => setSelectedCalendarDate(null)} onAddTask={(title) => {
            const newTaskData = { title, priority: Priority.REGULAR, dueDate: selectedCalendarDate, subTasks: [], category: 'אישי' as const, reminders: { dayBefore: true, hourBefore: true, fifteenMinBefore: true, custom: null }};
            handleAddTask(newTaskData);
          }} onCompleteTask={handleToggleTaskCompletion}
        />}
        {viewingTask && (
            <TaskDetailModal 
              task={viewingTask}
              onClose={() => setViewingTask(null)}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onCompleteTask={(taskId) => {
                handleToggleTaskCompletion(taskId);
                setViewingTask(null);
              }}
              onSubTaskToggle={handleSubTaskToggle}
              onAddSubTask={handleAddSubTask}
              onStartPomodoro={handleStartPomodoro}
            />
          )}
        {struggleTask && <StruggleModeModal task={struggleTask} onClose={() => setStruggleTask(null)} />}


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
            {mainView === 'dashboard' && <Dashboard tasks={tasks} habits={habits} progress={progress} onSendEmail={sendEmailReport} isProcessing={isSyncing} onOpenAiCoach={() => setShowAiCoach(true)} onOpenBodyDoubling={() => setShowBodyDoubling(true)} onOpenAiAudioTools={() => setShowAiAudioTools(true)} onFocus={setFocusTaskId} onComplete={handleToggleTaskCompletion} onViewTask={setViewingTask} />}
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
            {mainView === 'habits' && <HabitTracker habits={habits} setHabits={setHabits} onToggleHabit={handleToggleHabit} />}
            {mainView === 'stats' && <ProgressStats tasks={tasks} habits={habits} progress={progress} />}
            {mainView === 'rewards' && <RewardsStore progress={progress} onPurchase={handlePurchase} activeTheme={progress.activeTheme} onThemeChange={handleThemeChange} />}
            {mainView === 'settings' && <Settings 
                googleClientId={''} setGoogleClientId={() => {}} 
                onGoogleLogin={handleGoogleLogin} isGoogleConnected={!!session} onLogout={handleLogout}
                isConnectingToGoogle={false}
                googleUser={session?.user} 
                customColors={customColors} setCustomColors={setCustomColors} 
                progress={progress}
                onThemeChange={handleThemeChange}
                activeSound={activeSound}
                onSoundChange={handleSoundChange}
                tasks={tasks}
                habits={habits}
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
        
        {showBrainDump && <BrainDump onClose={() => setShowBrainDump(false)} onAddTasks={handleAddTasksFromBrainDump} />}
      </div>
    </div>
  );
};

export default App;
