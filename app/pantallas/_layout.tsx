// app/pantallas/_layout.tsx
import { Stack } from "expo-router";

export default function PantallasLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerTintColor: "#6366f1" }} />
  );
}
