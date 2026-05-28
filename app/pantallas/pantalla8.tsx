import { StyleSheet, Text, View } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  content: { fontSize: 16, textAlign: "center" },
});

export default function Pantalla8() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla 8</Text>
      <Text style={styles.content}>
        Esta es la pantalla 8. Solo los usuarios con el permiso "view_pantalla8"
        pueden verla. Ademas esta en construcion. 😊
      </Text>
    </View>
  );
}
