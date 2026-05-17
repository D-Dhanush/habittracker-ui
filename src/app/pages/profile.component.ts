import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-shell">
      <section class="profile-card">
        <div class="profile-avatar">AL</div>
        <div class="profile-details">
          <h2>Avery Strong</h2>
          <p class="profile-role">Habit Champion</p>
          <div class="profile-meta">
            <div><span>Email</span><strong>avery@example.com</strong></div>
            <div><span>Member since</span><strong>Feb 2025</strong></div>
            <div><span>Habits completed</span><strong>28</strong></div>
            <div><span>Current streak</span><strong>9 days</strong></div>
          </div>
        </div>
      </section>

      <section class="theme-panel">
        <h3>Theme mode</h3>
        <p>Choose a light or dark display mode for the app.</p>
        <div class="theme-actions">
          <button type="button" (click)="setTheme('dark')" [class.active]="activeTheme === 'dark'">Dark</button>
          <button type="button" (click)="setTheme('light')" [class.active]="activeTheme === 'light'">Light</button>
        </div>
      </section>
    </div>
  `,
  styles: [
    `.profile-shell { padding: 24px; display: grid; gap: 1.5rem; }`,
    `.profile-card { display: flex; gap: 1.5rem; padding: 1.75rem; border-radius: 24px; background: rgba(20, 50, 88, 0.68); border: 1px solid rgba(106, 177, 255, 0.18); box-shadow: 0 26px 60px rgba(10, 21, 40, 0.24); }`,
    `.profile-avatar { min-width: 96px; min-height: 96px; border-radius: 24px; background: linear-gradient(145deg, #4aa7ff, #82ccff); display: grid; place-items: center; color: #061325; font-size: 2.1rem; font-weight: 800; }`,
    `.profile-details { display: grid; gap: 1rem; color: #eef6ff; }`,
    `.profile-details h2 { margin: 0; font-size: 2rem; }`,
    `.profile-role { margin: 0; color: #bae1ff; }`,
    `.profile-meta { display: grid; gap: 0.85rem; }`,
    `.profile-meta div { display: flex; justify-content: space-between; gap: 1rem; padding: 0.9rem 1.1rem; background: rgba(255, 255, 255, 0.05); border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.08); }`,
    `.profile-meta span { color: rgba(207, 231, 255, 0.75); font-size: 0.9rem; }`,
    `.profile-meta strong { color: #f8fbff; }`,
    `.theme-panel { padding: 1.75rem; border-radius: 24px; background: rgba(20, 50, 88, 0.62); border: 1px solid rgba(106, 177, 255, 0.18); }`,
    `.theme-panel h3 { margin: 0 0 0.5rem; color: #eef6ff; }`,
    `.theme-actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem; }`,
    `.theme-actions button { min-width: 100px; padding: 0.9rem 1.2rem; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 999px; background: rgba(255, 255, 255, 0.06); color: #eef6ff; cursor: pointer; transition: transform 0.18s ease, background 0.18s ease; }`,
    `.theme-actions button.active, .theme-actions button:hover { background: rgba(74, 167, 255, 0.95); color: #061325; border-color: rgba(74, 167, 255, 0.95); transform: translateY(-1px); }`
  ]
})
export class ProfileComponent {
  activeTheme = 'dark';

  setTheme(theme: 'light' | 'dark'): void {
    this.activeTheme = theme;
    document.body.classList.toggle('light-theme', theme === 'light');
  }
}
