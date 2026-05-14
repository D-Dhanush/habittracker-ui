export interface HabitDto {
  id: string;
  name: string;
  description?: string;
  startDt?: string;
  frequency: string;
  targetOccurrencesPerPeriod?: number;
  reminderTimeUtc?: string;
  tags?: string[];
  isActive: boolean;
  // Add any other properties returned by your backend, e.g., createdAt, updatedAt, etc.
}