/**
 * app/pantallas/system-master.tsx
 *
 * Guard: hasPermission('system:master')
 * Secciones expandibles: Permisos · Roles · Pantallas · Configuración
 * Operaciones: Crear documento nuevo · Editar documento existente
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, TextInput, Switch, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  collection, doc, getDocs, setDoc, updateDoc,
  serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { db }      from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';

// ─────────────────────────────────────────────────────────────
//  Tipos — alineados al schema del seed
// ─────────────────────────────────────────────────────────────
interface PermDoc {
  id: string; key: string; name: string;
  category: string; description: string; isActive: boolean;
}
interface RoleDoc {
  id: string; name: string; description: string;
  permissionIds: string[]; order: number; isActive: boolean;
}
interface ScreenDoc {
  id: string; routePath: string; displayName: string;
  requiredPermissions: string[]; order: number;
  isActive: boolean; icon: string | null;
}
interface ConfigDoc {
  id: string; value: string | boolean; description: string; isPublic: boolean;
}

type ColKey = 'permissions' | 'roles' | 'screens' | 'app_config';

interface DataState {
  permissions: PermDoc[];
  roles:       RoleDoc[];
  screens:     ScreenDoc[];
  app_config:  ConfigDoc[];
}

// ─────────────────────────────────────────────────────────────
//  Constantes
// ─────────────────────────────────────────────────────────────
const COL_LABEL: Record<ColKey, string> = {
  permissions: 'Permisos',
  roles:       'Roles',
  screens:     'Pantallas',
  app_config:  'Configuración',
};
const COL_EMOJI: Record<ColKey, string> = {
  permissions: '🔑',
  roles:       '🛡️',
  screens:     '📱',
  app_config:  '⚙️',
};

function newDoc(col: ColKey): any {
  switch (col) {
    case 'permissions': return { id:'', key:'', name:'', category:'', description:'', isActive:true };
    case 'roles':       return { id:'', name:'', description:'', permissionIds:[], order:99, isActive:true };
    case 'screens':     return { id:'', routePath:'', displayName:'', requiredPermissions:[], order:99, isActive:true, icon:null };
    case 'app_config':  return { id:'', value:'', description:'', isPublic:false };
  }
}

// ─────────────────────────────────────────────────────────────
//  Pantalla principal
// ─────────────────────────────────────────────────────────────
export default function SystemMasterScreen() {
  const { hasPermission, appUser } = useAuth();
  const router = useRouter();

  // Guard: solo quien tenga system:master
  useEffect(() => {
    if (appUser !== null && !hasPermission('system:master')) {
      Alert.alert('Acceso denegado', 'No tienes permiso para esta pantalla.');
      router.replace('/(tabs)');
    }
  }, [appUser, hasPermission]);

  const [data, setData]         = useState<DataState>({ permissions:[], roles:[], screens:[], app_config:[] });
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<ColKey | null>(null);
  const [modal, setModal]       = useState<{ col: ColKey; doc: any } | null>(null);

  const fetchAll = useCallback(async () => {
    const [ps, rs, scs, cfs] = await Promise.all([
      getDocs(collection(db, 'permissions')),
      getDocs(query(collection(db, 'roles'),   orderBy('order'))),
      getDocs(query(collection(db, 'screens'), orderBy('order'))),
      getDocs(collection(db, 'app_config')),
    ]);
    setData({
      permissions: ps.docs.map(d  => ({ id: d.id, ...d.data() } as PermDoc)),
      roles:       rs.docs.map(d  => ({ id: d.id, ...d.data() } as RoleDoc)),
      screens:     scs.docs.map(d => ({ id: d.id, ...d.data() } as ScreenDoc)),
      app_config:  cfs.docs.map(d => ({ id: d.id, ...d.data() } as ConfigDoc)),
    });
  }, []);

  useEffect(() => { fetchAll().finally(() => setLoading(false)); }, []);

  async function handleSave(col: ColKey, edited: any) {
    const { id, ...fields } = edited;
    if (!id.trim()) {
      Alert.alert('El ID del documento no puede estar vacío.');
      return;
    }

    const ref    = doc(db, col, id.trim());
    const exists = data[col].some((d: any) => d.id === id.trim());
    const base   = {
      ...fields,
      updatedAt: serverTimestamp(),
      updatedBy: appUser?.uid ?? 'system_master',
      ...(exists ? {} : {
        createdAt: serverTimestamp(),
        createdBy: appUser?.uid ?? 'system_master',
      }),
    };

    await (exists ? updateDoc(ref, base) : setDoc(ref, base));
    setModal(null);
    setLoading(true);
    await fetchAll();
    setLoading(false);
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#7C3AED" /></View>;
  }

  return (
    <>
      <Stack.Screen options={{ title: 'System Master', headerTintColor: '#7C3AED' }} />

      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.banner}>
          <Text style={s.bannerTxt}>⚡ System Master</Text>
          <Text style={s.bannerSub}>Gestión directa de colecciones base de Firestore</Text>
        </View>

        {(Object.keys(COL_LABEL) as ColKey[]).map(col => (
          <Section
            key={col}
            col={col}
            items={data[col]}
            expanded={expanded === col}
            onToggle={() => setExpanded(prev => prev === col ? null : col)}
            onEdit={item => setModal({ col, doc: { ...item } })}
            onNew={() => setModal({ col, doc: newDoc(col) })}
          />
        ))}
      </ScrollView>

      {modal && (
        <EditModal
          col={modal.col}
          initial={modal.doc}
          allPerms={data.permissions}
          isNew={!data[modal.col].some((d: any) => d.id === modal.doc.id)}
          onSave={edited => handleSave(modal.col, edited)}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  Sección expandible
// ─────────────────────────────────────────────────────────────
function Section({ col, items, expanded, onToggle, onEdit, onNew }: {
  col: ColKey; items: any[]; expanded: boolean;
  onToggle: () => void; onEdit: (i: any) => void; onNew: () => void;
}) {
  return (
    <View style={s.section}>
      <TouchableOpacity style={s.secHeader} onPress={onToggle} activeOpacity={0.7}>
        <Text style={s.secEmoji}>{COL_EMOJI[col]}</Text>
        <View style={s.secMeta}>
          <Text style={s.secTitle}>{COL_LABEL[col]}</Text>
          <Text style={s.secCount}>{items.length} documento{items.length !== 1 ? 's' : ''}</Text>
        </View>
        <Text style={s.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={s.secBody}>
          <TouchableOpacity style={s.newBtn} onPress={onNew}>
            <Text style={s.newBtnTxt}>+ Nuevo documento</Text>
          </TouchableOpacity>

          {items.map(item => (
            <TouchableOpacity
              key={item.id}
              style={s.docRow}
              onPress={() => onEdit(item)}
              activeOpacity={0.7}
            >
              <View style={s.docLeft}>
                <Text style={s.docId}>{item.id}</Text>
                <Text style={s.docName} numberOfLines={1}>
                  {item.name ?? item.displayName ?? String(item.value) ?? '—'}
                </Text>
              </View>
              <View style={[s.activeDot, { backgroundColor: item.isActive === false ? '#E5E7EB' : '#86EFAC' }]} />
              <Text style={s.editLbl}>Editar ›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  Modal edición / creación
// ─────────────────────────────────────────────────────────────
function EditModal({ col, initial, allPerms, isNew, onSave, onClose }: {
  col: ColKey; initial: any; allPerms: PermDoc[];
  isNew: boolean; onSave: (d: any) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<any>({ ...initial });

  function set(key: string, val: any) {
    setForm((prev: any) => ({ ...prev, [key]: val }));
  }

  function toggleArr(key: string, val: string) {
    setForm((prev: any) => {
      const arr: string[] = prev[key] ?? [];
      return { ...prev, [key]: arr.includes(val) ? arr.filter((x: string) => x !== val) : [...arr, val] };
    });
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={s.modal}>

          <View style={s.modalHead}>
            <TouchableOpacity onPress={onClose} style={s.modalCancel}>
              <Text style={s.cancelTxt}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={s.modalTitle}>{isNew ? 'Nuevo' : 'Editar'} · {COL_LABEL[col]}</Text>
            <TouchableOpacity onPress={() => onSave(form)} style={s.modalSave}>
              <Text style={s.saveTxt}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={s.formScroll} keyboardShouldPersistTaps="handled">

            {/* ID */}
            <Field label="ID del documento (doc ID en Firestore)">
              <TextInput
                style={[s.input, !isNew && s.inputDisabled]}
                value={form.id}
                onChangeText={v => set('id', v.trim())}
                placeholder="ej: perm_nueva"
                autoCapitalize="none"
                editable={isNew}
              />
              {!isNew && <Text style={s.hint}>El ID no se puede cambiar en documentos existentes.</Text>}
            </Field>

            {/* ── PERMISSIONS ── */}
            {col === 'permissions' && <>
              <Field label="key — clave técnica">
                <TextInput style={s.input} value={form.key} onChangeText={v=>set('key',v)} placeholder="ej: read:usuarios" autoCapitalize="none"/>
              </Field>
              <Field label="name — nombre visible">
                <TextInput style={s.input} value={form.name} onChangeText={v=>set('name',v)} placeholder="Ver usuarios"/>
              </Field>
              <Field label="category">
                <TextInput style={s.input} value={form.category} onChangeText={v=>set('category',v)} placeholder="users · roles · screens · audit · system"/>
              </Field>
              <Field label="description">
                <TextInput style={[s.input,s.textarea]} value={form.description} onChangeText={v=>set('description',v)} multiline placeholder="Descripción del permiso"/>
              </Field>
              <Field label="isActive">
                <SwitchRow value={form.isActive} onChange={v=>set('isActive',v)} label={form.isActive?'Activo':'Inactivo'}/>
              </Field>
            </>}

            {/* ── ROLES ── */}
            {col === 'roles' && <>
              <Field label="name">
                <TextInput style={s.input} value={form.name} onChangeText={v=>set('name',v)} placeholder="Nombre del rol"/>
              </Field>
              <Field label="description">
                <TextInput style={[s.input,s.textarea]} value={form.description} onChangeText={v=>set('description',v)} multiline placeholder="Descripción"/>
              </Field>
              <Field label="order">
                <TextInput style={s.input} value={String(form.order)} onChangeText={v=>set('order',parseInt(v)||0)} keyboardType="numeric"/>
              </Field>
              <Field label="isActive">
                <SwitchRow value={form.isActive} onChange={v=>set('isActive',v)} label={form.isActive?'Activo':'Inactivo'}/>
              </Field>
              <Field label={`permissionIds — ${form.permissionIds?.length ?? 0} seleccionados`}>
                <CheckList
                  options={allPerms.map(p=>({ value:p.id, label:`${p.name}  ·  ${p.key}` }))}
                  selected={form.permissionIds??[]}
                  onToggle={v=>toggleArr('permissionIds',v)}
                />
              </Field>
            </>}

            {/* ── SCREENS ── */}
            {col === 'screens' && <>
              <Field label="displayName — nombre visible">
                <TextInput style={s.input} value={form.displayName} onChangeText={v=>set('displayName',v)} placeholder="Usuarios"/>
              </Field>
              <Field label="routePath — ruta Expo Router">
                <TextInput style={s.input} value={form.routePath} onChangeText={v=>set('routePath',v)} placeholder="pantallas/usuarios" autoCapitalize="none"/>
              </Field>
              <Field label="order">
                <TextInput style={s.input} value={String(form.order)} onChangeText={v=>set('order',parseInt(v)||0)} keyboardType="numeric"/>
              </Field>
              <Field label="icon (nombre Ionicons, opcional)">
                <TextInput style={s.input} value={form.icon??''} onChangeText={v=>set('icon',v||null)} placeholder="person-outline"/>
              </Field>
              <Field label="isActive">
                <SwitchRow value={form.isActive} onChange={v=>set('isActive',v)} label={form.isActive?'Activa':'Inactiva'}/>
              </Field>
              <Field label={`requiredPermissions — ${form.requiredPermissions?.length??0} seleccionadas`}>
                <CheckList
                  options={allPerms.map(p=>({ value:p.key, label:`${p.key}  ·  ${p.name}` }))}
                  selected={form.requiredPermissions??[]}
                  onToggle={v=>toggleArr('requiredPermissions',v)}
                />
              </Field>
            </>}

            {/* ── APP CONFIG ── */}
            {col === 'app_config' && <>
              <Field label="description">
                <TextInput style={[s.input,s.textarea]} value={form.description} onChangeText={v=>set('description',v)} multiline placeholder="Descripción del parámetro"/>
              </Field>
              <Field label="value">
                {typeof form.value === 'boolean'
                  ? <SwitchRow value={form.value} onChange={v=>set('value',v)} label={form.value?'true (activado)':'false (desactivado)'}/>
                  : <TextInput style={s.input} value={String(form.value)} onChangeText={v=>set('value',v)} placeholder="Valor"/>
                }
                <TouchableOpacity onPress={()=>set('value', typeof form.value==='boolean' ? '' : false)} style={s.typeToggle}>
                  <Text style={s.typeToggleTxt}>
                    Cambiar tipo → {typeof form.value==='boolean' ? 'texto' : 'booleano'}
                  </Text>
                </TouchableOpacity>
              </Field>
              <Field label="isPublic">
                <SwitchRow value={form.isPublic} onChange={v=>set('isPublic',v)} label={form.isPublic?'Público':'Privado'}/>
              </Field>
            </>}

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
//  Sub-componentes
// ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SwitchRow({ value, onChange, label }: { value: boolean; onChange: (v:boolean)=>void; label: string }) {
  return (
    <View style={s.switchRow}>
      <Switch
        value={value} onValueChange={onChange}
        trackColor={{ false:'#E5E7EB', true:'#DDD6FE' }}
        thumbColor={value?'#7C3AED':'#9CA3AF'}
      />
      <Text style={s.switchLabel}>{label}</Text>
    </View>
  );
}

function CheckList({ options, selected, onToggle }: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <View style={s.checklist}>
      {options.map(opt => {
        const checked = selected.includes(opt.value);
        return (
          <TouchableOpacity
            key={opt.value}
            style={[s.checkItem, checked && s.checkItemOn]}
            onPress={() => onToggle(opt.value)}
            activeOpacity={0.7}
          >
            <View style={[s.checkbox, checked && s.checkboxOn]}>
              {checked && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={[s.checkLabel, checked && s.checkLabelOn]} numberOfLines={2}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
//  Estilos
// ─────────────────────────────────────────────────────────────
const PRP       = '#7C3AED';
const PRP_LIGHT = '#EDE9FE';

const s = StyleSheet.create({
  center:      { flex:1, alignItems:'center', justifyContent:'center' },
  scroll:      { padding:16, gap:10, paddingBottom:40 },
  banner:      { backgroundColor:PRP, borderRadius:14, padding:18, marginBottom:4 },
  bannerTxt:   { fontSize:20, fontWeight:'800', color:'#FFF' },
  bannerSub:   { fontSize:12, color:'#C4B5FD', marginTop:4 },
  section: {
    backgroundColor:'#FFF', borderRadius:14,
    shadowColor:'#000', shadowOpacity:0.05, shadowRadius:6, elevation:2, overflow:'hidden',
  },
  secHeader:   { flexDirection:'row', alignItems:'center', padding:16, gap:10 },
  secEmoji:    { fontSize:22 },
  secMeta:     { flex:1 },
  secTitle:    { fontSize:15, fontWeight:'600', color:'#1A1D23' },
  secCount:    { fontSize:12, color:'#9BA1B0', marginTop:1 },
  chevron:     { fontSize:12, color:'#9BA1B0' },
  secBody:     { borderTopWidth:1, borderTopColor:'#F3F4F6', padding:12, gap:8 },
  newBtn:      { borderWidth:1.5, borderStyle:'dashed', borderColor:PRP, borderRadius:10, padding:12, alignItems:'center' },
  newBtnTxt:   { fontSize:14, color:PRP, fontWeight:'600' },
  docRow: {
    flexDirection:'row', alignItems:'center',
    padding:12, backgroundColor:'#F9FAFB', borderRadius:10, gap:8,
  },
  docLeft:     { flex:1 },
  docId:       { fontSize:11, color:'#9BA1B0', fontFamily:'monospace' },
  docName:     { fontSize:13, fontWeight:'500', color:'#1A1D23', marginTop:1 },
  activeDot:   { width:8, height:8, borderRadius:4 },
  editLbl:     { fontSize:12, color:PRP, fontWeight:'500' },
  modal:       { flex:1, backgroundColor:'#FFF' },
  modalHead: {
    flexDirection:'row', alignItems:'center', justifyContent:'space-between',
    padding:16, borderBottomWidth:1, borderBottomColor:'#F3F4F6',
  },
  modalTitle:  { fontSize:15, fontWeight:'600', color:'#1A1D23' },
  modalCancel: { padding:4 },
  cancelTxt:   { fontSize:14, color:'#6B7280' },
  modalSave:   { backgroundColor:PRP, borderRadius:8, paddingHorizontal:14, paddingVertical:7 },
  saveTxt:     { fontSize:14, fontWeight:'600', color:'#FFF' },
  formScroll:  { padding:20, gap:4, paddingBottom:60 },
  field:       { marginBottom:16 },
  fieldLabel: {
    fontSize:12, fontWeight:'600', color:'#6B7280',
    textTransform:'uppercase', letterSpacing:0.5, marginBottom:6,
  },
  input: {
    borderWidth:1, borderColor:'#E5E7EB', borderRadius:10,
    padding:12, fontSize:14, color:'#1A1D23', backgroundColor:'#FFF',
  },
  inputDisabled: { backgroundColor:'#F9FAFB', color:'#9CA3AF' },
  textarea:    { minHeight:72, textAlignVertical:'top' },
  hint:        { fontSize:11, color:'#9BA1B0', marginTop:4 },
  switchRow:   { flexDirection:'row', alignItems:'center', gap:10 },
  switchLabel: { fontSize:14, color:'#374151' },
  checklist:   { gap:6, marginTop:4 },
  checkItem: {
    flexDirection:'row', alignItems:'center', gap:10,
    padding:10, borderRadius:8, borderWidth:1, borderColor:'#E5E7EB', backgroundColor:'#FFF',
  },
  checkItemOn:  { borderColor:PRP, backgroundColor:PRP_LIGHT },
  checkbox:     { width:20, height:20, borderRadius:5, borderWidth:2, borderColor:'#D1D5DB', alignItems:'center', justifyContent:'center' },
  checkboxOn:   { borderColor:PRP, backgroundColor:PRP },
  checkmark:    { fontSize:11, color:'#FFF', fontWeight:'700' },
  checkLabel:   { flex:1, fontSize:12, color:'#6B7280', fontFamily:'monospace' },
  checkLabelOn: { color:PRP, fontWeight:'500' },
  typeToggle:   { marginTop:6, alignSelf:'flex-start' },
  typeToggleTxt:{ fontSize:12, color:PRP, textDecorationLine:'underline' },
});
