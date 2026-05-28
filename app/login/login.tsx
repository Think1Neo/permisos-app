import Card from "@/components/ui/card";
import { loginUser } from "@/services/authService";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

export default function Login() {
  const [loading, setLoading] = useState(false);

  async function handleLogin(values: Record<string, string>) {
    const { email, password } = values;

    if (!email.trim() || !password) {
      Alert.alert("Campos requeridos", "Ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    try {
      await loginUser(email.trim().toLowerCase(), password);
      // AuthContext + useAuthRedirect se encargan de redirigir a (tabs)
    } catch (err: any) {
      Alert.alert("Error al iniciar sesión", friendlyError(err.message));
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
        title="Iniciar sesión"
        subtitle="Inicia sesión para continuar…"
        fields={[
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
        primaryButton={{
          label: loading ? "Entrando…" : "Iniciar sesión",
          onPress: handleLogin,
        }}
        secondaryButton={{
          label: "¿No tienes una cuenta?",
          onPress: () => router.push("/login/register"),
        }}
        theme={{ primaryBackground: "#6366f1", cardBorderRadius: 20 }}
      />
    </View>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes("invalid-credential") || msg.includes("wrong-password"))
    return "Correo o contraseña incorrectos.";
  if (msg.includes("user-not-found"))
    return "No existe una cuenta con ese correo.";
  if (msg.includes("too-many-requests"))
    return "Demasiados intentos. Espera unos minutos.";
  if (msg.includes("network-request-failed")) return "Sin conexión a internet.";
  if (msg.includes("bloqueada") || msg.includes("desactivada")) return msg;
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
/*
import Card from "@/components/ui/card";
import { router } from "expo-router";
import { View } from "react-native";

export default function Login() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Card
        title="Iniciar sesión"
        subtitle="Inicia sesión para continuar…"
        fields={[
          { key: "email", label: "Email", keyboardType: "email-address" },
          { key: "password", label: "Contraseña", secureTextEntry: true },
        ]}
        primaryButton={{
          label: "Iniciar sesión",
          onPress: (v) => console.log(v), // { email, password, role }
        }}
        secondaryButton={{
          label: "¿No tienes una cuenta?",
          onPress: () => router.push("/login/register"),
        }}
        theme={{ primaryBackground: "#6366f1", cardBorderRadius: 20 }}
      />
    </View>
  );
}
*/
