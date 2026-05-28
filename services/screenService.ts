import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { writeLog } from './logService';
import type { Screen } from '../lib/types';

// ─── GET ALL SCREENS (realtime) ────────────────────────────────────────────────
export function subscribeScreens(callback: (screens: Screen[]) => void) {
  const q = query(collection(db, 'screens'), orderBy('order', 'asc'));
  return onSnapshot(q, (snap) => {
    const screens = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Screen));
    callback(screens);
  });
}

// ─── RENAME SCREEN ─────────────────────────────────────────────────────────────
export async function renameScreen(
  screenId: string,
  newName: string,
  actorUid: string,
  actorEmail: string,
): Promise<void> {
  const ref = doc(db, 'screens', screenId);
  await updateDoc(ref, {
    displayName: newName,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  });

  await writeLog({
    userId: actorUid,
    userEmail: actorEmail,
    action: 'change_screen_name',
    targetCollection: 'screens',
    targetId: screenId,
    newValue: { displayName: newName },
  });
}

// ─── TOGGLE SCREEN ─────────────────────────────────────────────────────────────
export async function setScreenActive(
  screenId: string,
  isActive: boolean,
  actorUid: string,
  actorEmail: string,
): Promise<void> {
  const ref = doc(db, 'screens', screenId);
  await updateDoc(ref, {
    isActive,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  });

  await writeLog({
    userId: actorUid,
    userEmail: actorEmail,
    action: isActive ? 'enable_screen' : 'disable_screen',
    targetCollection: 'screens',
    targetId: screenId,
    newValue: { isActive },
  });
}

// ─── UPDATE SCREEN PERMISSIONS ─────────────────────────────────────────────────
export async function updateScreenPermissions(
  screenId: string,
  requiredPermissions: string[],
  actorUid: string,
  actorEmail: string,
): Promise<void> {
  const ref = doc(db, 'screens', screenId);
  await updateDoc(ref, {
    requiredPermissions,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  });

  await writeLog({
    userId: actorUid,
    userEmail: actorEmail,
    action: 'update',
    targetCollection: 'screens',
    targetId: screenId,
    newValue: { requiredPermissions },
  });
}
