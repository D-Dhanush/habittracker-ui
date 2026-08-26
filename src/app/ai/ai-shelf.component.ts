import {
  Component, OnInit, OnDestroy, ElementRef, ViewChild,
  HostListener, signal, NgZone, ChangeDetectionStrategy,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService, AiMessage, AiAction } from './ai.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../toast.service';

// ── Constants ──────────────────────────────────────────────────────────────────
const STORAGE_KEY    = 'arclord_arc_pos';
const FAB_SIZE       = 72;
const EDGE_MARGIN    = 10;
const SNAP_THRESHOLD = 60; // px from edge to trigger snapping
const MIN_DRAG_PX    = 5;  // below this movement = click, not drag

interface SavedPos { edge: 'left' | 'right'; yPct: number; }

@Component({
  selector: 'app-ai-shelf',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-shelf.component.html',
  styleUrls: ['./ai-shelf.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiShelfComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('inputEl')           inputEl!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fabRef')            fabRef!: ElementRef<HTMLButtonElement>;

  // ── Reactive state ────────────────────────────────────────────────────────
  isOpen     = signal(false);
  arcState   = signal<'idle' | 'bounce' | 'thinking' | 'success'>('idle');
  messages   = signal<AiMessage[]>([]);

  inputText       = '';
  suggestions:    string[] = [];
  showSuggestions = true;
  readonly embers = Array.from({ length: 6 });

  // ── Position state (NOT signals — set directly on DOM for perf) ───────────
  /** Current FAB position in px from top-left of viewport. */
  private pos = { x: 0, y: 0 };
  /** Which edge Arc is snapped to. */
  private snappedEdge: 'left' | 'right' = 'right';

  // ── Drag state ────────────────────────────────────────────────────────────
  protected isDragging   = false;
  protected didDrag      = false;   // true if pointer moved > MIN_DRAG_PX
  private dragStart    = { x: 0, y: 0 };       // pointer start
  private fabStartPos  = { x: 0, y: 0 };       // FAB position at drag start
  private activePointerId: number | null = null;

  // ── Shelf panel position (recalculated when pos changes) ─────────────────
  shelfLeft     = 0;
  shelfRight    = 0;
  shelfBottom   = 0;
  shelfTop: number | null = null;
  shelfOpenAbove = true; // whether the shelf opens above or below the FAB

  // ── Misc ──────────────────────────────────────────────────────────────────
  private bounceInterval: ReturnType<typeof setInterval> | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    readonly ai:   AiService,
    readonly auth: AuthService,
    private toast: ToastService,
    private zone:  NgZone,
    private cdr:   ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.suggestions = this.ai.suggestCommands();

    // Restore or set default position
    this.restorePosition();

    // Idle bounce every 8 s
    this.bounceInterval = setInterval(() => {
      if (this.arcState() === 'idle') {
        this.arcState.set('bounce');
        setTimeout(() => this.arcState.set('idle'), 800);
        this.cdr.markForCheck();
      }
    }, 8000);

    // Reposition on resize / orientation change
    this.resizeObserver = new ResizeObserver(() => {
      this.zone.run(() => this.clampAndSnap(false));
    });
    this.resizeObserver.observe(document.documentElement);
  }

  ngOnDestroy(): void {
    if (this.bounceInterval) clearInterval(this.bounceInterval);
    this.resizeObserver?.disconnect();
    this.removeGlobalListeners();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  POSITION — restore, save, apply
  // ═══════════════════════════════════════════════════════════════════════════

  private restorePosition(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved: SavedPos = JSON.parse(raw);
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const y  = Math.round(saved.yPct * vh);

        // Preserve the last saved position as-is when it exists, but keep it
        // inside the viewport with a small edge gap.
        const x = this.clampX(saved.edge === 'right' ? vw - FAB_SIZE - EDGE_MARGIN : EDGE_MARGIN, vw);
        this.pos         = { x, y: this.clampY(y, vh) };
        this.snappedEdge = saved.edge;
        this.applyPos(false);
        return;
      }
    } catch { /* ignore corrupt storage */ }

    // Default: bottom-right
    this.pos = {
      x: window.innerWidth  - FAB_SIZE - EDGE_MARGIN,
      y: window.innerHeight - FAB_SIZE - EDGE_MARGIN
    };
    this.snappedEdge = 'right';
    this.applyPos(false);
  }

  private savePosition(): void {
    try {
      const saved: SavedPos = {
        edge: this.snappedEdge,
        yPct: this.pos.y / window.innerHeight
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch { /* ignore */ }
  }

  /** Write pos to the FAB DOM element directly — skips Angular CD. */
  private applyPos(animate = true): void {
    const el = this.fabRef?.nativeElement?.parentElement as HTMLElement | null;
    if (!el) return;
    el.style.transition = animate
      ? 'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      : 'none';
    el.style.transform  = `translate(${this.pos.x}px, ${this.pos.y}px)`;
    this.updateShelfPosition();
  }

  /** Clamp pos inside viewport without moving it to a fixed edge. */
  private clampAndSnap(snap: boolean, animate = true): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    this.pos.x = this.clampX(this.pos.x, vw);
    this.pos.y = this.clampY(this.pos.y, vh);

    if (snap) {
      const midX = vw / 2;
      this.snappedEdge = this.pos.x + FAB_SIZE / 2 < midX ? 'left' : 'right';
      this.pos.x = this.snappedEdge === 'right'
        ? vw - FAB_SIZE - EDGE_MARGIN
        : EDGE_MARGIN;
    }

    this.applyPos(animate);
    this.savePosition();
  }

  private clampX(x: number, vw: number): number {
    return Math.max(EDGE_MARGIN, Math.min(vw - FAB_SIZE - EDGE_MARGIN, x));
  }

  private clampY(y: number, vh: number): number {
    return Math.max(EDGE_MARGIN, Math.min(vh - FAB_SIZE - EDGE_MARGIN, y));
  }

  /** Calculate where the shelf panel should appear relative to the FAB. */
  private updateShelfPosition(): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const SHELF_H = 620; // approximate max shelf height
    const SHELF_W = 380;
    const gap = 10;

    // Open above or below?
    const spaceAbove = this.pos.y;
    const spaceBelow = vh - this.pos.y - FAB_SIZE;
    this.shelfOpenAbove = spaceAbove > spaceBelow || spaceAbove > SHELF_H * 0.5;

    if (this.shelfOpenAbove) {
      this.shelfBottom = Math.max(12, vh - this.pos.y + gap);
      this.shelfTop = null;
    } else {
      this.shelfTop    = Math.max(12, this.pos.y + FAB_SIZE + gap);
      this.shelfBottom = 0;
    }

    const preferredLeft = this.pos.x + FAB_SIZE + gap;
    const preferredRight = this.pos.x - SHELF_W - gap;

    // Keep the shelf beside the button with a fixed 10px gap.
    // If there is not enough room on the right, place it to the left.
    if (preferredLeft + SHELF_W <= vw - EDGE_MARGIN) {
      this.shelfLeft = preferredLeft;
      this.shelfRight = 0;
    } else {
      this.shelfLeft = Math.max(EDGE_MARGIN, preferredRight);
      this.shelfRight = 0;
    }

    this.cdr.markForCheck();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  DRAG — pointer events on the root wrapper div
  // ═══════════════════════════════════════════════════════════════════════════

  onPointerDown(e: PointerEvent): void {
    // Only primary button / single touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (this.activePointerId !== null) return;

    this.activePointerId = e.pointerId;
    this.isDragging      = true;
    this.didDrag         = false;

    this.dragStart   = { x: e.clientX, y: e.clientY };
    this.fabStartPos = { ...this.pos };

    // Capture pointer so moves outside window still fire
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    // Remove transition during drag
    const el = this.fabRef?.nativeElement?.parentElement as HTMLElement | null;
    if (el) el.style.transition = 'none';

    e.preventDefault(); // prevent text selection / scroll-start
  }

  onPointerMove(e: PointerEvent): void {
    if (!this.isDragging || e.pointerId !== this.activePointerId) return;

    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;

    if (!this.didDrag && Math.hypot(dx, dy) < MIN_DRAG_PX) return;
    this.didDrag = true;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    this.pos.x = Math.max(EDGE_MARGIN, Math.min(vw - FAB_SIZE - EDGE_MARGIN, this.fabStartPos.x + dx));
    this.pos.y = Math.max(EDGE_MARGIN, Math.min(vh - FAB_SIZE - EDGE_MARGIN, this.fabStartPos.y + dy));

    // Apply directly to DOM — no Angular CD
    const el = this.fabRef?.nativeElement?.parentElement as HTMLElement | null;
    if (el) el.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px)`;

    e.preventDefault();
  }

  onPointerUp(e: PointerEvent): void {
    if (!this.isDragging || e.pointerId !== this.activePointerId) return;

    this.isDragging      = false;
    this.activePointerId = null;

    if (this.didDrag) {
      this.finalizeDrag(true);
      // Play landing bounce
      this.arcState.set('bounce');
      setTimeout(() => { this.arcState.set('idle'); this.cdr.markForCheck(); }, 800);
      this.cdr.markForCheck();
      // Reset didDrag after a tick — the (click) event fires after pointerup,
      // so we clear the flag in a microtask so toggle() can read it first,
      // then it's clean for the next interaction.
      Promise.resolve().then(() => { this.didDrag = false; });
    }
    // If didDrag is false → (click) on the FAB fires normally → toggle()
  }

  onPointerCancel(e: PointerEvent): void {
    if (e.pointerId !== this.activePointerId) return;
    this.isDragging      = false;
    this.activePointerId = null;
    this.finalizeDrag(true);
  }

  private finalizeDrag(animate = true): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    this.pos.x = Math.max(EDGE_MARGIN, Math.min(vw - FAB_SIZE - EDGE_MARGIN, this.pos.x));
    this.pos.y = Math.max(EDGE_MARGIN, Math.min(vh - FAB_SIZE - EDGE_MARGIN, this.pos.y));

    // Keep the icon where it was dropped, while still enforcing a small gap
    // from the viewport edge. Avoid snapping it to a side edge automatically.
    this.applyPos(animate);
    this.savePosition();
  }

  private removeGlobalListeners(): void { /* pointer capture handles cleanup */ }

  // ═══════════════════════════════════════════════════════════════════════════
  //  PANEL OPEN / CLOSE
  // ═══════════════════════════════════════════════════════════════════════════

  toggle(): void {
    const opening = !this.isOpen();
    this.isOpen.set(opening);

    if (opening) {
      this.arcState.set('bounce');
      this.updateShelfPosition();
      setTimeout(() => {
        this.arcState.set('idle');
        this.inputEl?.nativeElement?.focus();
        this.cdr.markForCheck();
      }, 500);

      if (this.messages().length === 0) {
        const name = this.auth.currentUser()?.name?.split(' ')[0] ?? 'my Lord';
        this.pushAssistant(
          `Greetings, ${name}! 👋\nI'm Arc, your ArcLord AI companion.\n\n` +
          `Tell me what you'd like to do — complete a habit, create a new one, check your XP, or anything else.`
        );
      }
    }
    this.cdr.markForCheck();
  }

  close(): void {
    this.isOpen.set(false);
    this.cdr.markForCheck();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if (this.isOpen()) this.close(); }

  // ═══════════════════════════════════════════════════════════════════════════
  //  SEND / RECEIVE
  // ═══════════════════════════════════════════════════════════════════════════

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.ai.processing()) return;

    this.showSuggestions = false;
    this.inputText = '';

    this.pushUser(text);
    const typingId = this.pushTyping();

    this.ai.processing.set(true);
    this.arcState.set('thinking');
    this.cdr.markForCheck();

    this.ai.sendCommand(text).subscribe({
      next: res => {
        this.ai.processing.set(false);
        this.removeTyping(typingId);
        this.ai.setConversationId(res.conversationId);
        this.pushAssistant(res.reply, res.actions);

        if (res.requiresRefresh) {
          this.ai.refreshNeeded$.next();
          this.arcState.set('success');
          setTimeout(() => { this.arcState.set('idle'); this.cdr.markForCheck(); }, 2000);
        } else {
          this.arcState.set('idle');
        }
        this.cdr.markForCheck();
      },
      error: err => {
        this.ai.processing.set(false);
        this.removeTyping(typingId);
        this.arcState.set('idle');
        const msg = err?.error?.message ?? 'Something went wrong. Please try again.';
        this.pushAssistant('Sorry, I hit a snag: ' + msg);
        this.toast.show('AI command failed.', 'failure');
        this.cdr.markForCheck();
      }
    });
  }

  useSuggestion(s: string): void { this.inputText = s; this.send(); }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  clearChat(): void {
    this.messages.set([]);
    this.ai.clearConversation();
    this.showSuggestions = true;
    this.pushAssistant('Chat cleared! What would you like to do, my Lord?');
    this.cdr.markForCheck();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  paragraphs(content: string): string[] { return content.split('\n\n').filter(p => p.trim()); }

  actionIcon(type: AiAction['type']): string {
    const map: Record<string, string> = {
      habit_completed: 'check_circle', habit_created: 'add_circle',
      habit_updated: 'edit', habit_deleted: 'delete', info: 'info'
    };
    return map[type] ?? 'info';
  }

  private pushUser(content: string): void {
    this.messages.update(m => [...m, { id: crypto.randomUUID(), role: 'user', content, timestamp: new Date() }]);
    this.scrollToBottom();
  }

  private pushAssistant(content: string, actions: AiAction[] = []): void {
    this.messages.update(m => [...m, { id: crypto.randomUUID(), role: 'assistant', content, timestamp: new Date(), actions }]);
    this.scrollToBottom();
  }

  private pushTyping(): string {
    const id = crypto.randomUUID();
    this.messages.update(m => [...m, { id, role: 'assistant', content: '', timestamp: new Date(), isTyping: true }]);
    this.scrollToBottom();
    return id;
  }

  private removeTyping(id: string): void {
    this.messages.update(m => m.filter(x => x.id !== id));
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
