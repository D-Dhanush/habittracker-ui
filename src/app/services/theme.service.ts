import { Injectable, signal } from '@angular/core';

export type ThemeId =
  | 'theme-blue-black'
  | 'theme-white-blue'
  | 'theme-gold-black'
  | 'theme-red-black'
  | 'theme-purple-black';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
}

const THEME_KEY = 'arclord_theme';
const DEFAULT_THEME: ThemeId = 'theme-white-blue';

// Order here is the order shown in the theme picker UI.
export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'theme-white-blue', label: 'Navy Blue', description: 'Deep navy base with bright blue accents.' },
  { id: 'theme-blue-black', label: 'Igris (Blue-Black-Gold)', description: 'The classic ARCLORD cyan-and-gold theme.' },
  { id: 'theme-gold-black', label: 'Gold-Black', description: 'Pure gold armor glow on black.' },
  { id: 'theme-red-black', label: 'Red-Black', description: 'Crimson armor glow on black.' },
  { id: 'theme-purple-black', label: 'Shadow Monarch (Purple-Black)', description: 'Violet flame on near-black.' }
];

/**
 * Toggles a body.theme-* class to switch the active CSS-custom-property
 * palette (see styles/theme-palettes.scss). Persists the choice to
 * localStorage and restores it on app init — call restoreTheme() once
 * from app.component.ts ngOnInit, alongside AuthService.tryAutoLogin().
 *
 * SCOPE NOTE: only components that reference var(--color-primary) etc.
 * will visually reskin when the theme changes. Components still using
 * hardcoded hex colors or the old theme.scss $color-* SCSS variables
 * will not change appearance — that migration is separate, follow-up work.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly activeTheme = signal<ThemeId>(this.loadTheme());

  /** Call once on app init to apply the persisted (or default) theme to <body>. */
  restoreTheme(): void {
    this.applyThemeClass(this.activeTheme());
  }

  setTheme(theme: ThemeId): void {
    this.activeTheme.set(theme);
    localStorage.setItem(THEME_KEY, theme);
    this.applyThemeClass(theme);
  }

  private applyThemeClass(theme: ThemeId): void {
    THEME_OPTIONS.forEach(option => document.body.classList.remove(option.id));
    document.body.classList.add(theme);
  }

  private loadTheme(): ThemeId {
    try {
      const stored = localStorage.getItem(THEME_KEY) as ThemeId | null;
      const isValid = stored !== null && THEME_OPTIONS.some(option => option.id === stored);
      return isValid ? (stored as ThemeId) : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  }
}
