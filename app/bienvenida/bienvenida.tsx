import ModalComponent from "@/components/modal";
import { router } from "expo-router";
import { useState } from "react";
import { Button, StatusBar, StyleSheet, Text, View } from "react-native";

export default function Bienvenida() {
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <Text style={styles.welcomeTexth1}>
        Sistema del 2026 powered by firebase..
      </Text>

      <View style={styles.sub_container}>
        <View style={styles.card}>
          <Text style={styles.cardText}>Entrar al sistema</Text>
          <Button title="Entrar" onPress={() => router.push("/login/login")} />
        </View>
      </View>
      <View style={styles.view}>
        <Text style={styles.welcomeText}>
          Bienvenido a una aplicacion con un sistema del 2026 powered by
          firebase.
        </Text>
        <View style={styles.buttonContainer}>
          <Button title="Saber más" onPress={openModal} />
        </View>
      </View>

      <ModalComponent
        visible={modalVisible}
        transparent={false}
        dismiss={closeModal}
        margin={20}
        markdownText="Aplicacion creada por **Jorge Alejandro**, con el objetivo de acreditar la materia de *Desarrollo de Aplicaciones Móviles*. "
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  sub_container: {
    marginBottom: 30,
    width: "100%",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 15,
    width: "95%",
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  view: {
    width: "100%",
    padding: 20,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  welcomeTexth1: {
    fontSize: 30,
    color: "#555",
    lineHeight: 32,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 10,
  },
  modalContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 22,
    color: "#333",
  },
});
