import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import type { Screen } from "@/lib/types";
import { router } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Iconos simples por routePath — se pueden extender
const SCREEN_ICONS: Record<string, string> = {
  "pantallas/usuarios": "👥",
  "pantallas/roles": "🛡️",
  "pantallas/pantallas": "🖥️",
  "pantallas/logs": "📋",
};

export default function Index() {
  const { resolvedPermissionKeys, isAuthenticated, appUser } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [loading, setLoading] = useState(true);

  // Suscripción en tiempo real a pantallas activas
  useEffect(() => {
    if (!isAuthenticated) return;

    const q = query(
      collection(db, "screens"),
      where("isActive", "==", true),
      orderBy("order", "asc"),
    );

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Screen);

      // Filtrar pantallas de /pantallas según permisos del usuario
      const visible = all.filter((s) => {
        // Las pantallas de tabs siempre se muestran (index, profile)
        if (!s.routePath.startsWith("pantallas/")) return false;
        // Verificar que el usuario tenga TODOS los permisos requeridos
        return s.requiredPermissions.every((k) =>
          resolvedPermissionKeys.has(k),
        );
      });

      setScreens(visible);
      setLoading(false);
    });

    return unsub;
  }, [isAuthenticated, resolvedPermissionKeys]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <Text style={styles.greeting}>
        Hola, {appUser?.displayName?.split(" ")[0] ?? "usuario"} 👋
      </Text>
      <Text style={styles.subtitle}>¿Qué deseas hacer hoy?</Text>

      {/* Pantallas permitidas desde la BD */}
      {screens.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administración</Text>
          <View style={styles.grid}>
            {screens.map((screen) => (
              <TouchableOpacity
                key={screen.id}
                style={styles.card}
                activeOpacity={0.75}
                onPress={() => router.push(`/${screen.routePath}` as any)}
              >
                <Text style={styles.cardIcon}>
                  {SCREEN_ICONS[screen.routePath] ?? "📄"}
                </Text>
                <Text style={styles.cardText}>{screen.displayName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Pantallas fijas de la app */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Herramientas</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => router.push("/_sitemap")}
          >
            <Text style={styles.cardIcon}>🌐</Text>
            <Text style={styles.cardText}>Navegar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {screens.length === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No tienes módulos de administración asignados.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  greeting: { fontSize: 22, fontWeight: "700", color: "#111", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#888", marginBottom: 28 },

  section: { marginBottom: 28 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: "uppercase",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    width: "47%",
    minHeight: 100,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardIcon: { fontSize: 28, marginBottom: 10 },
  cardText: { fontSize: 15, fontWeight: "600", color: "#222" },

  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, color: "#aaa", textAlign: "center" },
});
