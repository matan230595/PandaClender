import React, { useState, useEffect, useRef } from 'react';
import { Task, Habit, UserProgress, Priority, SubTask, CustomColors, DbTask } from '../lib/types';
import { ACHIEVEMENTS } from '../lib/constants';
import Header from './Header';
import WeeklyCalendar from './WeeklyCalendar';
import MonthlyCalendar from './MonthlyCalendar';
import DailySchedule from './DailySchedule';
import FocusMode from './FocusMode';
import Pomodoro from './Pomodoro';
import HabitTracker from './HabitTracker';
import TaskManager from './TaskManager';
import ReminderSystem from './ReminderSystem';
import ProgressStats from './ProgressStats';
import Dashboard from './Dashboard';
import BrainDump from './BrainDump';
import Settings from './Settings';
import RewardsStore from './RewardsStore';
import AiCoach from './AiCoach';
import BodyDoubling from './BodyDoubling';
import CalendarDayModal from './CalendarDayModal';
import { generateContentWithFallback, parseTaskFromCommand } from '../utils/ai';
import HabitReminderSystem from './HabitReminderSystem';
import TaskDetailModal from './TaskDetailModal';
import StruggleModeModal from './StruggleModeModal';
import AiAudioTools from './AiAudioTools';
import { supabase, supabaseInitializationError } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';
import Auth from './Auth';

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

const toDbProgress = (progress: UserProgress, userId: string) => ({
    user_id: userId,
    points: progress.points,
    level: progress.level,
    streak: progress.streak,
    achievements: progress.achievements,
    purchased_themes: progress.purchasedThemes,
    active_theme: progress.activeTheme,
    purchased_sound_packs: progress.purchasedSoundPacks,
    purchased_confetti_packs: progress.purchasedConfettiPacks,
    active_power_up: progress.activePowerUp,
    api_keys: progress.apiKeys,
});

const fromDbProgress = (dbProgress: any): UserProgress => ({
    points: dbProgress.points,
    level: dbProgress.level,
    streak: dbProgress.streak,
    achievements: dbProgress.achievements,
    purchasedThemes: dbProgress.purchased_themes,
    activeTheme: dbProgress.active_theme,
    purchasedSoundPacks: dbProgress.purchased_sound_packs,
    purchasedConfettiPacks: dbProgress.purchased_confetti_packs,
    activePowerUp: dbProgress.active_power_up,
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

const LoadingScreen: React.FC = () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 font-bold text-slate-500">טוען...</p>
    </div>
);


const App: React.FC = () => {
  if (supabaseInitializationError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-200 w-full max-w-lg">
            <h1 className="text-3xl font-bold text-red-800 mb-4">🚨 שגיאת תצורה 🚨</h1>
            <p className="text-slate-700 mb-6">נראה שיש בעיה בהגדרות האפליקציה שמונעת ממנה לעבוד כראוי.</p>
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-start text-sm font-mono">
                <p className="font-bold">פרטי השגיאה:</p>
                <p>{supabaseInitializationError}</p>
            </div>
            <p className="text-slate-500 mt-6 text-xs">אם אתה בעל האפליקציה, אנא ודא שהגדרת את משתני הסביבה כראוי בסביבת הפריסה (למשל Vercel).</p>
        </div>
      </div>
    );
  }

  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [progress, setProgress] = useState<UserProgress>(initialProgress);
  const isInitialLoadComplete = useRef(false);

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

  // Supabase Auth
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      isInitialLoadComplete.current = false;
    });

    return () => subscription.unsubscribe();
  }, []);

  // Data Loading
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) return;
      setIsLoading(true);
      if (session) {
        isInitialLoadComplete.current = false;
        // Fetch Tasks, Habits, and Progress in parallel
        const [tasksResponse, habitsResponse, progressResponse] = await Promise.all([
          supabase.from('tasks').select('*').eq('user_id', session.user.id),
          supabase.from('habits').select('*').eq('user_id', session.user.id),
          supabase.from('user_progress').select('*').eq('user_id', session.user.id).single()
        ]);

        // Process Tasks
        if (tasksResponse.error) console.error('Error fetching tasks:', tasksResponse.error.message);
        else setTasks((tasksResponse.data as DbTask[] || []).map(fromDbTask));

        // Process Habits
        if (habitsResponse.error) console.error('Error fetching habits:', habitsResponse.error.message);
        else setHabits((habitsResponse.data || []).map(h => ({
                id: h.id, title: h.title, icon: h.icon, timeOfDay: h.time_of_day, completedDays: h.completed_days || []
             })));
        
        // Process Progress
        if (progressResponse.error && progressResponse.error.code !== 'PGRST116') { // Ignore 'exact one row' error
            console.error('Error fetching progress:', progressResponse.error.message);
            // This is a critical error to inform the user about.
            if (progressResponse.error.message.includes("schema cache")) {
                 alert("שגיאה חמורה: נראה שמבנה מסד הנתונים אינו מעודכן. אנא פנה לתמיכה או נסה לרענן את הסכמה ב-Supabase.");
            }
        } else if (progressResponse.data) {
            setProgress(fromDbProgress(progressResponse.data));
        } else {
            // No progress found, initialize for new user
            setProgress(initialProgress);
        }
        
        isInitialLoadComplete.current = true;
      } else {
        setTasks([]);
        setHabits([]);
        setProgress(initialProgress);
        isInitialLoadComplete.current = false;
      }
      setIsLoading(false);
    };

    fetchData();
  }, [session]);

  // Data Saving for Progress
  useEffect(() => {
    const saveProgress = async () => {
        if (session && isInitialLoadComplete.current && supabase) {
            const dbProgress = toDbProgress(progress, session.user.id);
            const { error } = await supabase.from('user_progress').upsert(dbProgress);
            if(error) console.error("Error saving progress:", error.message);
        }
    };
    
    // Debounce saving to avoid rapid writes
    const handler = setTimeout(() => {
        saveProgress();
    }, 1000);

    return () => clearTimeout(handler);
  }, [progress, session]);


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
    if (!session || !supabase) return;
    const fullNewTask: Task = {
        ...newTaskData,
        id: '', // Will be set by DB
        creationDate: new Date(),
        completed: false,
        user_id: session.user.id
    };
    
    const { data, error } = await supabase
        .from('tasks')
        .insert([toDbTask(fullNewTask)])
        .select()
        .single();
        
    if (error) {
        console.error("Error adding task:", error.message);
        alert(`שגיאה בהוספת משימה: ${error.message}`);
    } else if (data) {
        setTasks(prev => [fromDbTask(data as DbTask), ...prev]);
        triggerConfetti();
    }
  };

  const handleAddTaskFromNaturalLanguage = async (command: string) => {
    try {
      const parsedTask = await parseTaskFromCommand(command);
      if (!parsedTask) {
        throw new Error("לא הצלחתי להבין את הבקשה. נסה לפרט יותר.");
      }
      
      const newTaskData = {
        title: parsedTask.title,
        dueDate: new Date(parsedTask.dueDate),
        reminders: { ...parsedTask.reminders, custom: null },
        priority: parsedTask.priority || Priority.REGULAR,
        subTasks: [],
        category: 'אישי' as const, // Default category
      };

      await handleAddTask(newTaskData);
      
    } catch (error: any) {
      console.error("Error processing natural language command:", error);
      throw error;
    }
  };

  const handleToggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !supabase) return;
    
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
        console.error("Error updating task completion:", error.message);
    } else {
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
        if (isNowCompleted) {
          const isPowerUpActive = progress.activePowerUp && progress.activePowerUp.expires > Date.now();
          const pointsEarned = isPowerUpActive ? 40 : 20;
          
          setProgress(p => {
              const newAchievements = p.achievements.map(a => {
                  if (a.id === 'a1' && !a.unlocked) return {...a, unlocked: true};
                  return a;
              });
              return { ...p, points: p.points + pointsEarned, achievements: newAchievements };
          });

          triggerConfetti();
        }
    }
  };
  
  const handleSnoozeTask = async (taskId: string, minutes: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !supabase) return;

    const now = Date.now();
    const newDueDate = new Date(now + minutes * 60000);
    const snoozedUntil = now + minutes * 60000;
    const updatedTask = { ...task, dueDate: newDueDate, snoozedUntil };

    const { error } = await supabase
        .from('tasks')
        .update({ 
            due_date: newDueDate.toISOString(),
            snoozed_until: new Date(snoozedUntil).toISOString() 
        })
        .eq('id', taskId);
    
    if (error) {
        console.error("Error snoozing task:", error.message);
    } else {
        setTasks(prev => prev.map(t => (t.id === taskId ? updatedTask : t)));
    }
  };

  const handleSubTaskToggle = async (taskId: string, subTaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !supabase) return;

    const newSubTasks = task.subTasks.map(st => 
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    const allSubTasksNowComplete = newSubTasks.length > 0 && newSubTasks.every(st => st.completed);
    const updatedTask = { ...task, subTasks: newSubTasks, completed: allSubTasksNowComplete };

    const { error } = await supabase
        .from('tasks')
        .update({ sub_tasks: newSubTasks, completed: allSubTasksNowComplete })
        .eq('id', taskId);

    if (error) {
        console.error("Error updating subtask:", error.message);
    } else {
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t));
        if (allSubTasksNowComplete && !task.completed) {
            const isPowerUpActive = progress.activePowerUp && progress.activePowerUp.expires > Date.now();
            const pointsEarned = isPowerUpActive ? 40 : 20;
            setProgress(p => ({ ...p, points: p.points + pointsEarned }));
            triggerConfetti();
        }
    }
  };
  
  const handleAddSubTask = async (taskId: string, subTaskTitle: string) => {
    if (!subTaskTitle.trim()) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || !supabase) return;

    const newSubTask: SubTask = { id: `${taskId}-${Math.random().toString(36).substr(2, 9)}`, title: subTaskTitle.trim(), completed: false };
    const newSubTasks = [...task.subTasks, newSubTask];
    const updatedTask = { ...task, subTasks: newSubTasks, completed: false };

    const { error } = await supabase
        .from('tasks')
        .update({ sub_tasks: newSubTasks, completed: false })
        .eq('id', taskId);
    
    if (error) {
        console.error("Error adding subtask:", error.message);
    } else {
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t));
    }
  };
  
  const handleToggleHabit = async (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !supabase) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const isCompletedToday = habit.completedDays.includes(todayStr);
    const newCompletedDays = isCompletedToday
        ? habit.completedDays.filter(d => d !== todayStr)
        : [...habit.completedDays, todayStr];
    
    const updatedHabit = { ...habit, completedDays: newCompletedDays };

    const { error } = await supabase
        .from('habits')
        .update({ completed_days: newCompletedDays })
        .eq('id', habitId);

    if (error) {
        console.error("Error updating habit:", error.message);
    } else {
        setHabits(prev => prev.map(h => (h.id === habitId ? updatedHabit : h)));
        if (!isCompletedToday) {
            const isPowerUpActive = progress.activePowerUp && progress.activePowerUp.expires > Date.now();
            const pointsEarned = isPowerUpActive ? 20 : 10;
            setProgress(p => ({...p, points: p.points + pointsEarned}));
            triggerConfetti();
        }
    }
  };

  const handleAddHabit = async (habitData: Omit<Habit, 'id' | 'completedDays'>) => {
    if (!session || !supabase) return;
    const dbHabit = {
        title: habitData.title,
        icon: habitData.icon,
        time_of_day: habitData.timeOfDay,
        user_id: session.user.id,
        completed_days: [],
    };
    const { data, error } = await supabase
        .from('habits')
        .insert([dbHabit])
        .select()
        .single();

    if (error) {
        console.error("Error adding habit:", error.message);
         alert(`שגיאה בהוספת הרגל: ${error.message}`);
    } else if (data) {
        const frontendHabit: Habit = {
            id: data.id,
            title: data.title,
            icon: data.icon,
            timeOfDay: data.time_of_day,
            completedDays: data.completed_days
        };
        setHabits(prev => [frontendHabit, ...prev]);
    }
  };

  const handleUpdateHabit = async (updatedHabit: Habit) => {
    if (!supabase) return;
      const { error } = await supabase
        .from('habits')
        .update({
            title: updatedHabit.title,
            icon: updatedHabit.icon,
            time_of_day: updatedHabit.timeOfDay,
        })
        .eq('id', updatedHabit.id);
    
    if (error) {
        console.error("Error updating habit:", error.message);
    } else {
        setHabits(prev => prev.map(h => h.id === updatedHabit.id ? updatedHabit : h));
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('habits').delete().eq('id', habitId);
    if (error) {
        console.error("Error deleting habit:", error.message);
    } else {
        setHabits(prev => prev.filter(h => h.id !== habitId));
    }
  };

  const handlePurchase = (type: 'theme' | 'sound' | 'visualEffect' | 'powerUp', cost: number, id: string) => {
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
                    success = true;
                 }
                break;
        }
        return newProgress;
    });

    if (success) triggerConfetti();
  };

  const handleThemeChange = (themeId: string) => {
    setProgress(prev => ({ ...prev, activeTheme: themeId }));
  };
  
  const handleSoundChange = (soundId: string) => {
    setActiveSound(soundId);
  };
  
  const handleUpdateApiKeys = async (newKeys: string[]) => {
    if (!session || !supabase) return;
    setProgress(prev => ({...prev, apiKeys: newKeys}));
    // The useEffect for progress saving will automatically sync this to Supabase.
  };

  const sendEmailReport = async (type: 'day' | 'week') => {
    setIsSyncing(type);
    try {
      const relevantTasks = tasks.filter(t => !t.completed);
      const habitsStatus = habits.map(h => ({ title: h.title, done: h.completedDays.includes(new Date().toISOString().split('T')[0]) }));
      const prompt = `Generate a supportive, ADHD-friendly email summary for the user's ${type === 'day' ? 'today\'s' : 'this week\'s'} schedule. Tasks: ${JSON.stringify(relevantTasks)} Habits: ${JSON.stringify(habitsStatus)} User Points: ${progress.points} Include: A warm greeting, a clear prioritized list of 3 things to focus on, and a motivational closing. Format: Return ONLY the email body in Hebrew. Use professional yet caring tone. Use bullet points.`;
      const response = await generateContentWithFallback(prompt);
      if (!response || !response.text) {
        // AI call failed, maybe show a toast notification in a real app
        console.error("שגיאה ביצירת המייל. בדוק את מפתחות ה-API שלך בהגדרות.");
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
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) return;
    isInitialLoadComplete.current = false;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error.message);
  };

  const activeFocusTask = tasks.find(t => t.id === focusTaskId);

  const handleUpdateTask = async (updatedTask: Task) => {
    if (!supabase) return;
    const { error } = await supabase
        .from('tasks')
        .update(toDbTask(updatedTask))
        .eq('id', updatedTask.id);

    if (error) {
        console.error("Error updating task:", error.message);
    } else {
        setTasks(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));
        if(viewingTask?.id === updatedTask.id) {
            setViewingTask(updatedTask);
        }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!supabase) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
        console.error("Error deleting task:", error.message);
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
  
  if (isLoading) {
    return <LoadingScreen />;
  }

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
            {mainView === 'dashboard' && <Dashboard tasks={tasks} onSendEmail={sendEmailReport} isProcessing={isSyncing} onOpenAiCoach={() => setShowAiCoach(true)} onOpenBodyDoubling={() => setShowBodyDoubling(true)} onOpenAiAudioTools={() => setShowAiAudioTools(true)} onComplete={handleToggleTaskCompletion} onViewTask={setViewingTask} onAddTaskFromNaturalLanguage={handleAddTaskFromNaturalLanguage} />}
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
            {mainView === 'rewards' && <RewardsStore progress={progress} onPurchase={handlePurchase} activeTheme={progress.activeTheme} onThemeChange={handleThemeChange} />}
            {mainView === 'settings' && <Settings 
                onGoogleLogin={() => supabase && supabase.auth.signInWithOAuth({ provider: 'google' })} 
                isGoogleConnected={!!session} onLogout={handleLogout}
                isConnectingToGoogle={false}
                googleUser={session?.user} 
                customColors={customColors} setCustomColors={setCustomColors} 
                progress={progress}
                onThemeChange={handleThemeChange}
                activeSound={activeSound}
                onSoundChange={handleSoundChange}
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
        
        {showBrainDump && <BrainDump onClose={() => setShowBrainDump(false)} onAddTasks={handleAddTasksFromBrainDump} />}
      </div>
    </div>
  );
};

export default App;