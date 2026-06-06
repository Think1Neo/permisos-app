import { useAuth } from "@/context/AuthContext";
import { useScreenGuard } from "@/hooks/useAuthHooks";
import { db } from "@/lib/firebase";
import type { Log, LogAction } from "@/lib/types";
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

// ─── config ───────────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

// colores y etiquetas por acción
const ACTION_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  login: { label: "Login", color: "#166534", bg: "#dcfce7" },
  logout: { label: "Logout", color: "#374151", bg: "#f3f4f6" },
  create: { label: "Crear", color: "#1d4ed8", bg: "#dbeafe" },
  update: { label: "Editar", color: "#92400e", bg: "#fef3c7" },
  delete: { label: "Eliminar", color: "#991b1b", bg: "#fee2e2" },
  block_user: { label: "Bloquear", color: "#991b1b", bg: "#fee2e2" },
  unblock_user: { label: "Desbloquear", color: "#166534", bg: "#dcfce7" },
  assign_role: { label: "Asignar rol", color: "#5b21b6", bg: "#ede9fe" },
  remove_role: { label: "Quitar rol", color: "#5b21b6", bg: "#ede9fe" },
  assign_permission: {
    label: "Asignar perm.",
    color: "#0369a1",
    bg: "#e0f2fe",
  },
  remove_permission: { label: "Quitar perm.", color: "#0369a1", bg: "#e0f2fe" },
  enable_screen: { label: "Activar pant.", color: "#166534", bg: "#dcfce7" },
  disable_screen: { label: "Desact. pant.", color: "#991b1b", bg: "#fee2e2" },
  change_screen_name: { label: "Renombrar", color: "#92400e", bg: "#fef3c7" },
  read: { label: "Leer", color: "#374151", bg: "#f3f4f6" },
};

const ALL_ACTIONS = Object.keys(ACTION_META) as LogAction[];

const COLLECTION_LABELS: Record<string, string> = {
  users: "Usuarios",
  roles: "Roles",
  screens: "Pantallas",
  logs: "Logs",
};

// ─── componente ───────────────────────────────────────────────────────────────
export default function LogsScreen() {
  const { checking } = useScreenGuard("pantallas/logs");
  const { appUser } = useAuth();

  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // filtros
  const [filterAction, setFilterAction] = useState<LogAction | "">("");
  const [filterCol, setFilterCol] = useState<string>("");
  const [filterOpen, setFilterOpen] = useState(false);

  // detalle
  const [detail, setDetail] = useState<Log | null>(null);

  // ── cargar página ────────────────────────────────────────────────────────────
  const loadPage = useCallback(
    async (reset = false) => {
      let q = query(
        collection(db, "logs"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE),
      );

      if (filterAction) q = query(q, where("action", "==", filterAction));
      if (filterCol) q = query(q, where("targetCollection", "==", filterCol));
      if (!reset && lastDoc) q = query(q, startAfter(lastDoc));

      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Log);

      if (reset) {
        setLogs(items);
      } else {
        setLogs((prev) => [...prev, ...items]);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    },
    [filterAction, filterCol, lastDoc],
  );

  useEffect(() => {
    setLoading(true);
    setLastDoc(null);
    const q = buildQuery(filterAction, filterCol, null);
    getDocs(q).then((snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Log));
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
      setLoading(false);
    });
  }, [filterAction, filterCol]);

  async function handleRefresh() {
    setRefreshing(true);
    setLastDoc(null);
    const snap = await getDocs(buildQuery(filterAction, filterCol, null));
    setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Log));
    setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === PAGE_SIZE);
    setRefreshing(false);
  }

  async function handleLoadMore() {
    if (!hasMore || loadingMore || !lastDoc) return;
    setLoadingMore(true);
    const snap = await getDocs(buildQuery(filterAction, filterCol, lastDoc));
    setLogs((prev) => [
      ...prev,
      ...snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Log),
    ]);
    setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    setHasMore(snap.docs.length === PAGE_SIZE);
    setLoadingMore(false);
  }

  if (checking || loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const activeFilters = [filterAction, filterCol].filter(Boolean).length;

  return (
    <View style={s.container}>
      {/* cabecera */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Auditoría</Text>
          <Text style={s.subtitle}>{logs.length} registros cargados</Text>
        </View>
        <TouchableOpacity
          style={[s.filterBtn, activeFilters > 0 && s.filterBtnActive]}
          onPress={() => setFilterOpen(true)}
        >
          <Text
            style={[
              s.filterBtnText,
              activeFilters > 0 && s.filterBtnTextActive,
            ]}
          >
            {activeFilters > 0 ? `Filtros (${activeFilters})` : "Filtrar"}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>
              No hay registros con los filtros aplicados.
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color="#6366f1"
              style={{ marginVertical: 16 }}
            />
          ) : null
        }
        renderItem={({ item: log }) => {
          const meta = ACTION_META[log.action] ?? {
            label: log.action,
            color: "#555",
            bg: "#f3f4f6",
          };
          const date = log.createdAt
            ? new Date((log.createdAt as any).seconds * 1000)
            : null;

          return (
            <TouchableOpacity
              style={s.logCard}
              onPress={() => setDetail(log)}
              activeOpacity={0.75}
            >
              <View style={s.logTop}>
                {/* acción */}
                <View style={[s.actionBadge, { backgroundColor: meta.bg }]}>
                  <Text style={[s.actionBadgeText, { color: meta.color }]}>
                    {meta.label}
                  </Text>
                </View>
                {/* colección */}
                <View style={s.colBadge}>
                  <Text style={s.colBadgeText}>
                    {COLLECTION_LABELS[log.targetCollection] ??
                      log.targetCollection}
                  </Text>
                </View>
                {/* fecha */}
                <Text style={s.logDate}>
                  {date
                    ? `${date.toLocaleDateString("es-MX")} ${date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`
                    : "—"}
                </Text>
              </View>

              <Text style={s.logUser} numberOfLines={1}>
                {log.userEmail}
              </Text>
              <Text style={s.logTarget} numberOfLines={1}>
                ID: {log.targetId}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Modal filtros ── */}
      <Modal
        visible={filterOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setFilterOpen(false)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            <Text style={s.modalTitle}>Filtrar logs</Text>

            <Text style={s.filterLabel}>Acción</Text>
            <View style={s.filterChips}>
              <TouchableOpacity
                style={[s.fChip, !filterAction && s.fChipActive]}
                onPress={() => setFilterAction("")}
              >
                <Text style={[s.fChipText, !filterAction && s.fChipTextActive]}>
                  Todas
                </Text>
              </TouchableOpacity>
              {ALL_ACTIONS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[s.fChip, filterAction === a && s.fChipActive]}
                  onPress={() => setFilterAction(a === filterAction ? "" : a)}
                >
                  <Text
                    style={[
                      s.fChipText,
                      filterAction === a && s.fChipTextActive,
                    ]}
                  >
                    {ACTION_META[a]?.label ?? a}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.filterLabel}>Colección</Text>
            <View style={s.filterChips}>
              {[
                ["", "Todas"],
                ["users", "Usuarios"],
                ["roles", "Roles"],
                ["screens", "Pantallas"],
              ].map(([val, label]) => (
                <TouchableOpacity
                  key={val}
                  style={[s.fChip, filterCol === val && s.fChipActive]}
                  onPress={() => setFilterCol(val)}
                >
                  <Text
                    style={[
                      s.fChipText,
                      filterCol === val && s.fChipTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => setFilterOpen(false)}
            >
              <Text style={s.closeBtnText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal detalle ── */}
      <Modal
        visible={!!detail}
        animationType="fade"
        transparent
        onRequestClose={() => setDetail(null)}
      >
        <View style={s.modalBackdrop}>
          <View style={s.modalSheet}>
            {detail &&
              (() => {
                const meta = ACTION_META[detail.action] ?? {
                  label: detail.action,
                  color: "#555",
                  bg: "#f3f4f6",
                };
                const date = detail.createdAt
                  ? new Date((detail.createdAt as any).seconds * 1000)
                  : null;
                return (
                  <>
                    <View style={s.detailHeader}>
                      <View
                        style={[s.actionBadge, { backgroundColor: meta.bg }]}
                      >
                        <Text
                          style={[s.actionBadgeText, { color: meta.color }]}
                        >
                          {meta.label}
                        </Text>
                      </View>
                      <Text style={s.detailDate}>
                        {date?.toLocaleString("es-MX") ?? "—"}
                      </Text>
                    </View>

                    <DetailRow label="Usuario" value={detail.userEmail} />
                    <DetailRow
                      label="Colección"
                      value={
                        COLLECTION_LABELS[detail.targetCollection] ??
                        detail.targetCollection
                      }
                    />
                    <DetailRow
                      label="ID afectado"
                      value={detail.targetId}
                      mono
                    />
                    <DetailRow label="Plataforma" value={detail.platform} />

                    {detail.oldValue && (
                      <View style={s.jsonBox}>
                        <Text style={s.jsonLabel}>Valor anterior</Text>
                        <Text style={s.jsonText}>
                          {JSON.stringify(detail.oldValue, null, 2)}
                        </Text>
                      </View>
                    )}
                    {detail.newValue && (
                      <View style={[s.jsonBox, { borderColor: "#6366f1" }]}>
                        <Text style={[s.jsonLabel, { color: "#6366f1" }]}>
                          Valor nuevo
                        </Text>
                        <Text style={s.jsonText}>
                          {JSON.stringify(detail.newValue, null, 2)}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={s.closeBtn}
                      onPress={() => setDetail(null)}
                    >
                      <Text style={s.closeBtnText}>Cerrar</Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── helpers ──────────────────────────────────────────────────────────────────
function buildQuery(
  action: string,
  col: string,
  after: QueryDocumentSnapshot<DocumentData> | null,
) {
  let q = query(
    collection(db, "logs"),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE),
  );
  if (action)
    q = query(
      collection(db, "logs"),
      where("action", "==", action),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
    );
  if (col)
    q = query(
      collection(db, "logs"),
      where("targetCollection", "==", col),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
    );
  if (action && col)
    q = query(
      collection(db, "logs"),
      where("action", "==", action),
      where("targetCollection", "==", col),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
    );
  if (after) q = query(q, startAfter(after));
  return q;
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={d.row}>
      <Text style={d.label}>{label}</Text>
      <Text style={[d.value, mono && d.mono]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const d = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  label: { fontSize: 13, color: "#888", flex: 1 },
  value: {
    fontSize: 13,
    color: "#222",
    fontWeight: "500",
    flex: 2,
    textAlign: "right",
  },
  mono: { fontFamily: "monospace", fontSize: 11 },
});

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
  subtitle: { fontSize: 12, color: "#999", marginTop: 2 },
  list: { padding: 16, gap: 10, paddingBottom: 40 },

  filterBtn: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterBtnActive: { borderColor: "#6366f1", backgroundColor: "#ede9fe" },
  filterBtnText: { fontSize: 13, color: "#555", fontWeight: "500" },
  filterBtnTextActive: { color: "#6366f1" },

  logCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  logTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  logUser: { fontSize: 13, fontWeight: "500", color: "#333", marginBottom: 2 },
  logTarget: { fontSize: 11, color: "#aaa", fontFamily: "monospace" },
  logDate: { fontSize: 11, color: "#bbb", marginLeft: "auto" },

  actionBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  actionBadgeText: { fontSize: 11, fontWeight: "600" },
  colBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  colBadgeText: { fontSize: 11, color: "#555" },

  empty: { alignItems: "center", paddingTop: 60 },
  emptyText: { color: "#bbb", fontSize: 14 },

  // modal compartido
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "88%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
  },

  // filtros
  filterLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 12,
    textTransform: "uppercase",
  },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  fChip: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  fChipActive: { backgroundColor: "#6366f1", borderColor: "#6366f1" },
  fChipText: { fontSize: 12, color: "#555" },
  fChipTextActive: { color: "#fff", fontWeight: "600" },

  // detalle
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  detailDate: { fontSize: 12, color: "#888" },
  jsonBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
  },
  jsonLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888",
    marginBottom: 4,
  },
  jsonText: {
    fontSize: 11,
    fontFamily: "monospace",
    color: "#333",
    lineHeight: 16,
  },

  closeBtn: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
    marginTop: 20,
  },
  closeBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
