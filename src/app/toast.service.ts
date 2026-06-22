import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Was missing 'warning' entirely — the product spec calls for four toast
// colors (Success=Green, Error=Red, Warning=Yellow, Information=Blue) but
// only three types existed. Added 'warning' without renaming 'failure',
// since 'failure' is already the established name used across components.
export type ToastType = 'success' | 'failure' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private messagesSubject = new BehaviorSubject<ToastMessage[]>([]);
  messages$ = this.messagesSubject.asObservable();

  show(text: string, type: ToastType = 'info', duration = 3600): void {
    const message: ToastMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      text
    };
    const current = this.messagesSubject.value;
    this.messagesSubject.next([...current, message]);
    setTimeout(() => this.dismiss(message.id), duration);
  }

  dismiss(id: string): void {
    const current = this.messagesSubject.value.filter(message => message.id !== id);
    this.messagesSubject.next(current);
  }
}
