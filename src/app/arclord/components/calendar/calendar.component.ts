import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarData, CalendarDay } from '../../../models/analytics.model';
import { AnalyticsService } from '../../../services/analytics.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit {
  calendarData: CalendarData | null = null;
  loading = true;
  error = false;

  currentMonth: number;
  currentYear: number;

  selectedDay: CalendarDay | null = null;

  readonly DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(private analyticsService: AnalyticsService) {
    const now = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear  = now.getFullYear();
  }

  ngOnInit(): void { this.loadCalendar(); }

  loadCalendar(): void {
    this.loading = true;
    this.error = false;
    this.selectedDay = null;
    this.analyticsService.getCalendarData(this.currentMonth, this.currentYear).subscribe({
      next: data => { this.calendarData = data; this.loading = false; },
      error: ()   => { this.error = true;  this.loading = false; }
    });
  }

  prevMonth(): void {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else { this.currentMonth--; }
    this.loadCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else { this.currentMonth++; }
    this.loadCalendar();
  }

  goToToday(): void {
    const now = new Date();
    this.currentMonth = now.getMonth();
    this.currentYear  = now.getFullYear();
    this.loadCalendar();
  }

  get isTodayMonth(): boolean {
    const now = new Date();
    return this.currentMonth === now.getMonth() && this.currentYear === now.getFullYear();
  }

  isToday(date: Date): boolean {
    const now = new Date(); now.setHours(0,0,0,0);
    return date.getTime() === now.getTime();
  }

  selectDay(day: CalendarDay): void {
    if (day.empty) return;
    this.selectedDay = this.selectedDay?.date.getTime() === day.date.getTime() ? null : day;
  }

  dayClass(day: CalendarDay): string {
    if (day.empty)      return 'day-empty';
    if (day.perfectDay) return 'day-perfect';
    if (day.completed)  return 'day-completed';
    if (day.partial)    return 'day-partial';
    const now = new Date(); now.setHours(0,0,0,0);
    if (day.date < now) return 'day-missed';
    return 'day-future';
  }

  get selectedDayIsFuture(): boolean {
    if (!this.selectedDay) return false;
    const now = new Date(); now.setHours(0,0,0,0);
    return this.selectedDay.date > now;
  }
}
