import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'failure' | 'info';

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
