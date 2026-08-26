import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="help-shell">
      <section class="hero-card">
        <p class="eyebrow">ArcLord guide</p>
        <h2>How to get the most from your journey</h2>
        <p>Use habits, quests, tasks, and themes together to build steady momentum and turn progress into a game-like experience.</p>
      </section>

      <div class="quick-links">
        <a href="#habits">Habits</a>
        <a href="#quests">Quests</a>
        <a href="#tasks">Tasks</a>
        <a href="#themes">Themes</a>
      </div>

      <section id="habits" class="help-section">
        <h3>Habits</h3>
        <p>Create a habit to define your focus, set a streak goal, and choose the rewards you want to earn over time.</p>
        <ul>
          <li>Pick a clear name and a simple frequency.</li>
          <li>Choose a category and icon that make the habit feel personal.</li>
          <li>Use the habit card to watch your progress and streak at a glance.</li>
        </ul>
      </section>

      <section id="quests" class="help-section">
        <h3>Quests</h3>
        <p>Quests group related tasks inside a habit so each objective feels like a meaningful milestone.</p>
        <ul>
          <li>Create a quest for a short-term goal or challenge.</li>
          <li>Give the quest XP so progress feels rewarding.</li>
          <li>Open a quest to manage its checklist and keep momentum flowing.</li>
        </ul>
      </section>

      <section id="tasks" class="help-section">
        <h3>Tasks</h3>
        <p>Tasks are the action items that reward XP when completed.</p>
        <ul>
          <li>Complete tasks to earn XP and track momentum.</li>
          <li>Use the task view to filter by habit, quest, or status.</li>
          <li>Pending and completed tasks stay visible so you can quickly resume.</li>
        </ul>
      </section>

      <section id="themes" class="help-section">
        <h3>Themes</h3>
        <p>Change the app atmosphere from the left sidebar at any time. Each theme keeps the same layout but changes the mood of the experience.</p>
      </section>
    </div>
  `,
  styles: [
    `.help-shell { padding: 24px; display: grid; gap: 1.1rem; max-width: 980px; }`,
    `.hero-card { padding: 1.4rem 1.5rem; border-radius: 24px; background: linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.16), rgba(var(--color-secondary-rgb), 0.08)); border: 1px solid rgba(var(--color-primary-rgb), 0.2); box-shadow: 0 16px 40px rgba(0,0,0,0.18); }`,
    `.hero-card h2 { margin: 0 0 0.4rem; color: var(--color-text-primary); font-size: 1.6rem; }`,
    `.eyebrow { margin: 0 0 0.35rem; text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.72rem; color: var(--color-primary); font-weight: 700; }`,
    `.hero-card p { margin: 0; color: var(--color-text-secondary); line-height: 1.7; }`,
    `.quick-links { display: flex; flex-wrap: wrap; gap: 0.75rem; }`,
    `.quick-links a { color: var(--color-primary); background: rgba(var(--color-primary-rgb), 0.08); padding: 0.8rem 1rem; border-radius: 999px; text-decoration: none; border: 1px solid rgba(var(--color-primary-rgb), 0.16); }`,
    `.help-section { padding: 1.2rem 1.35rem; border-radius: 20px; background: var(--color-bg-card); border: 1px solid rgba(var(--color-primary-rgb), 0.14); box-shadow: inset 0 1px 0 rgba(255,255,255,0.03); }`,
    `.help-section h3 { margin-top: 0; color: var(--color-text-primary); }`,
    `.help-section p, .help-section ul { margin: 0 0 0.85rem; color: var(--color-text-secondary); line-height: 1.7; }`,
    `.help-section ul { padding-left: 1.1rem; }`
  ]
})
export class HelpComponent {}
