import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="messages.length">
      <div *ngFor="let toast of messages" class="toast toast-{{ toast.type }}" (click)="dismiss(toast.id)">
        <div class="toast-glitter"></div>
        <span>{{ toast.text }}</span>
      </div>
    </div>
  `,
  styles: [
    `.toast-container { position: fixed; right: 1.5rem; top: 1.5rem; display: grid; gap: 0.85rem; z-index: 5000; }`,
    `.toast { min-width: 240px; max-width: 360px; padding: 1rem 1.15rem; border-radius: 18px; color: white; font-weight: 600; box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35); cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.12); position: relative; overflow: hidden; }`,
    `.toast .toast-glitter { position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(rgba(255,255,255,0.7) 2px, transparent 2px); background-size: 40px 40px; mix-blend-mode: overlay; opacity: 0.15; animation: glitterMove 10s linear infinite; }`,
    // Fixed: was gold/amber, contradicting the spec's "Success = Green".
    `.toast-success { background: linear-gradient(135deg, #3ddc84, #1fa85c); border-color: rgba(61, 220, 132, 0.7); box-shadow: 0 0 24px rgba(61, 220, 132, 0.35); }`,
    `.toast-failure { background: linear-gradient(135deg, #ff5c6a, #d33a4a); border-color: rgba(255, 94, 106, 0.7); box-shadow: 0 0 24px rgba(255, 92, 106, 0.35); }`,
    // New: 'warning' type previously didn't exist on ToastService at all.
    `.toast-warning { background: linear-gradient(135deg, #ffd166, #f0a93a); color: #2a1d05; border-color: rgba(255, 209, 102, 0.7); box-shadow: 0 0 24px rgba(255, 209, 102, 0.35); }`,
    `.toast-info { background: linear-gradient(135deg, #4aa7ff, #78c4ff); border-color: rgba(122, 196, 255, 0.7); box-shadow: 0 0 24px rgba(74, 167, 255, 0.35); }`,
    `@keyframes glitterMove { 0% { background-position: 0 0; } 100% { background-position: 200px 200px; } }`
  ]
})
export class ToastComponent {
  messages: ToastMessage[] = [];

  constructor(private toastService: ToastService) {
    this.toastService.messages$.subscribe(messages => this.messages = messages);
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
