import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { auth, db } from "../lib/firebase";
import type { AppUser, AuthState, Permission, Role } from "../lib/types";
import { logoutUser } from "../services/authService";

const AuthContext = createContext<
  AuthState & {
    hasPermission: (key: string) => boolean;
    logout: () => Promise<void>;
    refreshAuth: () => void;
  }
>({
  firebaseUser: null,
  appUser: null,
  roles: [],
  permissions: [],
  resolvedPermissionKeys: new Set(),
  isLoading: true,
  isAuthenticated: false,
  hasPermission: () => false,
  logout: async () => {},
  refreshAuth: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    appUser: null,
    roles: [],
    permissions: [],
    resolvedPermissionKeys: new Set(),
    isLoading: true,
    isAuthenticated: false,
  });

  const unsubscribeUserRef = useRef<(() => void) | null>(null);

  const resolvePermissions = useCallback(
    async (
      appUser: AppUser,
    ): Promise<{
      roles: Role[];
      permissions: Permission[];
      keys: Set<string>;
    }> => {
      const allRoleIds = appUser.roleIds ?? [];
      const allPermIds = [...(appUser.permissionIds ?? [])];

      let roles: Role[] = [];
      if (allRoleIds.length > 0) {
        const chunks = chunkArray(allRoleIds, 10);
        for (const chunk of chunks) {
          const snap = await getDocs(
            query(
              collection(db, "roles"),
              where("__name__", "in", chunk),
              where("isActive", "==", true),
            ),
          );
          snap.docs.forEach((d) => {
            const role = { id: d.id, ...d.data() } as Role;
            roles.push(role);
            allPermIds.push(...(role.permissionIds ?? []));
          });
        }
      }

      const uniquePermIds = [...new Set(allPermIds)];
      let permissions: Permission[] = [];
      if (uniquePermIds.length > 0) {
        const chunks = chunkArray(uniquePermIds, 10);
        for (const chunk of chunks) {
          const snap = await getDocs(
            query(
              collection(db, "permissions"),
              where("__name__", "in", chunk),
              where("isActive", "==", true),
            ),
          );
          snap.docs.forEach((d) =>
            permissions.push({ id: d.id, ...d.data() } as Permission),
          );
        }
      }

      const keys = new Set(permissions.map((p) => p.key));
      return { roles, permissions, keys };
    },
    [],
  );

  const refreshAuth = useCallback(() => {
    auth.currentUser?.reload();
  }, []);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeUserRef.current?.();
      unsubscribeUserRef.current = null;

      if (!firebaseUser) {
        setState({
          firebaseUser: null,
          appUser: null,
          roles: [],
          permissions: [],
          resolvedPermissionKeys: new Set(),
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      const userRef = doc(db, "users", firebaseUser.uid);

      const unsubUser = onSnapshot(
        userRef,
        async (snap) => {
          // Documento no existe todavía — lo crea registerUser, esperamos
          if (!snap.exists()) {
            try {
              await setDoc(
                userRef,
                {
                  email: firebaseUser.email ?? "",
                  displayName: firebaseUser.displayName ?? "",
                  photoURL: firebaseUser.photoURL ?? null,
                  isActive: true,
                  isBlocked: false,
                  roleIds: [],
                  permissionIds: [],
                  lastLogin: serverTimestamp(),
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                  updatedBy: firebaseUser.uid,
                },
                { merge: true },
              );
            } catch {
              // registerUser ya lo está creando en paralelo, ignorar
            }
            return;
          }

          const appUser = { uid: snap.id, ...snap.data() } as AppUser;

          // Bloqueo en tiempo real
          if (appUser.isBlocked || !appUser.isActive) {
            await logoutUser(firebaseUser.uid, firebaseUser.email ?? "");
            return;
          }

          // Resolver permisos solo en memoria — sin escribir nada a Firestore
          const { roles, permissions, keys } =
            await resolvePermissions(appUser);

          setState({
            firebaseUser,
            appUser,
            roles,
            permissions,
            resolvedPermissionKeys: keys,
            isLoading: false,
            isAuthenticated: true,
          });
        },
        (error) => {
          console.warn("[AuthContext] error:", error.code);
          setState((prev) => ({ ...prev, isLoading: false }));
        },
      );

      unsubscribeUserRef.current = unsubUser;
    });

    return () => {
      unsubAuth();
      unsubscribeUserRef.current?.();
    };
  }, [resolvePermissions]);

  const hasPermission = useCallback(
    (key: string) => state.resolvedPermissionKeys.has(key),
    [state.resolvedPermissionKeys],
  );

  const logout = useCallback(async () => {
    if (state.appUser) {
      await logoutUser(state.appUser.uid, state.appUser.email);
    }
  }, [state.appUser]);

  return (
    <AuthContext.Provider
      value={{ ...state, hasPermission, logout, refreshAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
