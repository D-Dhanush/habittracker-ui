import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../toast.service';
import {
  UserManagementService,
  AdminUserRow,
  AdminRoleOption
} from '../../services/user-management.service';
import { RoleCountPipe } from '../../pipes/role-count.pipe';
import { ThemeService, ThemeId, THEME_OPTIONS } from '../../services/theme.service';

// ─── Role helpers ─────────────────────────────────────────────────────────────
// These match exactly what the DB has (Admin, Player, Reader) plus future roles
const OWNER_ROLES  = ['Platform Owner', 'Super Admin'];
const ADMIN_ROLES  = [...OWNER_ROLES, 'Admin'];
const MENTOR_ROLES = [...ADMIN_ROLES, 'Moderator', 'Coach', 'Mentor'];

type SettingsPanel =
  | 'overview'
  | 'users'
  | 'roles'
  | 'permissions'
  | 'analytics'
  | 'security'
  | 'profile'
  | 'account'
  | 'theme';

// ─── Permission catalogue (static, display only) ──────────────────────────────
const PERMISSION_GROUPS = [
  { group: 'Habit',         perms: ['Create', 'Update', 'Delete', 'View'] },
  { group: 'Quest',         perms: ['Create', 'Update', 'Delete', 'View'] },
  { group: 'Task',          perms: ['Create', 'Update', 'Delete', 'View'] },
  { group: 'Analytics',     perms: ['View'] },
  { group: 'Users',         perms: ['Manage'] },
  { group: 'Subscriptions', perms: ['Manage'] },
  { group: 'AI',            perms: ['Use', 'Manage'] },
  { group: 'System',        perms: ['Settings'] },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  'Platform Owner': ['Habit.Create','Habit.Update','Habit.Delete','Habit.View',
    'Quest.Create','Quest.Update','Quest.Delete','Quest.View',
    'Task.Create','Task.Update','Task.Delete','Task.View',
    'Analytics.View','Users.Manage','Subscriptions.Manage','AI.Use','AI.Manage','System.Settings'],
  'Super Admin': ['Habit.Create','Habit.Update','Habit.Delete','Habit.View',
    'Quest.Create','Quest.Update','Quest.Delete','Quest.View',
    'Task.Create','Task.Update','Task.Delete','Task.View',
    'Analytics.View','Users.Manage','Subscriptions.Manage','AI.Use','AI.Manage','System.Settings'],
  'Admin': ['Habit.Create','Habit.Update','Habit.Delete','Habit.View',
    'Quest.Create','Quest.Update','Quest.Delete','Quest.View',
    'Task.Create','Task.Update','Task.Delete','Task.View',
    'Analytics.View','Users.Manage','AI.Use'],
  'Moderator': ['Habit.View','Quest.View','Task.View','Analytics.View'],
  'Coach':     ['Habit.View','Habit.Create','Quest.View','Quest.Create','Task.View','Task.Create','Analytics.View'],
  'Mentor':    ['Habit.View','Quest.View','Task.View'],
  'Player':    ['Habit.Create','Habit.Update','Habit.Delete','Habit.View',
    'Quest.Create','Quest.Update','Quest.Delete','Quest.View',
    'Task.Create','Task.Update','Task.Delete','Task.View'],
  'Reader':    ['Habit.View','Quest.View','Task.View'],
};

export interface ConfirmDialogState {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  onConfirm: () => void;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, RoleCountPipe],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  // ── Auth state ─────────────────────────────────────────────────────────────
  readonly role = computed(() => this.auth.currentUser()?.role ?? 'Player');
  readonly user = computed(() => this.auth.currentUser());

  readonly isOwner   = computed(() => OWNER_ROLES.includes(this.role()));
  readonly isAdmin   = computed(() => ADMIN_ROLES.includes(this.role()));
  readonly isMentor  = computed(() => MENTOR_ROLES.includes(this.role()));
  readonly isPlayer  = computed(() => !this.isMentor());

  // ── Active panel ───────────────────────────────────────────────────────────
  activePanel = signal<SettingsPanel>('overview');

  // ── Theme state ───────────────────────────────────────────────────────────
  readonly themeOptions = THEME_OPTIONS;
  readonly activeTheme = computed(() => this.themeSvc.activeTheme());

  // ── User Management state ─────────────────────────────────────────────────
  users:   AdminUserRow[]    = [];
  roles:   AdminRoleOption[] = [];
  loading  = false;
  error    = false;
  pendingIds = new Set<string>();

  // Filters
  searchQuery  = '';
  filterRole   = '';
  filterStatus = '';
  sortField: keyof AdminUserRow = 'displayName';
  sortAsc  = true;
  page     = 1;
  pageSize = 10;

  // ── Confirmation dialog ───────────────────────────────────────────────────
  confirm: ConfirmDialogState = {
    visible: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    danger: false,
    onConfirm: () => {}
  };

  // ── Expanded row (view details) ────────────────────────────────────────────
  expandedUserId: string | null = null;

  // ── Permissions panel ──────────────────────────────────────────────────────
  readonly permGroups = PERMISSION_GROUPS;
  selectedPermRole = 'Admin';
  readonly permRoleOptions = Object.keys(ROLE_PERMISSIONS);

  // ── Role hierarchy (display) ───────────────────────────────────────────────
  readonly roleHierarchy = [
    { name: 'Platform Owner', color: '#ff6b35', perms: 'Absolute platform control' },
    { name: 'Super Admin',    color: '#ff6b6b', perms: 'Full system access' },
    { name: 'Admin',          color: '#d4af37', perms: 'User & content management' },
    { name: 'Moderator',      color: '#c9a8f0', perms: 'Community moderation' },
    { name: 'Coach',          color: '#4dd9ff', perms: 'Challenge assignment & coaching' },
    { name: 'Mentor',         color: '#78dc96', perms: 'Assigned learner guidance' },
    { name: 'Player',         color: '#4dc882', perms: 'Habits, quests, tasks, XP' },
    { name: 'Reader',         color: '#6a9bbf', perms: 'Read-only visitor' },
  ];

  // ── Analytics cards ────────────────────────────────────────────────────────
  analyticsCards = [
    { label: 'Total Users',    value: 0, icon: 'group',               color: '#4dd9ff' },
    { label: 'Active Users',   value: 0, icon: 'person_check',        color: '#78dc96' },
    { label: 'Inactive Users', value: 0, icon: 'person_off',          color: '#ff6b6b' },
    { label: 'Admins',         value: 0, icon: 'admin_panel_settings', color: '#d4af37' },
    { label: 'Players',        value: 0, icon: 'sports_esports',       color: '#c9a8f0' },
    { label: 'New (30d)',       value: 0, icon: 'new_releases',        color: '#ff9800' },
  ];

  constructor(
    private auth: AuthService,
    private toast: ToastService,
    private umSvc: UserManagementService,
    private route: ActivatedRoute,
    private themeSvc: ThemeService
  ) {}

  ngOnInit(): void {
    if (this.isAdmin()) this.loadUsers();
  }

  // ── Panel navigation ───────────────────────────────────────────────────────
  setPanel(p: SettingsPanel): void { this.activePanel.set(p); }

  setTheme(theme: ThemeId): void {
    this.themeSvc.setTheme(theme);
  }

  // ── User loading ───────────────────────────────────────────────────────────
  loadUsers(): void {
    this.loading = true; this.error = false;
    this.umSvc.getAllRoles().subscribe({
      next: roles => {
        this.roles = roles;
        this.umSvc.getAllUsers().subscribe({
          next: users => {
            this.users = users;
            this.loading = false;
            this.buildAnalytics();
          },
          error: () => { this.loading = false; this.error = true; }
        });
      },
      error: () => { this.loading = false; this.error = true; }
    });
  }

  private buildAnalytics(): void {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    this.analyticsCards[0].value = this.users.length;
    this.analyticsCards[1].value = this.users.filter(u => u.isActive).length;
    this.analyticsCards[2].value = this.users.filter(u => !u.isActive).length;
    this.analyticsCards[3].value = this.users.filter(u => ADMIN_ROLES.includes(u.role)).length;
    this.analyticsCards[4].value = this.users.filter(u => u.role === 'Player').length;
    this.analyticsCards[5].value = this.users.filter(u =>
      u.createdDt && (now - new Date(u.createdDt).getTime()) < thirtyDays
    ).length;
  }

  // ── Filtered / sorted / paged user list ───────────────────────────────────
  get filteredUsers(): AdminUserRow[] {
    const q = this.searchQuery.trim().toLowerCase();
    let list = this.users.filter(u => {
      if (q && !u.email.toLowerCase().includes(q) &&
          !(u.displayName ?? '').toLowerCase().includes(q)) return false;
      if (this.filterRole && u.role !== this.filterRole) return false;
      if (this.filterStatus === 'active'   && !u.isActive) return false;
      if (this.filterStatus === 'inactive' &&  u.isActive) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const av = (a[this.sortField] ?? '') as string;
      const bv = (b[this.sortField] ?? '') as string;
      return this.sortAsc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return list;
  }

  get pagedUsers(): AdminUserRow[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  setSort(field: keyof AdminUserRow): void {
    if (this.sortField === field) this.sortAsc = !this.sortAsc;
    else { this.sortField = field; this.sortAsc = true; }
    this.page = 1;
  }

  sortIcon(f: keyof AdminUserRow): string {
    if (this.sortField !== f) return 'unfold_more';
    return this.sortAsc ? 'arrow_upward' : 'arrow_downward';
  }

  onFilterChange(): void { this.page = 1; }

  // ── Role-based action permissions ─────────────────────────────────────────
  get currentUserId(): string { return this.auth.currentUser()?.userId ?? ''; }
  isSelf(id: string): boolean { return this.currentUserId === id; }
  isPending(id: string): boolean { return this.pendingIds.has(id); }

  /**
   * Can the current user act on this target user?
   * Owner can act on anyone (except self).
   * Admin can act on non-admin users only.
   */
  canActOn(target: AdminUserRow): boolean {
    if (this.isSelf(target.id)) return false;
    if (this.isOwner()) return true; // owner can act on anyone
    if (this.isAdmin()) {
      // Admin cannot modify other Admins, Super Admins, or Platform Owners
      return !ADMIN_ROLES.includes(target.role);
    }
    return false;
  }

  /**
   * Can the current user change the role of this target?
   * Returns which roles are assignable by the current user.
   */
  assignableRoles(target: AdminUserRow): AdminRoleOption[] {
    if (!this.canActOn(target)) return [];
    if (this.isOwner()) return this.roles; // owner can assign any role
    // Admin can only assign non-admin roles
    return this.roles.filter(r => !ADMIN_ROLES.includes(r.name));
  }

  canChangeRole(target: AdminUserRow): boolean {
    return this.canActOn(target) && this.assignableRoles(target).length > 0;
  }

  toggleExpandUser(id: string): void {
    this.expandedUserId = this.expandedUserId === id ? null : id;
  }

  // ── User actions (with confirm dialogs where needed) ──────────────────────
  onRoleChange(user: AdminUserRow, newRoleId: string): void {
    if (!this.canActOn(user)) {
      this.toast.show('You do not have permission to change this user\'s role.', 'warning');
      return;
    }
    const newRole = this.roles.find(r => r.roleId === newRoleId);
    const prev = user.roleId;

    this.showConfirm({
      title: 'Change Role',
      message: `Change <strong>${user.displayName || user.email}</strong>'s role to <strong>${newRole?.name ?? 'new role'}</strong>?`,
      confirmLabel: 'Change Role',
      danger: false,
      onConfirm: () => {
        this.pendingIds.add(user.id);
        this.umSvc.setUserRole(user.id, newRoleId).subscribe({
          next: () => {
            this.pendingIds.delete(user.id);
            user.roleId = newRoleId;
            if (newRole) user.role = newRole.name;
            this.buildAnalytics();
            this.toast.show(`Role updated to ${newRole?.name ?? 'new role'}.`, 'success');
          },
          error: err => {
            this.pendingIds.delete(user.id);
            user.roleId = prev;
            this.toast.show(err?.error?.message || 'Could not update role.', 'failure');
          }
        });
      }
    });

    // Revert the select visually until confirmed
    setTimeout(() => { user.roleId = prev; }, 0);
  }

  onActivate(user: AdminUserRow): void {
    if (!this.canActOn(user)) { this.toast.show('Permission denied.', 'warning'); return; }
    this.showConfirm({
      title: 'Activate User',
      message: `Activate account for <strong>${user.displayName || user.email}</strong>? They will be able to log in again.`,
      confirmLabel: 'Activate',
      danger: false,
      onConfirm: () => this.doToggleActive(user, true)
    });
  }

  onDeactivate(user: AdminUserRow): void {
    if (!this.canActOn(user)) { this.toast.show('Permission denied.', 'warning'); return; }
    this.showConfirm({
      title: 'Deactivate User',
      message: `Deactivate account for <strong>${user.displayName || user.email}</strong>? They will be locked out immediately.`,
      confirmLabel: 'Deactivate',
      danger: true,
      onConfirm: () => this.doToggleActive(user, false)
    });
  }

  private doToggleActive(user: AdminUserRow, next: boolean): void {
    this.pendingIds.add(user.id);
    this.umSvc.toggleUserActive(user.id, next).subscribe({
      next: () => {
        this.pendingIds.delete(user.id);
        user.isActive = next;
        this.buildAnalytics();
        this.toast.show(next ? 'User activated.' : 'User deactivated.', 'success');
      },
      error: err => {
        this.pendingIds.delete(user.id);
        this.toast.show(err?.error?.message || 'Could not update status.', 'failure');
      }
    });
  }

  // Keep legacy toggle for inline icon button
  onToggleActive(user: AdminUserRow): void {
    if (user.isActive) this.onDeactivate(user);
    else this.onActivate(user);
  }

  // ── Confirm dialog helpers ─────────────────────────────────────────────────
  private showConfirm(opts: Omit<ConfirmDialogState, 'visible'>): void {
    this.confirm = { visible: true, ...opts };
  }

  dismissConfirm(): void { this.confirm.visible = false; }

  runConfirm(): void {
    this.confirm.onConfirm();
    this.confirm.visible = false;
  }

  // ── Permissions helpers ────────────────────────────────────────────────────
  hasPermission(group: string, perm: string): boolean {
    const key = `${group}.${perm}`;
    return (ROLE_PERMISSIONS[this.selectedPermRole] ?? []).includes(key);
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  logout(): void { this.auth.logout(); }
}