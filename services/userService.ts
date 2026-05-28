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

  await updateDoc(ref, {
    roleIds: newRoleIds,
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
    newValue: { roleIds: newRoleIds },
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

  await updateDoc(ref, {
    permissionIds: newPermIds,
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
    newValue: { permissionIds: newPermIds },
  });
}
