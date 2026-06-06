import Card from "@/components/ui/card";
import { resetPassword } from "@/services/authService";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

export default function Forgot() {
  const [loading, setLoading] = useState(false);

  async function handleReset(values: Record<string, string>) {
    const email = values.email?.trim().toLowerCase();

    if (!email) {
      Alert.alert("Campo requerido", "Ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      Alert.alert(
        "Correo enviado",
        "Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.",
        [
          {
            text: "Ir al login",
            onPress: () => router.replace("/login/login"),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert("Error", friendlyError(err.message));
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
        title="Olvidé mi contraseña"
        subtitle="Te enviaremos un enlace para restablecerla."
        fields={[
          {
            key: "email",
            label: "Correo electrónico",
            placeholder: "",
            keyboardType: "email-address",
          },
        ]}
        primaryButton={{
          label: loading ? "Enviando…" : "Enviar enlace",
          onPress: handleReset,
        }}
        secondaryButton={{
          label: "Volver al inicio de sesión",
          onPress: () => router.back(),
        }}
        theme={{ primaryBackground: "#6366f1", cardBorderRadius: 20 }}
      />
    </View>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes("user-not-found"))
    return "No existe una cuenta con ese correo.";
  if (msg.includes("invalid-email"))
    return "El formato del correo no es válido.";
  if (msg.includes("too-many-requests"))
    return "Demasiados intentos. Espera unos minutos e intenta de nuevo.";
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
