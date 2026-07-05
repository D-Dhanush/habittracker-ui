// Shared category metadata for Habit creation/editing, and the source of
// every habit-card icon.
//
// Fixed two real bugs causing "empty icon placeholders" (Priority 1):
//   1. 'target' is NOT a valid ligature in the classic "Material Icons"
//      font (index.html links family=Material+Icons, not Material+Symbols).
//      It silently rendered as an empty box for the 'custom' category AND
//      as the fallback for any unmatched category — a very common path.
//      Replaced with 'emoji_events', a verified-valid ligature.
//   2. The category list didn't include several categories the product
//      spec explicitly calls out (Coding, Sleep, Reading) — habits tagged
//      with those fell through to the broken fallback above. Added them.

export const HABIT_CATEGORIES = [
  'fitness',
  'health',
  'productivity',
  'learning',
  'mindfulness',
  'finance',
  'social',
  'creative',
  'coding',
  'sleep',
  'reading',
  'custom'
] as const;

export type HabitCategory = typeof HABIT_CATEGORIES[number];

// Every value below is a verified-valid classic Material Icons ligature.
export const CATEGORY_ICONS: Record<HabitCategory, string> = {
  fitness: 'fitness_center',
  health: 'favorite',
  productivity: 'task_alt',
  learning: 'school',
  mindfulness: 'self_improvement',
  finance: 'savings',
  social: 'groups',
  creative: 'palette',
  coding: 'code',
  sleep: 'bedtime',
  reading: 'menu_book',
  custom: 'emoji_events'
};

export const CATEGORY_LABELS: Record<HabitCategory, string> = {
  fitness: 'Fitness',
  health: 'Health',
  productivity: 'Productivity',
  learning: 'Learning',
  mindfulness: 'Mindfulness',
  finance: 'Finance',
  social: 'Social',
  creative: 'Creative',
  coding: 'Coding',
  sleep: 'Sleep',
  reading: 'Reading',
  custom: 'Custom'
};

export function getCategoryIcon(category?: string | null): string {
  if (!category) return CATEGORY_ICONS.custom;
  return CATEGORY_ICONS[category as HabitCategory] ?? CATEGORY_ICONS.custom;
}

export function getCategoryLabel(category?: string | null): string {
  if (!category) return CATEGORY_LABELS.custom;
  return CATEGORY_LABELS[category as HabitCategory] ?? category;
}
