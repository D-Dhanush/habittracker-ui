import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="help-shell">
      <h2>Help</h2>
      <p>Everything you need is described here, with quick links to the major sections.</p>

      <div class="quick-links">
        <a href="#profile">Profile setup</a>
        <a href="#settings">Security & roles</a>
        <a href="#habit-details">Habit details</a>
        <a href="#features">Features overview</a>
      </div>

      <section id="features" class="help-section">
        <h3>Features overview</h3>
        <ul>
          <li>Habit creation, tracking, and management.</li>
          <li>Streak tracking, goal planning, and level progression.</li>
          <li>Profile shelf with user details and theme selection.</li>
          <li>Settings layout for admin / mentor / player permission selection.</li>
          <li>Help page navigation and quick access links.</li>
        </ul>
      </section>

      <section id="habit-details" class="help-section">
        <h3>Habit details</h3>
        <p>Use the habit detail page to track streaks, view calendar progress, and see your level-up strategy.</p>
      </section>

      <section id="profile" class="help-section">
        <h3>Profile</h3>
        <p>The profile section shows your name, email, habit stats, and theme controls.</p>
      </section>

      <section id="settings" class="help-section">
        <h3>Settings</h3>
        <p>Choose permissions for Admin, Mentor, and Player roles. Admin has full control over habit actions.</p>
      </section>

      <section class="help-section">
        <h3>Quick actions</h3>
        <ul>
          <li>Click the logo in the header to preview the full image.</li>
          <li>Use habit goal and streak panels to see how many days you have planned.</li>
          <li>The admin section is designed for security control over habit records.</li>
        </ul>
      </section>
    </div>
  `,
  styles: [
    `.help-shell { padding: 24px; display: grid; gap: 1.5rem; }`,
    `.help-shell h2 { margin: 0; color: #eef6ff; }`,
    `.quick-links { display: flex; flex-wrap: wrap; gap: 0.85rem; margin: 1rem 0; }`,
    `.quick-links a { color: #82ccff; background: rgba(255, 255, 255, 0.06); padding: 0.85rem 1rem; border-radius: 999px; text-decoration: none; border: 1px solid rgba(255, 255, 255, 0.08); }`,
    `.help-section { padding: 1.4rem 1.5rem; border-radius: 24px; background: rgba(20, 50, 88, 0.38); border: 1px solid rgba(90, 170, 255, 0.16); }`,
    `.help-section h3 { margin-top: 0; color: #f8fbff; }`,
    `.help-section p, .help-section ul { margin: 0 0 0.85rem; color: rgba(226, 236, 255, 0.88); line-height: 1.7; }`,
    `.help-section ul { list-style: inside disc; }`
  ]
})
export class HelpComponent {}
