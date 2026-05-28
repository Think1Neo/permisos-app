import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Button,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PULSE_COLOR = "#00FFD1";

export default function traductor() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();

  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ]),
    ).start();
  }, []);

  // Interpolaciones
  const borderWidth = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 6],
  });

  const borderOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  const shadowRadius = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 22],
  });

  const shadowOpacity = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.75],
  });

  if (!permission) {
    return <View style={styles.base} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.base}>
        <Animated.View
          style={[
            styles.pulseWrapper,
            {
              borderWidth,
              borderColor: PULSE_COLOR,
              opacity: borderOpacity,
              shadowRadius,
              shadowOpacity,
            },
          ]}
        >
          <View style={styles.content}>
            <Text style={styles.message}>
              We need your permission to show the camera
            </Text>
            <Button onPress={requestPermission} title="grant permission" />
          </View>
        </Animated.View>
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  return (
    <View style={styles.base}>
      {/* Cámara de fondo, ocupa todo */}
      <CameraView style={StyleSheet.absoluteFill} facing={facing} />

      {/* Overlay con el borde pulsante encima de la cámara */}
      <Animated.View
        style={[
          styles.pulseWrapper,
          {
            borderWidth,
            borderColor: PULSE_COLOR,
            opacity: borderOpacity,
            shadowRadius,
            shadowOpacity,
          },
        ]}
        pointerEvents="none"
      />

      {/* Botón de girar */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
          <Text style={styles.text}>Girar</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: "#000",
  },

  pulseWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    // Color del glow (funciona en iOS; en Android es ignorado)
    shadowColor: PULSE_COLOR,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0, // Android: sombra neutral sin color
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "white",
    fontSize: 16,
  },

  buttonContainer: {
    position: "absolute",
    bottom: 64,
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 64,
  },

  button: {
    flex: 1,
    alignItems: "center",
  },

  text: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
});
