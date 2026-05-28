import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { useAuthRedirect } from "../hooks/useAuthHooks";

function RootLayoutInner() {
  const { isLoading } = useAuth();
  useAuthRedirect();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="bienvenida/bienvenida" />
      <Stack.Screen name="login/login" />
      <Stack.Screen name="login/register" />
      <Stack.Screen name="pantallas" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}

{
  /*
import { Stack } from "expo-router";

// Este es el root layout para la aplicación. Puedes agregar componentes compartidos aquí.

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          title: "Inicio",
        }}
      />
      {/*<Stack.Screen name="bienvenida" options={{ title: "Bienvenida" }} />*/
}
{
  /*}      
      <Stack.Screen
        name="interprete/interprete"
        options={{
          title: "Intérprete",
          headerShown: true,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="traductor/traductor"
        options={{
          title: "Traductor",
          headerShown: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="login/login"
        options={{
          title: "Iniciar sesión",
          headerShown: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <Stack.Screen
        name="login/register"
        options={{
          title: "Registrarse",
          headerShown: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      />

      <Stack.Screen
        name="bienvenida/bienvenida"
        options={{
          title: "Bienvenida",
          headerShown: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
    </Stack>
  );
}
*/
}
