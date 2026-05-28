import Card from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import type { Role } from "@/lib/types";
import { registerUser } from "@/services/authService";
import { router } from "expo-router";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

export default function Register() {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(() => {
    async function loadRoles() {
      try {
        const snap = await getDocs(
          query(
            collection(db, "roles"),
            where("isActive", "==", true),
            orderBy("order", "asc"),
          ),
        );
        setRoleOptions(
          snap.docs.map((d) => {
            const role = d.data() as Role;
            return { label: role.name, value: d.id };
          }),
        );
      } catch (e) {
        console.warn("[Register] no se pudieron cargar roles:", e);
      }
    }
    loadRoles();
  }, []);

  async function handleRegister(values: Record<string, string>) {
    const { email, password, name, role } = values;

    if (!email.trim() || !password || !name.trim()) {
      Alert.alert("Campos requeridos", "Completa nombre, correo y contraseña.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Contraseña débil", "Mínimo 6 caracteres.");
      return;
    }
    if (!role) {
      Alert.alert("Rol requerido", "Selecciona un rol para continuar.");
      return;
    }

    const actorUid = appUser?.uid ?? "self-register";
    const actorEmail = appUser?.email ?? email.trim().toLowerCase();

    setLoading(true);
    try {
      // El rol se escribe directamente en el setDoc inicial dentro de registerUser.
      // Ya NO se llama updateUserRoles después — eso causaba el alert de error
      // porque el nuevo usuario no tiene permisos para hacerse updateDoc a sí mismo.
      await registerUser(
        email.trim().toLowerCase(),
        password,
        name.trim(),
        actorUid,
        actorEmail,
        role,                  // ← rol incluido desde el primer setDoc
      );

      Alert.alert("Cuenta creada", "Ya puedes iniciar sesión.", [
        { text: "Ir al login", onPress: () => router.replace("/login/login") },
      ]);
    } catch (err: any) {
      Alert.alert("Error al registrarse", friendlyError(err.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      )}

      <Card
        title="Crear cuenta"
        subtitle="Regístrate para empezar…"
        fields={[
          { key: "name", label: "Nombre completo", placeholder: "" },
          {
            key: "email",
            label: "Email",
            placeholder: "",
            keyboardType: "email-address",
          },
          {
            key: "password",
            label: "Contraseña",
            placeholder: "",
            secureTextEntry: true,
          },
        ]}
        selects={
          roleOptions.length > 0
            ? [
                {
                  key: "role",
                  label: "Rol",
                  placeholder: "Elige tu rol…",
                  options: roleOptions,
                },
              ]
            : []
        }
        primaryButton={{
          label: loading ? "Creando cuenta…" : "Registrarse",
          onPress: handleRegister,
        }}
        secondaryButton={{
          label: "¿Ya tienes una cuenta?",
          onPress: () => router.push("/login/login"),
        }}
        theme={{ primaryBackground: "#6366f1", cardBorderRadius: 20 }}
      />
    </View>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes("email-already-in-use"))
    return "Ya existe una cuenta con ese correo.";
  if (msg.includes("invalid-email"))
    return "El formato del correo no es válido.";
  if (msg.includes("weak-password")) return "La contraseña es demasiado débil.";
  if (msg.includes("network-request-failed")) return "Sin conexión a internet.";
  return "Ocurrió un error. Intenta de nuevo.";
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
    zIndex: 10,
  },
});
