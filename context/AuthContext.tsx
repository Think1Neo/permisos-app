import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { AuthState, AppUser, Role, Permission } from '../lib/types';
import { logoutUser } from '../services/authService';

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
    async (appUser: AppUser): Promise<{ roles: Role[]; permissions: Permission[]; keys: Set<string> }> => {
      const allRoleIds = appUser.roleIds ?? [];
      const allPermIds = [...(appUser.permissionIds ?? [])];

      let roles: Role[] = [];
      if (allRoleIds.length > 0) {
        const chunks = chunkArray(allRoleIds, 10);
        for (const chunk of chunks) {
          const snap = await getDocs(
            query(
              collection(db, 'roles'),
              where('__name__', 'in', chunk),
              where('isActive', '==', true),
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
              collection(db, 'permissions'),
              where('__name__', 'in', chunk),
              where('isActive', '==', true),
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

      console.log('[AuthContext] usuario autenticado uid:', firebaseUser.uid);

      const userRef = doc(db, 'users', firebaseUser.uid);

      const unsubUser = onSnapshot(
        userRef,
        async (snap) => {
          console.log('[AuthContext] onSnapshot fired — exists:', snap.exists());

          if (!snap.exists()) {
            // El documento todavía no existe — registerUser lo creará
            // con todos los campos correctos (incluido roleIds).
            // AuthContext NUNCA crea documentos; solo los lee.
            // El onSnapshot volverá a disparar en cuanto registerUser
            // termine el setDoc y el rol ya estará presente.
            console.log('[AuthContext] doc no existe aún, esperando a registerUser...');
            return;
          }

          const appUser = { uid: snap.id, ...snap.data() } as AppUser;
          console.log('[AuthContext] appUser cargado:', appUser.email, '| roleIds:', appUser.roleIds);

          if (appUser.isBlocked || !appUser.isActive) {
            await logoutUser(firebaseUser.uid, firebaseUser.email ?? '');
            return;
          }

          const { roles, permissions, keys } = await resolvePermissions(appUser);

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
          console.error('[AuthContext] onSnapshot error — code:', error.code);
          console.error('[AuthContext] onSnapshot error — message:', error.message);
          console.error('[AuthContext] path que falló: users/' + firebaseUser.uid);
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
    <AuthContext.Provider value={{ ...state, hasPermission, logout, refreshAuth }}>
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
