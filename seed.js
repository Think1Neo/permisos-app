/**
 * Agrega esto al final de tu seed.js ANTES del process.exit(0)
 * — o corre este archivo por separado con el mismo comando.
 *
 * GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node seed.js
 */

const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

async function seedSystemMaster() {
  const now = admin.firestore.FieldValue.serverTimestamp();

  // 1. Permiso exclusivo del system master
  await db.collection("permissions").doc("perm_system_master").set({
    key: "system:master",
    name: "System Master",
    category: "system",
    description:
      "Acceso total al sistema incluyendo creación y edición de colecciones base",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: "seed",
    updatedBy: "seed",
  });
  console.log("✓ permission perm_system_master");

  // 2. Rol system master — tiene TODOS los permisos existentes + el propio
  const permsSnap = await db.collection("permissions").get();
  const allPermIds = permsSnap.docs.map((d) => d.id);

  await db.collection("roles").doc("role_system_master").set({
    name: "System Master",
    description:
      "Rol de sistema — puede crear, editar y configurar todas las colecciones base",
    permissionIds: allPermIds, // todos los permisos
    order: -1, // aparece primero
    isActive: true,
    createdAt: now,
    updatedAt: now,
    createdBy: "seed",
    updatedBy: "seed",
  });
  console.log("✓ role role_system_master");

  // 3. Pantalla system master (solo visible para este rol)
  await db
    .collection("screens")
    .doc("screen_system_master")
    .set({
      routePath: "pantallas/system-master",
      displayName: "System Master",
      requiredPermissions: ["system:master"],
      order: -1,
      isActive: true,
      icon: null,
      parentScreenId: null,
      createdAt: now,
      updatedAt: now,
      updatedBy: "seed",
    });
  console.log("✓ screen screen_system_master");

  console.log("\n✅ System Master seed completado.");
  console.log(
    "\n⚠️  Asigna role_system_master al usuario admin desde Firebase Console:\n" +
      "   Firestore → users → {uid} → roleIds → agrega 'role_system_master'",
  );
  process.exit(0);
}

seedSystemMaster().catch((err) => {
  console.error(err);
  process.exit(1);
});
