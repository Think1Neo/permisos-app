import { Ionicons } from "@expo/vector-icons";
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

  function canSeeTab(routePath: string): boolean {
    const config = screens.find((s) => s.routePath === routePath);
    if (!config) return true;
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
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: "#aaa",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: getTabName("(tabs)/index", "Inicio"),
          href: canSeeTab("(tabs)/index") ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: getTabName("(tabs)/profile", "Perfil"),
          href: canSeeTab("(tabs)/profile") ? undefined : null,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
