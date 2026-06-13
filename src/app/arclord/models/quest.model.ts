export interface Quest {
  id: string;
  name: string;
  category: string;
  difficulty: string;
  xp: number;
  streak: number;
  progress: number;
  status: 'Active' | 'Paused' | 'Completed';
  icon: string;
  description: string;
  completionRate: number;
  lastUpdated: string;
  checklist: ChecklistTask[];
  notes: string;
  calendar: CalendarCell[];
  logs: string[];
}

export interface ChecklistTask {
  title: string;
  done: boolean;
}

export interface CalendarCell {
  day: string;
  completed: boolean;
}

export interface Milestone {
  title: string;
  description: string;
  complete: boolean;
  reward: string;
}

export interface ActivityEntry {
  time: string;
  title: string;
  details: string;
}
