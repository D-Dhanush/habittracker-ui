import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { UserService, UserDto } from '../services/user.service';
import { HabitService, HabitStatsDto } from '../services/habit.service';

/**
 * Full rewrite. The original was 100% static mock data — "Avery Strong",
 * a fake email, "28 habits completed", "9 day streak" — none of it backed
 * by a single service call, despite UserService/HabitService already
 * existing and providing exactly this data. Now pulls the real signed-in
 * user (UserService.getCurrentUser — Phase 1's seeded default user, see
 * login.component.ts for the full explanation of why there's no real
 * credential check yet) and real stats.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  loading = true;
  error = false;

  user: UserDto | null = null;
  stats: HabitStatsDto | null = null;
  activeTheme: 'dark' | 'light' = 'dark';

  ngOnInit(): void {
    this.loadProfile();
  }

  constructor(
    private userService: UserService,
    private habitService: HabitService
  ) {}

  loadProfile(): void {
    this.loading = true;
    this.error = false;

    forkJoin({
      user: this.userService.getCurrentUser(),
      stats: this.habitService.getStats()
    }).subscribe({
      next: ({ user, stats }) => {
        this.user = user;
        this.stats = stats;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  get initials(): string {
    const name = this.user?.displayName || this.user?.email || '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  get memberSince(): string {
    if (!this.user?.createdDt) return 'Unknown';
    return new Date(this.user.createdDt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.activeTheme = theme;
    document.body.classList.toggle('light-theme', theme === 'light');
  }
}
