import { Timestamp } from "firebase/firestore";

// ─── PERMISSION ────────────────────────────────────────────────────────────────
export interface Permission {
  id: string;
  name: string;
  description: string;
  key: string; // e.g. "read:users", "manage:screens"
  isActive: boolean;
  category: string; // e.g. "users", "screens", "roles"
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

// ─── ROLE ──────────────────────────────────────────────────────────────────────
export interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissionIds: string[];
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

// ─── USER ──────────────────────────────────────────────────────────────────────
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  isActive: boolean;
  isBlocked: boolean;
  roleIds: string[];
  permissionIds: string[]; // permisos adicionales directos (además de los de roles)
  lastLogin: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ─── SCREEN ────────────────────────────────────────────────────────────────────
export interface Screen {
  id: string;
  routePath: string; // e.g. "(tabs)/index", "pantallas/detalle"
  displayName: string; // nombre editable desde BD
  isActive: boolean;
  requiredPermissions: string[]; // permission keys requeridas (AND logic)
  icon: string | null;
  order: number;
  parentScreenId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}

// ─── LOG ───────────────────────────────────────────────────────────────────────
export type LogAction =
  | "login"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "read"
  | "block_user"
  | "unblock_user"
  | "assign_role"
  | "remove_role"
  | "assign_permission"
  | "remove_permission"
  | "enable_screen"
  | "disable_screen"
  | "change_screen_name";

export interface Log {
  id: string;
  userId: string;
  userEmail: string;
  action: LogAction;
  targetCollection: string;
  targetId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: Timestamp;
  ipAddress: string | null;
  platform: string;
}

// ─── SESSION ───────────────────────────────────────────────────────────────────
export interface Session {
  id: string;
  userId: string;
  loginAt: Timestamp;
  logoutAt: Timestamp | null;
  platform: string;
  appVersion: string;
  ipAddress: string | null;
  isActive: boolean;
  deviceInfo: string | null;
}

// ─── APP CONFIG ────────────────────────────────────────────────────────────────
export interface AppConfig {
  id: string; // e.g. "app_name", "maintenance_mode"
  value: unknown;
  description: string;
  updatedAt: Timestamp;
  updatedBy: string;
  isPublic: boolean;
}

// ─── AUTH CONTEXT ──────────────────────────────────────────────────────────────
export interface AuthState {
  firebaseUser: import("firebase/auth").User | null;
  appUser: AppUser | null;
  roles: Role[];
  permissions: Permission[];
  resolvedPermissionKeys: Set<string>; // union de permisos de roles + directos
  isLoading: boolean;
  isAuthenticated: boolean;
}
