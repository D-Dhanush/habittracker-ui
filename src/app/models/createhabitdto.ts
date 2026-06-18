
export interface CreateHabitDto {
  name: string;
  subtitle?: string;
  description?: string;
  category: string;
  customCategory?: string;
  frequency: string;
  startDateUtc?: string; // ISO string, e.g., "2026-03-06T00:00:00Z"
  endDateUtc?: string;
  targetOccurrencesPerPeriod?: number;
  reminderTimeUtc?: string; // "HH:mm:ss"
  icon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  xpReward?: number;
  tags?: string[];
  notes?: string;
  isActive?: boolean;
}
