import { Role } from '../types';

export type PermissionAction =
  | 'project:create'
  | 'project:edit'
  | 'project:delete'
  | 'project:view'
  | 'task:create'
  | 'task:update'
  | 'task:delete'
  | 'user:manage'
  | 'reports:view'
  | 'financials:view'
  | 'board:view'
  | 'timeline:view'
  | 'cockpit:view'
  | 'client:create'
  | 'revision:request'
  | 'approval:manage'
  | 'file:upload'
  | 'file:delete'
  | 'resource:edit';

const PERMISSIONS_MAP: Record<PermissionAction, Role[]> = {
  'project:create': ['ADMIN', 'PROJECT_LEAD'],
  'project:edit': ['ADMIN', 'PROJECT_LEAD'],
  'project:delete': ['ADMIN'],
  'project:view': ['ADMIN', 'PROJECT_LEAD', 'STAFF', 'CLIENT'],
  'task:create': ['ADMIN', 'PROJECT_LEAD', 'STAFF'],
  'task:update': ['ADMIN', 'PROJECT_LEAD', 'STAFF'],
  'task:delete': ['ADMIN', 'PROJECT_LEAD'],
  'user:manage': ['ADMIN'],
  'reports:view': ['ADMIN', 'PROJECT_LEAD'],
  'financials:view': ['ADMIN'],
  'board:view': ['ADMIN', 'PROJECT_LEAD', 'STAFF'],
  'timeline:view': ['ADMIN', 'PROJECT_LEAD', 'STAFF'],
  'cockpit:view': ['ADMIN', 'PROJECT_LEAD', 'CLIENT'],
  'client:create': ['ADMIN', 'PROJECT_LEAD'],
  'revision:request': ['CLIENT', 'ADMIN', 'PROJECT_LEAD'],
  'approval:manage': ['CLIENT', 'ADMIN'],
  'file:upload': ['ADMIN', 'PROJECT_LEAD', 'STAFF', 'CLIENT'],
  'file:delete': ['ADMIN', 'PROJECT_LEAD'],
  'resource:edit': ['ADMIN', 'PROJECT_LEAD'],
};

/**
 * Checks if a given role has permission to execute an action.
 */
export function can(role: Role | undefined | null, action: PermissionAction): boolean {
  if (!role) return false;
  const allowedRoles = PERMISSIONS_MAP[action];
  return allowedRoles ? allowedRoles.includes(role) : false;
}

/**
 * Throws an error if the user role does not satisfy the required permission.
 * Used for backend service-level authorization enforcement.
 */
export function assertPermission(role: Role | undefined | null, action: PermissionAction, message?: string): void {
  if (!can(role, action)) {
    throw new Error(
      message || `Akses Ditolak: Role [${role || 'GUEST'}] tidak memiliki izin untuk melakukan [${action}].`
    );
  }
}
