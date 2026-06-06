import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { writeLog } from './logService';
import type { AppUser } from '../lib/types';

// ─── HELPERS ───────────────────────────────────────────────────────────────────

// Resuelve todos los permission keys de un usuario dado sus roleIds y permissionIds directos.
// Se guarda en el doc para que Firestore Rules pueda leerlo sin joins.
async function resolvePermissionKeys(
  roleIds: string[],
  directPermIds: string[],
): Promise<string[]> {
  const allPermIds = [...directPermIds];

  if (roleIds.length > 0) {
    const chunks = chunkArray(roleIds, 10);
    for (const chunk of chunks) {
      const snap = await getDocs(
        query(
          collection(db, 'roles'),
          where('__name__', 'in', chunk),
          where('isActive', '==', true),
        ),
      );
      snap.docs.forEach((d) => {
        const permIds = (d.data().permissionIds ?? []) as string[];
        allPermIds.push(...permIds);
      });
    }
  }

  const uniquePermIds = [...new Set(allPermIds)];
  const keys: string[] = [];

  if (uniquePermIds.length > 0) {
    const chunks = chunkArray(uniquePermIds, 10);
    for (const chunk of chunks) {
      const snap = await getDocs(
        query(
          collection(db, 'permissions'),
          where('__name__', 'in', chunk),
          where('isActive', '==', true),
        ),
      );
      snap.docs.forEach((d) => {
        const key = d.data().key as string;
        if (key) keys.push(key);
      });
    }
  }

  return [...new Set(keys)];
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

// ─── GET ALL USERS ─────────────────────────────────────────────────────────────
export async function getAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser));
}

// ─── BLOCK / UNBLOCK ──────────────────────────────────────────────────────────
export async function setUserBlocked(
  targetUid: string,
  blocked: boolean,
  actorUid: string,
  actorEmail: string,
): Promise<void> {
  const ref = doc(db, 'users', targetUid);
  const snap = await getDoc(ref);
  const old = snap.data();

  await updateDoc(ref, {
    isBlocked: blocked,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  });

  await writeLog({
    userId: actorUid,
    userEmail: actorEmail,
    action: blocked ? 'block_user' : 'unblock_user',
    targetCollection: 'users',
    targetId: targetUid,
    oldValue: { isBlocked: old?.isBlocked },
    newValue: { isBlocked: blocked },
  });
}

// ─── ASSIGN / REMOVE ROLE ──────────────────────────────────────────────────────
export async function updateUserRoles(
  targetUid: string,
  newRoleIds: string[],
  actorUid: string,
  actorEmail: string,
): Promise<void> {
  const ref = doc(db, 'users', targetUid);
  const snap = await getDoc(ref);
  const old = snap.data();

  const directPermIds = (old?.permissionIds ?? []) as string[];
  const resolvedPermissionKeys = await resolvePermissionKeys(newRoleIds, directPermIds);

  await updateDoc(ref, {
    roleIds: newRoleIds,
    resolvedPermissionKeys,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  });

  await writeLog({
    userId: actorUid,
    userEmail: actorEmail,
    action: 'assign_role',
    targetCollection: 'users',
    targetId: targetUid,
    oldValue: { roleIds: old?.roleIds },
    newValue: { roleIds: newRoleIds, resolvedPermissionKeys },
  });
}

// ─── ASSIGN / REMOVE DIRECT PERMISSIONS ───────────────────────────────────────
export async function updateUserPermissions(
  targetUid: string,
  newPermIds: string[],
  actorUid: string,
  actorEmail: string,
): Promise<void> {
  const ref = doc(db, 'users', targetUid);
  const snap = await getDoc(ref);
  const old = snap.data();

  const roleIds = (old?.roleIds ?? []) as string[];
  const resolvedPermissionKeys = await resolvePermissionKeys(roleIds, newPermIds);

  await updateDoc(ref, {
    permissionIds: newPermIds,
    resolvedPermissionKeys,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  });

  await writeLog({
    userId: actorUid,
    userEmail: actorEmail,
    action: 'assign_permission',
    targetCollection: 'users',
    targetId: targetUid,
    oldValue: { permissionIds: old?.permissionIds },
    newValue: { permissionIds: newPermIds, resolvedPermissionKeys },
  });
}
