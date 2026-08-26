import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Not a Material CDK dialog on purpose — kept as a plain overlay component
 * so it can be dropped inline by PremiumLockComponent (or triggered from a
 * route guard) without pulling in MatDialogModule wiring everywhere premium
 * gating is checked.
 */
@Component({
  selector: 'app-upgrade-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upgrade-dialog.component.html',
  styleUrls: ['./upgrade-dialog.component.scss']
})
export class UpgradeDialogComponent {
  /** Optional — customizes the message for the feature that triggered it. */
  @Input() featureLabel: string | null = null;
  @Output() closed = new EventEmitter<void>();

  constructor(private router: Router) {}

  get message(): string {
    if (this.featureLabel) {
      return `Upgrade now to continue using ${this.featureLabel} and all other premium features.`;
    }
    return 'Your 3-day Premium Trial has ended. Upgrade now to continue using AI, Unlimited Habits, Advanced Analytics, Premium Themes and future premium features.';
  }

  upgradeNow(): void {
    this.closed.emit();
    this.router.navigate(['/subscription/plans']);
  }

  maybeLater(): void {
    this.closed.emit();
  }
}