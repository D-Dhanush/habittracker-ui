export interface CreateHabitDto {
  Name: string;
  Description?: string;
  StartDateUtc?: string; // ISO string, e.g., "2026-03-06T00:00:00Z"
  Frequency: string;
  TargetOccurrencesPerPeriod?: number;
  ReminderTimeUtc?: string; // ISO 8601 duration or "HH:mm:ss" string
  Tags?: string[];
  IsActive: boolean;
}