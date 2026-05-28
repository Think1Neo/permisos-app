/**
 * SEED SCRIPT — ejecutar una sola vez con Node.js para inicializar Firestore.
 * Requiere: firebase-admin y GOOGLE_APPLICATION_CREDENTIALS apuntando a
 * tu archivo de service account.
 *
 * Uso:
 *   npm install firebase-admin
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node seed.js
 */

const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function seed() {
  const now = admin.firestore.FieldValue.serverTimestamp();

  // ── PERMISSIONS ─────────────────────────────────────────────────────────────
  const permissions = [
    { id: 'perm_read_users',    key: 'read:users',    name: 'Ver usuarios',        category: 'users',       description: 'Ver la lista de usuarios' },
    { id: 'perm_manage_users',  key: 'manage:users',  name: 'Gestionar usuarios',  category: 'users',       description: 'Crear, editar, bloquear usuarios' },
    { id: 'perm_read_roles',    key: 'read:roles',    name: 'Ver roles',           category: 'roles',       description: 'Ver los roles del sistema' },
    { id: 'perm_manage_roles',  key: 'manage:roles',  name: 'Gestionar roles',     category: 'roles',       description: 'Crear y editar roles' },
    { id: 'perm_manage_screens',key: 'manage:screens',name: 'Gestionar pantallas', category: 'screens',     description: 'Activar/desactivar y renombrar pantallas' },
    { id: 'perm_view_logs',     key: 'read:logs',     name: 'Ver logs',            category: 'audit',       description: 'Ver el registro de auditoría' },
    { id: 'perm_manage_config', key: 'manage:config', name: 'Configuración app',   category: 'config',      description: 'Editar configuración general de la app' },
  ];

  for (const p of permissions) {
    const { id, ...data } = p;
    await db.collection('permissions').doc(id).set({
      ...data, isActive: true, createdAt: now, updatedAt: now, createdBy: 'seed', updatedBy: 'seed',
    });
    console.log('✓ permission', id);
  }

  // ── ROLES ────────────────────────────────────────────────────────────────────
  const roles = [
    {
      id: 'role_admin',
      name: 'Administrador',
      description: 'Acceso total al sistema',
      permissionIds: permissions.map((p) => p.id),
      order: 0,
    },
    {
      id: 'role_manager',
      name: 'Gerente',
      description: 'Gestión de usuarios y pantallas',
      permissionIds: ['perm_read_users', 'perm_manage_users', 'perm_read_roles', 'perm_manage_screens'],
      order: 1,
    },
    {
      id: 'role_viewer',
      name: 'Visualizador',
      description: 'Solo lectura',
      permissionIds: ['perm_read_users', 'perm_read_roles'],
      order: 2,
    },
  ];

  for (const r of roles) {
    const { id, ...data } = r;
    await db.collection('roles').doc(id).set({
      ...data, isActive: true, createdAt: now, updatedAt: now, createdBy: 'seed', updatedBy: 'seed',
    });
    console.log('✓ role', id);
  }

  // ── SCREENS ──────────────────────────────────────────────────────────────────
  const screens = [
    { id: 'screen_home',    routePath: '(tabs)/index',   displayName: 'Inicio',    requiredPermissions: [],                    order: 0 },
    { id: 'screen_profile', routePath: '(tabs)/profile', displayName: 'Perfil',    requiredPermissions: [],                    order: 1 },
    { id: 'screen_users',   routePath: 'pantallas/usuarios',  displayName: 'Usuarios',  requiredPermissions: ['read:users'],        order: 2 },
    { id: 'screen_roles',   routePath: 'pantallas/roles',     displayName: 'Roles',     requiredPermissions: ['read:roles'],        order: 3 },
    { id: 'screen_screens', routePath: 'pantallas/pantallas', displayName: 'Pantallas', requiredPermissions: ['manage:screens'],    order: 4 },
    { id: 'screen_logs',    routePath: 'pantallas/logs',      displayName: 'Auditoría', requiredPermissions: ['read:logs'],         order: 5 },
  ];

  for (const s of screens) {
    const { id, ...data } = s;
    await db.collection('screens').doc(id).set({
      ...data, isActive: true, icon: null, parentScreenId: null,
      createdAt: now, updatedAt: now, updatedBy: 'seed',
    });
    console.log('✓ screen', id);
  }

  // ── APP CONFIG ───────────────────────────────────────────────────────────────
  await db.collection('app_config').doc('app_name').set({
    value: 'Mi App',
    description: 'Nombre de la aplicación',
    isPublic: true,
    updatedAt: now,
    updatedBy: 'seed',
  });

  await db.collection('app_config').doc('maintenance_mode').set({
    value: false,
    description: 'Modo mantenimiento — bloquea el acceso a todos los usuarios',
    isPublic: false,
    updatedAt: now,
    updatedBy: 'seed',
  });

  console.log('\n✅ Seed completado.');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
