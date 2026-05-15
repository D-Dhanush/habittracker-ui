import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <h2>Profile</h2>
      <p>View and manage your account details and habit preferences.</p>
    </div>
  `,
  styles: [
    `.page-container { padding: 24px; }`,
    `.page-container h2 { margin-bottom: 16px; }`
  ]
})
export class ProfileComponent {}
