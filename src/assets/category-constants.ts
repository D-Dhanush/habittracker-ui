// Shared category metadata for Habit creation/editing.
// Previously habit.component.ts had stub methods (getCategoryIcon always
// returned 'target', getCategoryLabel just echoed its input) instead of
// using a real lookup. This is that real lookup, extracted from the old
// (now-deleted) habit.model.ts so it has an actual consumer.

export const HABIT_CATEGORIES = [
  'fitness',
  'health',
  'productivity',
  'learning',
  'mindfulness',
  'finance',
  'social',
  'creative',
  'custom'
] as const;

export type HabitCategory = typeof HABIT_CATEGORIES[number];

export const CATEGORY_ICONS: Record<HabitCategory, string> = {
  fitness: 'fitness_center',
  health: 'favorite',
  productivity: 'task_alt',
  learning: 'school',
  mindfulness: 'self_improvement',
  finance: 'savings',
  social: 'groups',
  creative: 'palette',
  custom: 'target'
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
