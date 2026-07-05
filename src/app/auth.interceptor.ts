import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';

// Endpoints that are fully public — no token needed
const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/forgot-password',
  '/api/auth/refresh',
];

// Endpoints where a 401 means wrong credentials / bad refresh token, NOT an
// expired session — never trigger the refresh-or-logout flow for these.
const NO_LOGOUT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/forgot-password',
  '/api/auth/change-password',
  '/api/auth/refresh',
];

const matches = (url: string, paths: string[]) =>
  paths.some(p => url.toLowerCase().includes(p));

// Module-level state shared by every request passing through this interceptor,
// so concurrent 401s only trigger a single refresh call and everyone else waits.
let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const isPublic   = matches(req.url, PUBLIC_PATHS);
  const skipLogout = matches(req.url, NO_LOGOUT_PATHS);

  const attach = (request: HttpRequest<unknown>) => {
    const token = auth.getToken();
    return token && !isPublic
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;
  };

  const forceLogout = () => {
    auth.logout();
    router.navigate(['/login'], { queryParams: { reason: 'session_expired' } });
  };

  return next(attach(req)).pipe(
    catchError((err: HttpErrorResponse) => {
      // Only a real 401 on a protected endpoint, with a refresh token on hand,
      // is worth trying to silently recover from.
      if (err.status === 401 && !skipLogout && auth.getRefreshToken()) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshedToken$.next(null);

          return auth.refreshToken().pipe(
            switchMap(res => {
              isRefreshing = false;
              refreshedToken$.next(res.token);
              return next(attach(req));
            }),
            catchError(refreshErr => {
              isRefreshing = false;
              forceLogout();
              return throwError(() => refreshErr);
            })
          );
        }

        // A refresh is already in flight for another request — wait for it,
        // then retry this one with the freshly issued token.
        return refreshedToken$.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(() => next(attach(req)))
        );
      }

      if (err.status === 401 && !skipLogout) {
        forceLogout();
      }

      // For auth endpoints (wrong password etc) let the error bubble to the component
      return throwError(() => err);
    })
  );
};
