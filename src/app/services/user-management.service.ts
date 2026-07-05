import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Mirrors backend's GetAllUsersAsync result row (Auth.USP_GetAllUsersWithRoles
// joined with Roles). RoleId is a Guid end-to-end now — see the RoleId
// int->Guid fix applied across UserDto.cs/UserManagementController.cs/
// UserServiceAccess.cs this same session. If you're applying this before
// that backend fix lands, GetAllUsers()/GetAllRoles() will throw a Dapper
// type-conversion error server-side — apply the backend fix first.
export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string | null;
  pictureUrl: string | null;
  isActive: boolean;
  createdDt: string;
  lastLoginDt: string | null;
  role: string;
  roleId: string; // Guid
  userRoleId: string | null; // Guid
}

export interface AdminRoleOption {
  roleId: string; // Guid
  name: string;
  description: string | null;
}

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/UserManagement`;

  constructor(private http: HttpClient) {}

  getAllUsers(): Observable<AdminUserRow[]> {
    return this.http.get<AdminUserRow[]>(this.apiUrl);
  }

  getAllRoles(): Observable<AdminRoleOption[]> {
    return this.http.get<AdminRoleOption[]>(`${this.apiUrl}/roles`);
  }

  setUserRole(userId: string, roleId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${userId}/role`, { roleId });
  }

  toggleUserActive(userId: string, isActive: boolean): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${userId}/active`, { isActive });
  }
}
