import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h2>Settings</h2>
      <p>Configure your habit tracker experience and preferences here.</p>
    </div>
  `,
  styles: [
    `.page-container { padding: 24px; }`,
    `.page-container h2 { margin-bottom: 16px; }`
  ]
})
export class SettingsComponent {}
