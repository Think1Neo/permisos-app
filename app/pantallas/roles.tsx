import { useAuth } from "@/context/AuthContext";
import { useScreenGuard } from "@/hooks/useAuthHooks";
import { db } from "@/lib/firebase";
import type { Permission, Role } from "@/lib/types";
import { createRole, subscribeRoles, updateRole } from "@/services/roleService";
import { router } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ─── tipos locales ─────────────────────────────────────────────────────────────
interface RoleForm {
  name: string;
  description: string;
  permissionIds: string[];
}
const EMPTY_FORM: RoleForm = { name: "", description: "", permissionIds: [] };

export default function RolesScreen() {
  const { checking } = useScreenGuard("pantallas/roles");
  const { appUser } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleForm>(EMPTY_FORM);

  // suscripción realtime a roles
  useEffect(() => {
    const unsub = subscribeRoles((r) => {
      setRoles(r);
      setLoading(false);
    });
    return unsub;
  }, []);

  // cargar todos los permisos disponibles (para el selector)
  useEffect(() => {
    getDocs(
      query(collection(db, "permissions"), orderBy("category", "asc")),
    ).then((snap) =>
      setAllPerms(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Permission),
      ),
    );
  }, []);

  if (checking || loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // ── abrir modal ──────────────────────────────────────────────────────────────
  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }
  function openEdit(role: Role) {
    setEditTarget(role);
    setForm({
      name: role.name,
      description: role.description,
      permissionIds: role.permissionIds,
    });
    setModalOpen(true);
  }

  // ── guardar ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.name.trim()) {
      Alert.alert("Error", "El nombre es obligatorio.");
      return;
    }
    if (!appUser) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateRole(
          editTarget.id,
          {
            name: form.name.trim(),
            description: form.description.trim(),
            permissionIds: form.permissionIds,
          },
          appUser.uid,
          appUser.email,
        );
      } else {
        await createRole(
          {
            name: form.name.trim(),
            description: form.description.trim(),
            permissionIds: form.permissionIds,
            order: roles.length,
          },
          appUser.uid,
          appUser.email,
        );
      }
      setModalOpen(false);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  // ── toggle activo ─────────────────────────────────────────────────────────────
  async function handleToggle(role: Role) {
    if (!appUser) return;
    await updateRole(
      role.id,
      { isActive: !role.isActive },
      appUser.uid,
      appUser.email,
    );
  }

  // ── toggle permiso en el form ─────────────────────────────────────────────────
  function togglePerm(permId: string) {
    setForm((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter((id) => id !== permId)
        : [...prev.permissionIds, permId],
    }));
  }

  // agrupar permisos por categoría
  const permsByCategory = allPerms.reduce<Record<string, Permission[]>>(
    (acc, p) => {
      (acc[p.category] ??= []).push(p);
      return acc;
    },
    {},
  );

  return (
    <View style={s.container}>
      {/* cabecera */}
      <Button title="Volver" onPress={() => router.back()} color="#6366f1" />
      <View style={s.header}>
        <Text style={s.title}>Roles</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={openCreate}
          activeOpacity={0.8}
        >
          <Text style={s.addBtnText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.list}>
        {roles.map((role) => (
          <View
            key={role.id}
            style={[s.card, !role.isActive && s.cardInactive]}
          >
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.roleName}>{role.name}</Text>
                {!!role.description && (
                  <Text style={s.roleDesc}>{role.description}</Text>
                )}
                <View style={s.chipRow}>
                  <View style={s.chip}>
                    <Text style={s.chipText}>
                      {role.permissionIds.length} permisos
                    </Text>
                  </View>
                  <View
                    style={[s.chip, role.isActive ? s.chipGreen : s.chipGray]}
                  >
                    <Text
                      style={[
                        s.chipText,
                        role.isActive ? s.chipGreenText : s.chipGrayText,
                      ]}
                    >
                      {role.isActive ? "Activo" : "Inactivo"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={s.cardActions}>
                <Switch
                  value={role.isActive}
                  onValueChange={() => handleToggle(role)}
                  trackColor={{ true: "#6366f1" }}
                  thumbColor="#fff"
                />
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => openEdit(role)}
                >
                  <Text style={s.editBtnText}>Editar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* permisos asignados */}
            {role.permissionIds.length > 0 && (
              <View style={s.permRow}>
                {role.permissionIds.map((pid) => {
                  const p = allPerms.find((x) => x.id === pid);
                  return p ? (
                    <View key={pid} style={s.permChip}>
                      <Text style={s.permChipText}>{p.key}</Text>
                    </View>
                  ) : null;
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* ── Modal crear / editar ── */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>
              {editTarget ? "Editar rol" : "Nuevo rol"}
            </Text>

            <Text style={s.label}>Nombre *</Text>
            <TextInput
              style={s.input}
              value={form.name}
              onChangeText={(t) => setForm((p) => ({ ...p, name: t }))}
              placeholder="Ej. Supervisor"
            />

            <Text style={s.label}>Descripción</Text>
            <TextInput
              style={[s.input, { height: 72 }]}
              value={form.description}
              onChangeText={(t) => setForm((p) => ({ ...p, description: t }))}
              placeholder="Describe qué puede hacer este rol…"
              multiline
            />

            <Text style={s.label}>Permisos</Text>
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
              {Object.entries(permsByCategory).map(([cat, perms]) => (
                <View key={cat} style={{ marginBottom: 10 }}>
                  <Text style={s.catLabel}>{cat.toUpperCase()}</Text>
                  {perms.map((p) => {
                    const selected = form.permissionIds.includes(p.id);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[s.permRow2, selected && s.permRow2Selected]}
                        onPress={() => togglePerm(p.id)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[s.checkbox, selected && s.checkboxSelected]}
                        >
                          {selected && <Text style={s.checkmark}>✓</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.permName}>{p.name}</Text>
                          <Text style={s.permKey}>{p.key}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
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
                onPress={handleSave}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111" },
  addBtn: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInactive: { opacity: 0.55 },
  cardTop: { flexDirection: "row", gap: 10 },
  roleName: { fontSize: 16, fontWeight: "700", color: "#111", marginBottom: 2 },
  roleDesc: { fontSize: 13, color: "#777", marginBottom: 8, lineHeight: 18 },
  cardActions: { alignItems: "center", gap: 8 },
  editBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 13, color: "#6366f1", fontWeight: "600" },

  chipRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  chipText: { fontSize: 11, color: "#555", fontWeight: "500" },
  chipGreen: { backgroundColor: "#dcfce7" },
  chipGreenText: { color: "#166534" },
  chipGray: { backgroundColor: "#f1f5f9" },
  chipGrayText: { color: "#888" },

  permRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  permChip: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  permChipText: { fontSize: 11, color: "#5b21b6", fontWeight: "500" },

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
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#111",
  },
  catLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#aaa",
    letterSpacing: 1,
    marginBottom: 6,
  },
  permRow2: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  permRow2Selected: { backgroundColor: "#ede9fe" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  checkmark: { color: "#fff", fontSize: 12, fontWeight: "700" },
  permName: { fontSize: 13, fontWeight: "500", color: "#222" },
  permKey: { fontSize: 11, color: "#888", fontFamily: "monospace" },

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
