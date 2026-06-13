import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="stat-card" [class.large]="large">
      <div class="stat-content">
        <div class="stat-header">
          <p class="stat-label">{{ label }}</p>
          <mat-icon class="stat-icon" *ngIf="icon">{{ icon }}</mat-icon>
        </div>
        <div class="stat-value-wrapper">
          <span class="stat-value" [class]="valueClass">{{ value }}</span>
          <span class="stat-unit" *ngIf="unit">{{ unit }}</span>
        </div>
        <p class="stat-description" *ngIf="description">{{ description }}</p>
      </div>
      <div class="stat-glow"></div>
    </div>
  `,
  styleUrls: ['./stat-card.component.scss']
})
export class StatCardComponent {
  @Input() label: string = '';
  @Input() value: string | number = 0;
  @Input() unit: string = '';
  @Input() description: string = '';
  @Input() icon: string = '';
  @Input() large: boolean = false;
  @Input() valueClass: string = 'text-gold';
}
