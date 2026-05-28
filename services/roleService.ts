import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Role } from "../lib/types";
import { writeLog } from "./logService";

export function subscribeRoles(callback: (roles: Role[]) => void) {
  const q = query(collection(db, "roles"), orderBy("order", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Role));
  });
}

export async function createRole(
  data: {
    name: string;
    description: string;
    permissionIds: string[];
    order: number;
  },
  actorUid: string,
  actorEmail: string,
): Promise<string> {
  const ref = await addDoc(collection(db, "roles"), {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: actorUid,
    updatedBy: actorUid,
  });
  await writeLog({
    userId: actorUid,
    userEmail: actorEmail,
    action: "create",
    targetCollection: "roles",
    targetId: ref.id,
    newValue: data,
  });
  return ref.id;
}

export async function updateRole(
  roleId: string,
  data: Partial<{
    name: string;
    description: string;
    permissionIds: string[];
    isActive: boolean;
  }>,
  actorUid: string,
  actorEmail: string,
): Promise<void> {
  await updateDoc(doc(db, "roles", roleId), {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: actorUid,
  });
  await writeLog({
    userId: actorUid,
    userEmail: actorEmail,
    action: "update",
    targetCollection: "roles",
    targetId: roleId,
    newValue: data,
  });
}
