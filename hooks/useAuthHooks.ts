import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useState } from 'react';
import type { Screen } from '../lib/types';

// ─── PERMISSION CHECK ──────────────────────────────────────────────────────────
/**
 * Retorna true si el usuario tiene el permiso indicado.
 * Usar en componentes para mostrar/ocultar elementos de UI.
 */
export function usePermission(permissionKey: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permissionKey);
}

// ─── SCREEN GUARD ──────────────────────────────────────────────────────────────
/**
 * Hook para verificar si una pantalla está habilitada y el usuario
 * tiene los permisos necesarios para acceder a ella.
 * Redirige automáticamente si no tiene acceso.
 */
export function useScreenGuard(routePath: string) {
  const { resolvedPermissionKeys, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [screenConfig, setScreenConfig] = useState<Screen | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    let cancelled = false;

    async function check() {
      const q = query(collection(db, 'screens'), where('routePath', '==', routePath));
      const snap = await getDocs(q);

      if (cancelled) return;

      if (snap.empty) {
        // Pantalla no registrada en BD → acceso libre (modo desarrollo)
        setChecking(false);
        return;
      }

      const screen = { id: snap.docs[0].id, ...snap.docs[0].data() } as Screen;
      setScreenConfig(screen);

      if (!screen.isActive) {
        router.replace('/(tabs)');
        return;
      }

      const hasAll = screen.requiredPermissions.every((key) =>
        resolvedPermissionKeys.has(key),
      );

      if (!hasAll) {
        router.replace('/(tabs)');
        return;
      }

      setChecking(false);
    }

    check();
    return () => { cancelled = true; };
  }, [routePath, resolvedPermissionKeys, isAuthenticated, isLoading, router]);

  return { checking, screenConfig };
}

// ─── AUTH REDIRECT ─────────────────────────────────────────────────────────────
/**
 * Maneja redirecciones globales basadas en estado de autenticación.
 * Usar en el layout raíz (app/_layout.tsx).
 */
export function useAuthRedirect() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inBienvenida = segments[0] === 'bienvenida';

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/bienvenida/bienvenida');
      return;
    }

    if (isAuthenticated && (inBienvenida || segments[0] === 'login')) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);
}
