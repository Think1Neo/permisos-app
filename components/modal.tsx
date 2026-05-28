import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Markdown from "react-native-markdown-renderer";

/**
 * Componente Modal que puede renderizar contenido normal o Markdown para hacer cosas bien barbaras
 * para poder mostrar información de forma más atractiva, como por ejemplo, instrucciones, términos y condiciones, o cualquier otro contenido que quieras destacar.
 * @param {Object} props - Las propiedades del componente
 * @param {React.ReactNode} [props.children] - Contenido normal a renderizar (se ignora si se usa markdownText)
 * @param {boolean} props.visible - Controla si el modal es visible o no
 * @param {boolean} [props.transparent=true] - Si el fondo del modal es transparente
 * @param {() => void} props.dismiss - Función que se ejecuta al cerrar el modal
 * @param {number} [props.margin=20] - Margen alrededor del contenido del modal
 * @param {string} [props.markdownText] - Texto en formato Markdown a renderizar
 * @returns {JSX.Element} Modal component
 *
 * @example
 * // Uso con children (sin markdown)
 * <ModalComponent
 *   visible={true}
 *   dismiss={() => {}}
 * >
 *   <Text>Contenido normal</Text>
 * </ModalComponent>
 *
 * @example
 * // Uso con markdown
 * <ModalComponent
 *   visible={true}
 *   dismiss={() => {}}
 *   markdownText="# Título **negrita**"
 * />
 */

export default function ModalComponent({
  children,
  visible,
  transparent = true,
  dismiss,
  margin = 20,
  markdownText,
}: {
  children?: React.ReactNode;
  visible: boolean;
  transparent?: boolean;
  dismiss: () => void;
  margin?: number;
  markdownText?: string;
}) {
  return (
    <Modal visible={visible} transparent={transparent} onRequestClose={dismiss}>
      <View style={styles.centeredView}>
        <TouchableWithoutFeedback onPress={dismiss}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={[styles.modalContent, { margin }]}>
          <ScrollView>
            {/* Si hay markdownText, lo renderiza, si no, muestra los children */}
            {markdownText ? <Markdown>{markdownText}</Markdown> : children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    maxHeight: "80%",
    width: "90%",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});
