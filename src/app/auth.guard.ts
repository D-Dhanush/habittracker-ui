import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './services/auth.service';

// Guard: user must be logged in
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

// Guard: user must have Admin, Super Admin, or Platform Owner role
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/login']); return false; }
  const role = auth.currentUser()?.role ?? '';
  const adminRoles = ['Admin', 'Super Admin', 'Platform Owner'];
  if (adminRoles.includes(role)) return true;
  router.navigate(['/unauthorized']);
  return false;
};
