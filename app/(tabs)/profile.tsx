import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Profile() {
  const {
    appUser,
    roles,
    permissions,
    resolvedPermissionKeys,
    logout,
    isLoading,
  } = useAuth();

  if (isLoading || !appUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  async function handleLogout() {
    Alert.alert("Cerrar sesión", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login/login");
        },
      },
    ]);
  }

  const initials = appUser.displayName
    ? appUser.displayName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : appUser.email[0].toUpperCase();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Avatar + nombre */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{appUser.displayName || "Sin nombre"}</Text>
        <Text style={styles.email}>{appUser.email}</Text>

        {/* Estado */}
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.badge,
              appUser.isActive ? styles.badgeGreen : styles.badgeRed,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                appUser.isActive ? styles.badgeTextGreen : styles.badgeTextRed,
              ]}
            >
              {appUser.isActive ? "Activo" : "Inactivo"}
            </Text>
          </View>
          {appUser.isBlocked && (
            <View style={[styles.badge, styles.badgeRed]}>
              <Text style={[styles.badgeText, styles.badgeTextRed]}>
                Bloqueado
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Roles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Roles asignados</Text>
        {roles.length === 0 ? (
          <Text style={styles.empty}>Sin roles asignados</Text>
        ) : (
          roles.map((role) => (
            <View key={role.id} style={styles.roleCard}>
              <View style={styles.roleHeader}>
                <Text style={styles.roleName}>{role.name}</Text>
                <View style={[styles.badge, styles.badgePurple]}>
                  <Text style={[styles.badgeText, styles.badgeTextPurple]}>
                    {role.permissionIds.length} permisos
                  </Text>
                </View>
              </View>
              {role.description ? (
                <Text style={styles.roleDesc}>{role.description}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      {/* Permisos resueltos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Permisos efectivos ({resolvedPermissionKeys.size})
        </Text>
        {resolvedPermissionKeys.size === 0 ? (
          <Text style={styles.empty}>Sin permisos</Text>
        ) : (
          <View style={styles.permGrid}>
            {[...resolvedPermissionKeys].map((key) => {
              const perm = permissions.find((p) => p.key === key);
              return (
                <View key={key} style={styles.permChip}>
                  <Text style={styles.permKey}>{key}</Text>
                  {perm?.name ? (
                    <Text style={styles.permName}>{perm.name}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Info adicional */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de cuenta</Text>
        <View style={styles.infoCard}>
          <InfoRow
            label="Último acceso"
            value={
              appUser.lastLogin
                ? new Date(
                    (appUser.lastLogin as any).seconds * 1000,
                  ).toLocaleString("es-MX")
                : "—"
            }
          />
          <InfoRow
            label="Miembro desde"
            value={
              appUser.createdAt
                ? new Date(
                    (appUser.createdAt as any).seconds * 1000,
                  ).toLocaleDateString("es-MX")
                : "—"
            }
          />
          <InfoRow label="UID" value={appUser.uid} mono />
        </View>
      </View>

      {/* Botón cerrar sesión */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text
        style={[infoStyles.value, mono && infoStyles.mono]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  label: { fontSize: 13, color: "#888", flex: 1 },
  value: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  mono: { fontFamily: "monospace", fontSize: 11, color: "#666" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 20, paddingBottom: 48 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  avatarSection: { alignItems: "center", marginBottom: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "700", color: "#fff" },
  name: { fontSize: 20, fontWeight: "700", color: "#111", marginBottom: 4 },
  email: { fontSize: 14, color: "#888", marginBottom: 10 },

  badgeRow: { flexDirection: "row", gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: "600" },

  badgeGreen: { backgroundColor: "#dcfce7" },
  badgeTextGreen: { color: "#166534" },
  badgeRed: { backgroundColor: "#fee2e2" },
  badgeTextRed: { color: "#991b1b" },
  badgePurple: { backgroundColor: "#ede9fe" },
  badgeTextPurple: { color: "#5b21b6" },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
    letterSpacing: 0.8,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  empty: { fontSize: 14, color: "#bbb", fontStyle: "italic" },

  roleCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  roleName: { fontSize: 15, fontWeight: "600", color: "#222" },
  roleDesc: { fontSize: 13, color: "#888", lineHeight: 18 },

  permGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  permChip: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  permKey: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366f1",
    fontFamily: "monospace",
  },
  permName: { fontSize: 11, color: "#888", marginTop: 1 },

  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  logoutBtn: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  logoutText: { fontSize: 15, fontWeight: "600", color: "#991b1b" },
});
