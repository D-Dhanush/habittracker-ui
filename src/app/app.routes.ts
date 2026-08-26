import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { DashboardComponent } from './arclord/dashboard/dashboard.component';
import { HabitCollectionComponent } from './habit/habit-collection/habit-collection.component';
import { HabitComponent } from './habit/habit.component';
import { HabitDetailComponent } from './habit/habit-detail/habit-detail.component';
import { QuestDetailComponent } from './arclord/quest-detail/quest-detail.component';
import { QuestFormComponent } from './quest/questform/quest-form.component';
import { CalendarComponent } from './arclord/components/calendar/calendar.component';
import { TaskManagementComponent } from './task-management/task-management.component';
import { HelpComponent } from './pages/help.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { UserManagementComponent } from './arclord/user-management/user-management.component';
import { ProgressComponent } from './pages/progress/progress.component';
import { ProfileComponent } from './pages/profile/profile.component';

export const routes: Routes = [
  // Public
  { path: 'login',        component: LoginComponent },
  { path: 'unauthorized', component: UnauthorizedComponent },

  // Protected — all require login
  { path: '',              component: DashboardComponent,       canActivate: [authGuard] },
  { path: 'habits',        component: HabitCollectionComponent, canActivate: [authGuard] },
  { path: 'add-habit',     component: HabitComponent,           canActivate: [authGuard] },
  { path: 'habit/:id',     component: HabitDetailComponent,     canActivate: [authGuard] },
  { path: 'habit/:id/edit',component: HabitComponent,           canActivate: [authGuard] },
  { path: 'habit/:habitId/quest/new',            component: QuestFormComponent,    canActivate: [authGuard] },
  { path: 'habit/:habitId/quest/:questId',       component: QuestDetailComponent,  canActivate: [authGuard] },
  { path: 'tasks',         component: TaskManagementComponent,  canActivate: [authGuard] },
  { path: 'calendar',      component: CalendarComponent,        canActivate: [authGuard] },
  { path: 'progress',      component: ProgressComponent,        canActivate: [authGuard] },
  { path: 'profile',       component: ProfileComponent,         canActivate: [authGuard] },
  { path: 'help',          component: HelpComponent,            canActivate: [authGuard] },

  // Subscription / Premium — lazy-loaded so the checkout/payment code
  // (and the gateway SDK loads it triggers) never ships in the main
  // bundle for users who never open these pages.
  { path: 'subscription/plans',
    loadComponent: () => import('./pages/subsciption/plans/plans.component').then(m => m.PlansComponent),
    canActivate: [authGuard] },
  { path: 'subscription/checkout',
    loadComponent: () => import('./pages/subsciption/checkout/checkout.component').then(m => m.CheckoutComponent),
    canActivate: [authGuard] },
  { path: 'subscription/status',
    loadComponent: () => import('./pages/subsciption/status/status.component').then(m => m.SubscriptionStatusComponent),
    canActivate: [authGuard] },

  // Admin-only — require Admin/Super Admin/Platform Owner role
  { path: 'settings',     component: SettingsComponent,         canActivate: [authGuard] },   // role-filtering inside component
  { path: 'admin/users',  component: UserManagementComponent,   canActivate: [adminGuard] },

  // Catch-all
  { path: '**', redirectTo: 'unauthorized', pathMatch: 'full' }
];