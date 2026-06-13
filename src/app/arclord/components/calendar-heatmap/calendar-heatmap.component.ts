import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CalendarData, CalendarDay } from '../../../models/analytics.model';

@Component({
  selector: 'app-calendar-heatmap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-heatmap.component.html',
  styleUrls: ['./calendar-heatmap.component.scss']
})
export class CalendarHeatmapComponent implements OnInit {
  @Input() calendarData!: CalendarData;

  dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit(): void {
    if (!this.calendarData) {
      this.calendarData = {
        weeks: [],
        month: 'January',
        year: 2024
      };
    }
  }

  getCellClass(day: CalendarDay): string {
    if (day.empty) {
      return 'cell empty';
    }
    if (day.completed && day.inStreak) {
      return 'cell streak';
    }
    if (day.completed) {
      return 'cell completed';
    }
    return 'cell pending';
  }

  getDayDateString(day: CalendarDay): string {
    return day.date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getStatusText(day: CalendarDay): string {
    if (day.empty) {
      return '';
    }
    if (day.inStreak) {
      return 'Streak Day';
    }
    if (day.completed) {
      return 'Completed';
    }
    return 'Pending';
  }
}
