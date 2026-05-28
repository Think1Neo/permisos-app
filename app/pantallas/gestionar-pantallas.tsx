import { useAuth } from "@/context/AuthContext";
import { useScreenGuard } from "@/hooks/useAuthHooks";
import { db } from "@/lib/firebase";
import type { Permission, Screen } from "@/lib/types";
import {
  renameScreen,
  setScreenActive,
  subscribeScreens,
  updateScreenPermissions,
} from "@/services/screenService";
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

export default function PantallasScreen() {
  const { checking } = useScreenGuard("pantallas/gestionar-pantallas");
  const { appUser } = useAuth();

  const [screens, setScreens] = useState<Screen[]>([]);
  const [allPerms, setAllPerms] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // modal edición
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<Screen | null>(null);
  const [formName, setFormName] = useState("");
  const [formPerms, setFormPerms] = useState<string[]>([]);

  useEffect(() => {
    const unsub = subscribeScreens((s) => {
      setScreens(s);
      setLoading(false);
    });
    return unsub;
  }, []);

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

  function openEdit(screen: Screen) {
    setSelected(screen);
    setFormName(screen.displayName);
    setFormPerms(screen.requiredPermissions);
    setModalOpen(true);
  }

  async function handleToggle(screen: Screen) {
    if (!appUser) return;
    await setScreenActive(
      screen.id,
      !screen.isActive,
      appUser.uid,
      appUser.email,
    );
  }

  async function handleSave() {
    if (!selected || !appUser) return;
    if (!formName.trim()) {
      Alert.alert("Error", "El nombre no puede estar vacío.");
      return;
    }
    setSaving(true);
    try {
      // renombrar si cambió
      if (formName.trim() !== selected.displayName) {
        await renameScreen(
          selected.id,
          formName.trim(),
          appUser.uid,
          appUser.email,
        );
      }
      // actualizar permisos requeridos si cambiaron
      const same =
        formPerms.length === selected.requiredPermissions.length &&
        formPerms.every((k) => selected.requiredPermissions.includes(k));
      if (!same) {
        await updateScreenPermissions(
          selected.id,
          formPerms,
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

  function togglePerm(key: string) {
    setFormPerms((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  const permsByCategory = allPerms.reduce<Record<string, Permission[]>>(
    (acc, p) => {
      (acc[p.category] ??= []).push(p);
      return acc;
    },
    {},
  );

  return (
    <View style={s.container}>
      <Button title="Volver" onPress={() => router.back()} color="#6366f1" />
      <View style={s.header}>
        <Text style={s.title}>Pantallas</Text>
        <Text style={s.subtitle}>{screens.length} registradas</Text>
      </View>

      <ScrollView contentContainerStyle={s.list}>
        {screens.map((screen) => (
          <View
            key={screen.id}
            style={[s.card, !screen.isActive && s.cardInactive]}
          >
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.screenName}>{screen.displayName}</Text>
                <Text style={s.routePath}>{screen.routePath}</Text>
                <View style={s.chipRow}>
                  <View
                    style={[s.chip, screen.isActive ? s.chipGreen : s.chipGray]}
                  >
                    <Text
                      style={[
                        s.chipText,
                        screen.isActive ? s.chipTextGreen : s.chipTextGray,
                      ]}
                    >
                      {screen.isActive ? "Activa" : "Inactiva"}
                    </Text>
                  </View>
                  <View style={s.chip}>
                    <Text style={s.chipText}>
                      {screen.requiredPermissions.length === 0
                        ? "Pública"
                        : `${screen.requiredPermissions.length} permiso(s)`}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={s.cardActions}>
                <Switch
                  value={screen.isActive}
                  onValueChange={() => handleToggle(screen)}
                  trackColor={{ true: "#6366f1" }}
                  thumbColor="#fff"
                />
                <TouchableOpacity
                  style={s.editBtn}
                  onPress={() => openEdit(screen)}
                >
                  <Text style={s.editBtnText}>Editar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* permisos requeridos */}
            {screen.requiredPermissions.length > 0 && (
              <View style={s.permRow}>
                {screen.requiredPermissions.map((key) => (
                  <View key={key} style={s.permChip}>
                    <Text style={s.permChipText}>{key}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* ── Modal editar pantalla ── */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Editar pantalla</Text>
            <Text style={s.routeLabel}>{selected?.routePath}</Text>

            <Text style={s.label}>Nombre visible *</Text>
            <TextInput
              style={s.input}
              value={formName}
              onChangeText={setFormName}
              placeholder="Nombre en la app"
            />

            <Text style={s.label}>Permisos requeridos</Text>
            <Text style={s.helpText}>
              Deja vacío para que sea pública. Si marcas varios, el usuario debe
              tener TODOS.
            </Text>

            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              {Object.entries(permsByCategory).map(([cat, perms]) => (
                <View key={cat} style={{ marginBottom: 8 }}>
                  <Text style={s.catLabel}>{cat.toUpperCase()}</Text>
                  {perms.map((p) => {
                    const selected2 = formPerms.includes(p.key);
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[s.permRow2, selected2 && s.permRow2Selected]}
                        onPress={() => togglePerm(p.key)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[s.checkbox, selected2 && s.checkboxSelected]}
                        >
                          {selected2 && <Text style={s.checkmark}>✓</Text>}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.permName}>{p.name}</Text>
                          <Text style={s.permKeyText}>{p.key}</Text>
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
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 13, color: "#999", marginTop: 2 },
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
  cardInactive: { opacity: 0.5 },
  cardTop: { flexDirection: "row", gap: 10 },
  screenName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  routePath: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
    marginBottom: 8,
  },
  cardActions: { alignItems: "center", gap: 8 },
  editBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 13, color: "#6366f1", fontWeight: "600" },

  chipRow: { flexDirection: "row", gap: 6 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  chipText: { fontSize: 11, color: "#555", fontWeight: "500" },
  chipGreen: { backgroundColor: "#dcfce7" },
  chipTextGreen: { color: "#166534" },
  chipGray: { backgroundColor: "#f1f5f9" },
  chipTextGray: { color: "#888" },

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
    marginBottom: 4,
  },
  routeLabel: {
    fontSize: 12,
    color: "#999",
    fontFamily: "monospace",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
    marginTop: 12,
  },
  helpText: { fontSize: 12, color: "#aaa", marginBottom: 8 },
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
    marginBottom: 4,
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
  permKeyText: { fontSize: 11, color: "#888", fontFamily: "monospace" },

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
