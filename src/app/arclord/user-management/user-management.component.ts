import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../toast.service';
import { AdminUserRow, AdminRoleOption, UserManagementService } from '../../services/user-management.service';
/**
 * Layer 4 — Admin User Management page.
 * Route is guarded server-side ([Authorize(Roles = "Admin")] on
 * UserManagementController) AND client-side (adminGuard on the
 * 'admin/users' route in app.routes.ts) — this component assumes both
 * are already in place and doesn't re-implement access control itself,
 * beyond the same-user self-protection the backend already enforces
 * (disabled here too, so the UI doesn't even offer an action the API
 * would reject).
 */
@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: AdminUserRow[] = [];
  roles: AdminRoleOption[] = [];
  loading = true;
  error = false;

  // Tracks in-flight per-row actions so the row's controls disable
  // individually rather than freezing the whole grid on every action.
  pendingUserIds = new Set<string>();

  constructor(
    private userManagementService: UserManagementService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  get currentUserId(): string | null {
    return this.authService.currentUser()?.userId ?? null;
  }

  isSelf(userId: string): boolean {
    return this.currentUserId === userId;
  }

  isPending(userId: string): boolean {
    return this.pendingUserIds.has(userId);
  }

  loadAll(): void {
    this.loading = true;
    this.error = false;

    this.userManagementService.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.userManagementService.getAllUsers().subscribe({
          next: (users) => {
            this.users = users;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
            this.error = true;
          }
        });
      },
      error: () => {
        this.loading = false;
        this.error = true;
      }
    });
  }

  onRoleChange(user: AdminUserRow, newRoleId: string): void {
    if (this.isSelf(user.id)) {
      this.toast.show('You cannot change your own role.', 'warning');
      return;
    }

    const previousRoleId = user.roleId;
    const newRole = this.roles.find(r => r.roleId === newRoleId);

    this.pendingUserIds.add(user.id);
    this.userManagementService.setUserRole(user.id, newRoleId).subscribe({
      next: () => {
        this.pendingUserIds.delete(user.id);
        user.roleId = newRoleId;
        if (newRole) user.role = newRole.name;
        this.toast.show(`${user.displayName || user.email}'s role updated to ${newRole?.name ?? 'new role'}.`, 'success');
      },
      error: (err) => {
        this.pendingUserIds.delete(user.id);
        user.roleId = previousRoleId; // revert the select if the API rejected it
        this.toast.show(err?.error?.message || 'Could not update role.', 'failure');
      }
    });
  }

  onToggleActive(user: AdminUserRow): void {
    if (this.isSelf(user.id)) {
      this.toast.show('You cannot disable your own account.', 'warning');
      return;
    }

    const nextActive = !user.isActive;
    this.pendingUserIds.add(user.id);

    this.userManagementService.toggleUserActive(user.id, nextActive).subscribe({
      next: () => {
        this.pendingUserIds.delete(user.id);
        user.isActive = nextActive;
        this.toast.show(nextActive ? 'User activated.' : 'User deactivated.', 'success');
      },
      error: (err) => {
        this.pendingUserIds.delete(user.id);
        this.toast.show(err?.error?.message || 'Could not update user status.', 'failure');
      }
    });
  }
}
