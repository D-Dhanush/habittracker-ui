import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AiMessage {
  id:        string;
  role:      'user' | 'assistant';
  content:   string;
  timestamp: Date;
  actions?:  AiAction[];
  isTyping?: boolean;
}

export interface AiAction {
  type:    'habit_completed' | 'habit_created' | 'habit_updated' | 'habit_deleted' | 'info';
  label:   string;
  payload?: unknown;
}

export interface AiCommandRequest {
  message:         string;
  conversationId?: string;
  context?:        AiContext;
}

export interface AiContext {
  currentPage?: string;
  activeHabitId?: string;
}

export interface AiCommandResponse {
  reply:           string;
  conversationId:  string;
  actions:         AiAction[];
  requiresRefresh: boolean;
  requiresInput:   boolean;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/ai`;

  /** True while the AI is processing a command. */
  readonly processing = signal(false);

  /** Emits whenever a successful action requires the page to refresh its data. */
  readonly refreshNeeded$ = new Subject<void>();

  /** Active conversation ID so multi-turn context is maintained. */
  private conversationId: string | null = null;

  constructor(private http: HttpClient) {}

  sendCommand(message: string, context?: AiContext): Observable<AiCommandResponse> {
    const body: AiCommandRequest = {
      message,
      conversationId: this.conversationId ?? undefined,
      context
    };
    return this.http.post<AiCommandResponse>(`${this.apiUrl}/command`, body);
  }

  setConversationId(id: string): void { this.conversationId = id; }
  clearConversation(): void           { this.conversationId = null; }

  suggestCommands(): string[] {
    return [
      'Completed workout today',
      'Create a habit to meditate every morning',
      'Show my weekly progress',
      'Which habits are pending today?',
      'What\'s my current streak?',
      'How much XP do I have?'
    ];
  }
}
