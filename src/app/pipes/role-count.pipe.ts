import { Pipe, PipeTransform } from '@angular/core';
import { AdminUserRow } from '../services/user-management.service';

@Pipe({ name: 'roleCount', standalone: true, pure: false })
export class RoleCountPipe implements PipeTransform {
  transform(users: AdminUserRow[], roleName: string): number {
    return users.filter(u => u.role === roleName).length;
  }
}
