import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-shell">
      <div class="section-card admin-card">
        <h2>Admin</h2>
        <p>Highest access level. Admin has full habit security controls.</p>
        <div class="permission-grid">
          <label *ngFor="let option of permissions">
            <input type="radio" name="adminPermission" [value]="option" [checked]="selected.admin === option" (change)="selectPermission('admin', option)"> {{ option }}
          </label>
        </div>
      </div>

      <div class="section-card mentor-card">
        <h2>Mentor</h2>
        <p>Mentors are higher-level users with expanded guidance privileges.</p>
        <div class="permission-grid">
          <label *ngFor="let option of permissions">
            <input type="radio" name="mentorPermission" [value]="option" [checked]="selected.mentor === option" (change)="selectPermission('mentor', option)"> {{ option }}
          </label>
        </div>
      </div>

      <div class="section-card player-card">
        <h2>Player</h2>
        <p>Standard users can follow habits and track progress.</p>
        <div class="permission-grid">
          <label *ngFor="let option of permissions">
            <input type="radio" name="playerPermission" [value]="option" [checked]="selected.player === option" (change)="selectPermission('player', option)"> {{ option }}
          </label>
        </div>
      </div>

      <div class="note-card">
        <strong>Note:</strong> Security system is not live yet. For now, habit records support create, read, edit, and delete actions only.
      </div>
    </div>
  `,
  styles: [
    `.settings-shell { padding: 24px; display: grid; gap: 1.5rem; }`,
    `.section-card { padding: 1.75rem; border-radius: 24px; background: rgba(19, 60, 110, 0.34); border: 1px solid rgba(90, 170, 255, 0.18); box-shadow: 0 24px 55px rgba(10, 28, 55, 0.2); }`,
    `.section-card h2 { margin: 0 0 0.5rem; color: #f8fbff; }`,
    `.section-card p { margin: 0 1rem 1rem 0; color: rgba(221, 234, 255, 0.8); }`,
    `.permission-grid { display: flex; flex-wrap: wrap; gap: 0.85rem; }`,
    `.permission-grid label { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1rem; border-radius: 999px; background: rgba(255, 255, 255, 0.06); color: #eef6ff; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.08); }`,
    `.permission-grid input { accent-color: #4aa7ff; }`,
    `.note-card { padding: 1.25rem 1.5rem; border-radius: 20px; background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.1); color: #e9f7ff; }`
  ]
})
export class SettingsComponent {
  permissions = ['Create', 'Read', 'Update', 'Delete'];
  selected = {
    admin: 'Create',
    mentor: 'Read',
    player: 'Read'
  };

  selectPermission(role: 'admin' | 'mentor' | 'player', permission: string): void {
    this.selected[role] = permission;
  }
}
