export enum Priority {
  URGENT = 'URGENT', // אדום
  IMPORTANT = 'IMPORTANT', // כתום
  REGULAR = 'REGULAR' // ירוק
}

export type EnergyLevel = 'low' | 'medium' | 'high';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface CustomReminder {
  value: number;
  unit: 'minutes' | 'hours' | 'days';
}

export interface ReminderConfig {
  dayBefore: boolean;
  hourBefore: boolean;
  fifteenMinBefore: boolean;
  custom: CustomReminder | null;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate: Date;
  creationDate: Date;
  completed: boolean;
  subTasks: SubTask[]; // Kept as SubTask[] for frontend use
  category: 'לימודים' | 'עבודה' | 'בית' | 'אישי';
  reminders: ReminderConfig;
  energyLevel?: EnergyLevel;
  snoozedUntil?: number; // Timestamp for when the snooze period ends
  user_id?: string; // Add user_id for Supabase operations
}

export interface Habit {
  id: string;
  title: string;
  icon: string;
  timeOfDay: 'morning' | 'noon' | 'evening';
  completedDays: string[]; // ISO date strings
}

export interface UserProgress {
  points: number;
  level: number;
  streak: number;
  achievements: Achievement[];
  purchasedThemes: string[];
  activeTheme: string;
  purchasedSoundPacks: string[];
  purchasedConfettiPacks: string[];
  activePowerUp: {
    type: 'doublePoints';
    expires: number; // Timestamp
  } | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface CustomColors {
  [Priority.URGENT]: string;
  [Priority.IMPORTANT]: string;
  [Priority.REGULAR]: string;
}

// Interface for raw data from Supabase before conversion
export interface DbTask {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    priority: Priority;
    due_date: string; // This will be a string
    creation_date: string; // This will be a string
    completed: boolean;
    sub_tasks: SubTask[];
    category: 'לימודים' | 'עבודה' | 'בית' | 'אישי';
    reminders: ReminderConfig;
    energy_level?: EnergyLevel;
    snoozed_until?: string; // This can be a string
}