import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h2>Help</h2>
      <p>Need assistance? Find support and tips for using the habit tracker.</p>
    </div>
  `,
  styles: [
    `.page-container { padding: 24px; }`,
    `.page-container h2 { margin-bottom: 16px; }`
  ]
})
export class HelpComponent {}
