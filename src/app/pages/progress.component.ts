import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h2>Progress</h2>
      <p>Track your habit completion and streaks here.</p>
    </div>
  `,
  styles: [
    `.page-container { padding: 24px; }`,
    `.page-container h2 { margin-bottom: 16px; }`
  ]
})
export class ProgressComponent {}
