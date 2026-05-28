import { Tabs } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import type { Screen } from "../../lib/types";

export default function TabsLayout() {
  const { resolvedPermissionKeys, isAuthenticated } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const q = query(
      collection(db, "screens"),
      where("isActive", "==", true),
      orderBy("order", "asc"),
    );
    return onSnapshot(q, (snap) => {
      setScreens(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Screen));
    });
  }, [isAuthenticated]);

  // Determina si el usuario puede ver una pantalla dada su configuración
  function canSeeTab(routePath: string): boolean {
    const config = screens.find((s) => s.routePath === routePath);
    if (!config) return true; // sin config → visible
    if (!config.isActive) return false;
    return config.requiredPermissions.every((k) =>
      resolvedPermissionKeys.has(k),
    );
  }

  function getTabName(routePath: string, fallback: string): string {
    return (
      screens.find((s) => s.routePath === routePath)?.displayName ?? fallback
    );
  }

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: getTabName("(tabs)/index", "Inicio"),
          href: canSeeTab("(tabs)/index") ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: getTabName("(tabs)/profile", "Perfil"),
          href: canSeeTab("(tabs)/profile") ? undefined : null,
        }}
      />
    </Tabs>
  );
}

/*
import { Tabs } from "expo-router";

export default function RootLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          //headerTintColor: "orange",
          headerTitleStyle: { fontSize: 20, fontWeight: "bold" },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
    </Tabs>
  );
}

*/
