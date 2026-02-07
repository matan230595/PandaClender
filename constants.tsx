
import React from 'react';
import { Priority, Task, Habit, Achievement } from './types';

export const PRIORITY_COLOR_CLASSES = {
  [Priority.URGENT]: 'bg-red-500 text-white border-red-600',
  [Priority.IMPORTANT]: 'bg-orange-400 text-white border-orange-500',
  [Priority.REGULAR]: 'bg-emerald-500 text-white border-emerald-600',
};

export const CATEGORY_ICONS = {
  'לימודים': '📚',
  'עבודה': '💼',
  'בית': '🏠',
  'אישי': '✨',
};

export const CATEGORIES: Array<Task['category']> = ['לימודים', 'עבודה', 'בית', 'אישי'];

export const ENERGY_LEVEL_ICONS = {
  low: '🔋',
  medium: '⚡️',
  high: '🔥'
};

const defaultReminders = { dayBefore: true, hourBefore: true, fifteenMinBefore: true, custom: null };

export const INITIAL_TASKS: Task[] = [];

export const INITIAL_HABITS: Habit[] = [];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'מתחילים חזק', description: 'השלמת משימה ראשונה', icon: '🎯', unlocked: false },
  { id: 'a2', title: 'רצף של 3 ימים', description: 'שמרת על רצף של 3 ימים', icon: '🔥', unlocked: false },
  { id: 'a3', title: 'מאסטר הרגלים', description: 'השלמת את כל הרגלי הבוקר', icon: '👑', unlocked: false },
  { id: 'a4', title: 'פוקוס על', description: 'ביצעת 5 סשני פוקוס', icon: '⚡', unlocked: false },
];

export const APP_REWARDS = {
  themes: [
    { id: 'default', name: 'ערכת ברירת מחדל', cost: 0, cssClass: 'theme-default', previewColor: 'bg-indigo-600' },
    { id: 'dark', name: 'ערכה אפלה', cost: 250, cssClass: 'theme-dark', previewColor: 'bg-slate-800' },
    { id: 'forest', name: 'ערכת יער', cost: 400, cssClass: 'theme-forest', previewColor: 'bg-emerald-700' },
  ],
  sounds: [
      { id: 'none', name: 'ללא', cost: 0, previewIcon: '🔇' },
      { id: 'brownNoise', name: 'רעש חום', cost: 150, previewIcon: '🌊' },
      { id: 'lofi', name: 'Lofi Beats', cost: 200, previewIcon: '🎧' },
      { id: 'nature', name: 'צלילי טבע', cost: 300, previewIcon: '🏞️' },
      { id: 'cafe', name: 'רעשי בית קפה', cost: 300, previewIcon: '☕' },
  ],
  visualEffects: [
      { id: 'rainbow_confetti', name: 'קונפטי צבעוני', cost: 500, previewIcon: '🌈' },
  ],
  powerUps: [
      { id: 'double_points_24h', name: 'הכפלת נקודות ל-24 שעות', cost: 1000, previewIcon: '✨' },
  ]
};
