import Constants from "expo-constants";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Platform } from "react-native";
import { auth, db } from "../lib/firebase";
import type { LogAction } from "../lib/types";

interface LogParams {
  userId: string;
  userEmail: string;
  action: LogAction;
  targetCollection: string;
  targetId: string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
}

export async function writeLog(params: LogParams): Promise<void> {
  // Si no hay sesión activa de Firebase no intentamos escribir el log
  // (evita el error permission-denied durante el auto-registro)
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    await addDoc(collection(db, "logs"), {
      // Siempre usamos el UID real de Firebase Auth, no el que viene en params
      // para garantizar que coincida con la regla request.auth.uid
      userId: currentUser.uid,
      userEmail: params.userEmail || currentUser.email || "",
      action: params.action,
      targetCollection: params.targetCollection,
      targetId: params.targetId,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
      createdAt: serverTimestamp(),
      ipAddress: null,
      platform: `${Platform.OS} / Expo ${Constants.expoConfig?.version ?? "?"}`,
    });
  } catch (err) {
    console.error("[writeLog]", err);
  }
}
