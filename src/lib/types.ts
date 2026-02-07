export enum Priority {
  URGENT = 'URGENT',
  IMPORTANT = 'IMPORTANT',
  REGULAR = 'REGULAR'
}

export type TaskStatus = 'todo' | 'done';

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
  user_id: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueDate: Date;
  creationDate: Date;
  completed: boolean;
  subTasks: SubTask[];
  category: 'לימודים' | 'עבודה' | 'בית' | 'אישי';
  reminders: ReminderConfig;
  energyLevel?: EnergyLevel;
  snoozedUntil?: number;
  status?: TaskStatus; // Backwards compatibility if needed
}

export interface Habit {
  id: string;
  title: string;
  icon: string;
  timeOfDay: 'morning' | 'noon' | 'evening';
  completedDays: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface UserProgress {
  user_id?: string;
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
    expires: number;
  } | null;
  apiKeys: string[];
}

export interface CustomColors {
  [Priority.URGENT]: string;
  [Priority.IMPORTANT]: string;
  [Priority.REGULAR]: string;
}

// DB Helper Interface
export interface DbTask {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    priority: Priority;
    due_date: string;
    creation_date: string;
    completed: boolean;
    sub_tasks: SubTask[];
    category: 'לימודים' | 'עבודה' | 'בית' | 'אישי';
    reminders: ReminderConfig;
    energy_level?: EnergyLevel;
    snoozed_until?: string;
}