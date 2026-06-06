import { useAuth } from "@/context/AuthContext";
import { useScreenGuard } from "@/hooks/useAuthHooks";
import { db } from "@/lib/firebase";
import type { AppUser, Role } from "@/lib/types";
import {
  getAllUsers,
  setUserBlocked,
  updateUserRoles,
} from "@/services/userService";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from "react-native";

export default function UsuariosScreen() {
  const { checking } = useScreenGuard("pantallas/usuarios");
  const { appUser } = useAuth();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<AppUser | null>(null);
  const [formRoles, setFormRoles] = useState<string[]>([]);

  async function loadUsers() {
    const data = await getAllUsers();
    setUsers(data);
  }

  useEffect(() => {
    Promise.all([
      loadUsers(),
      getDocs(query(collection(db, "roles"), orderBy("order", "asc"))).then(
        (snap) =>
          setAllRoles(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Role),
          ),
      ),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }

  if (checking || loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  function openModal(user: AppUser) {
    setSelected(user);
    setFormRoles(user.roleIds ?? []);
    setModalOpen(true);
  }

  async function handleToggleBlock(user: AppUser) {
    if (!appUser) return;
    if (user.uid === appUser.uid) {
      Alert.alert("No permitido", "No puedes bloquearte a ti mismo.");
      return;
    }
    Alert.alert(
      user.isBlocked ? "Desbloquear usuario" : "Bloquear usuario",
      `¿${user.isBlocked ? "Desbloquear" : "Bloquear"} a ${user.displayName || user.email}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: user.isBlocked ? "default" : "destructive",
          onPress: async () => {
            await setUserBlocked(
              user.uid,
              !user.isBlocked,
              appUser.uid,
              appUser.email,
            );
            await loadUsers();
          },
        },
      ],
    );
  }

  async function handleSaveRoles() {
    if (!selected || !appUser) return;
    setSaving(true);
    try {
      await updateUserRoles(
        selected.uid,
        formRoles,
        appUser.uid,
        appUser.email,
      );
      await loadUsers();
      setModalOpen(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  function toggleRole(roleId: string) {
    setFormRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((r) => r !== roleId)
        : [...prev, roleId],
    );
  }

  const initials = (u: AppUser) =>
    u.displayName
      ? u.displayName
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase()
      : u.email[0].toUpperCase();

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Usuarios</Text>
        <Text style={s.subtitle}>{users.length} registrados</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {users.map((user) => (
          <View
            key={user.uid}
            style={[s.card, user.isBlocked && s.cardBlocked]}
          >
            <View style={s.cardRow}>
              {/* avatar */}
              <View style={[s.avatar, user.isBlocked && s.avatarBlocked]}>
                <Text style={s.avatarText}>{initials(user)}</Text>
              </View>

              {/* info */}
              <View style={{ flex: 1 }}>
                <Text style={s.userName}>
                  {user.displayName || "Sin nombre"}
                </Text>
                <Text style={s.userEmail}>{user.email}</Text>

                {/* roles */}
                <View style={s.chipRow}>
                  {(user.roleIds ?? []).length === 0 ? (
                    <View style={s.chip}>
                      <Text style={s.chipText}>Sin rol</Text>
                    </View>
                  ) : (
                    (user.roleIds ?? []).map((rid) => {
                      const role = allRoles.find((r) => r.id === rid);
                      return role ? (
                        <View key={rid} style={s.chipPurple}>
                          <Text style={s.chipPurpleText}>{role.name}</Text>
                        </View>
                      ) : null;
                    })
                  )}
                  {user.isBlocked && (
                    <View style={s.chipRed}>
                      <Text style={s.chipRedText}>Bloqueado</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* acciones */}
              <View style={s.actions}>
                <Switch
                  value={!user.isBlocked}
                  onValueChange={() => handleToggleBlock(user)}
                  trackColor={{ true: "#6366f1", false: "#f87171" }}
                  thumbColor="#fff"
                  disabled={user.uid === appUser?.uid}
                />
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => openModal(user)}
                >
                  <Text style={s.editBtnText}>Roles</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* fechas */}
            <View style={s.metaRow}>
              <Text style={s.meta}>
                Registrado:{" "}
                {user.createdAt
                  ? new Date(
                      (user.createdAt as any).seconds * 1000,
                    ).toLocaleDateString("es-MX")
                  : "—"}
              </Text>
              <Text style={s.meta}>
                Último acceso:{" "}
                {user.lastLogin
                  ? new Date(
                      (user.lastLogin as any).seconds * 1000,
                    ).toLocaleDateString("es-MX")
                  : "Nunca"}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ── Modal asignar roles ── */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Asignar roles</Text>
            <Text style={s.modalSubtitle}>
              {selected?.displayName || selected?.email}
            </Text>

            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled>
              {allRoles.map((role) => {
                const sel = formRoles.includes(role.id);
                return (
                  <TouchableOpacity
                    key={role.id}
                    style={[s.roleRow, sel && s.roleRowSelected]}
                    onPress={() => toggleRole(role.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.checkbox, sel && s.checkboxSelected]}>
                      {sel && <Text style={s.checkmark}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.roleName}>{role.name}</Text>
                      {!!role.description && (
                        <Text style={s.roleDesc}>{role.description}</Text>
                      )}
                      <Text style={s.rolePerms}>
                        {role.permissionIds.length} permisos
                      </Text>
                    </View>
                    {!role.isActive && (
                      <View style={s.chipGray2}>
                        <Text style={s.chipGray2Text}>Inactivo</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={s.modalFooter}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => setModalOpen(false)}
              >
                <Text style={s.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveRoles}
                disabled={saving}
              >
                <Text style={s.saveBtnText}>
                  {saving ? "Guardando…" : "Guardar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 13, color: "#999", marginTop: 2 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBlocked: { borderLeftWidth: 3, borderLeftColor: "#f87171" },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBlocked: { backgroundColor: "#f87171" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  userName: { fontSize: 15, fontWeight: "600", color: "#111" },
  userEmail: { fontSize: 12, color: "#888", marginBottom: 6 },
  actions: { alignItems: "center", gap: 6 },
  editBtn: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 12, color: "#6366f1", fontWeight: "600" },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  chip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  chipText: { fontSize: 11, color: "#888" },
  chipPurple: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  chipPurpleText: { fontSize: 11, color: "#5b21b6", fontWeight: "500" },
  chipRed: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  chipRedText: { fontSize: 11, color: "#991b1b", fontWeight: "500" },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f0f0f0",
  },
  meta: { fontSize: 11, color: "#bbb" },

  // modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  modalSubtitle: { fontSize: 13, color: "#888", marginBottom: 16 },

  roleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  roleRowSelected: { backgroundColor: "#ede9fe" },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxSelected: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "700" },
  roleName: { fontSize: 14, fontWeight: "600", color: "#111" },
  roleDesc: { fontSize: 12, color: "#888", marginTop: 1 },
  rolePerms: { fontSize: 11, color: "#aaa", marginTop: 2 },
  chipGray2: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  chipGray2Text: { fontSize: 11, color: "#888" },

  modalFooter: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  cancelBtnText: { fontSize: 15, color: "#555" },
  saveBtn: {
    flex: 1,
    backgroundColor: "#6366f1",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, color: "#fff", fontWeight: "600" },
});
