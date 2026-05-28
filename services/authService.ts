import Constants from "expo-constants";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Platform } from "react-native";
import { auth, db } from "../lib/firebase";
import type { AppUser } from "../lib/types";
import { writeLog } from "./logService";

// ─── LOGIN ─────────────────────────────────────────────────────────────────────
export async function loginUser(
  email: string,
  password: string,
): Promise<void> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);

  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    const data = snap.data() as AppUser;
    if (data.isBlocked) {
      await signOut(auth);
      throw new Error("Tu cuenta está bloqueada. Contacta al administrador.");
    }
    if (!data.isActive) {
      await signOut(auth);
      throw new Error("Tu cuenta está desactivada.");
    }
    await updateDoc(doc(db, "users", user.uid), {
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await addDoc(collection(db, "sessions"), {
    userId: user.uid,
    loginAt: serverTimestamp(),
    logoutAt: null,
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version ?? "?",
    ipAddress: null,
    isActive: true,
    deviceInfo: `${Platform.OS} ${Platform.Version}`,
  });

  await writeLog({
    userId: user.uid,
    userEmail: user.email ?? "",
    action: "login",
    targetCollection: "users",
    targetId: user.uid,
  });
}

// ─── REGISTER ──────────────────────────────────────────────────────────────────
// Se escribe TODO en un único setDoc atómico (incluido el rol)
// para que cuando AuthContext dispare onSnapshot el documento
// ya esté completo y no haya una segunda escritura que llegue tarde.
export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  createdByUid: string,
  createdByEmail: string,
  initialRoleId?: string,           // ← rol inicial, opcional
): Promise<string> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);

  // updateProfile puede fallar silenciosamente en algunos entornos Expo;
  // el displayName canónico queda en Firestore, que es lo que usa la app.
  await updateProfile(user, { displayName }).catch(() => {});

  // Un único setDoc con todo incluido — después de este await el documento
  // existe en Firestore con el rol correcto antes de que onSnapshot lo lea.
  await setDoc(doc(db, "users", user.uid), {
    email,
    displayName,
    photoURL: null,
    isActive: true,
    isBlocked: false,
    isAdmin: false,
    roleIds: initialRoleId ? [initialRoleId] : [],
    permissionIds: [],
    lastLogin: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: user.uid,
  });

  await writeLog({
    userId: user.uid,
    userEmail: email,
    action: "create",
    targetCollection: "users",
    targetId: user.uid,
    newValue: { email, displayName, roleIds: initialRoleId ? [initialRoleId] : [] },
  });

  return user.uid;
}

// ─── LOGOUT ────────────────────────────────────────────────────────────────────
export async function logoutUser(
  uid: string,
  userEmail: string,
): Promise<void> {
  const q = query(
    collection(db, "sessions"),
    where("userId", "==", uid),
    where("isActive", "==", true),
  );
  const snap = await getDocs(q);
  await Promise.all(
    snap.docs.map((d) =>
      updateDoc(doc(db, "sessions", d.id), {
        logoutAt: serverTimestamp(),
        isActive: false,
      }),
    ),
  );

  await writeLog({
    userId: uid,
    userEmail,
    action: "logout",
    targetCollection: "users",
    targetId: uid,
  });

  await signOut(auth);
}
