import { decrypt } from "@/utility/AESUtil";
import { useAudioPlayer } from "expo-audio";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import {
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    Vibration,
    View,
} from "react-native";


export default function QrCodeScanner() {
    const [permission, requestPermission] = useCameraPermissions();
    const player = useAudioPlayer(require("../assets/beep.mp3"));
    const navigation = useNavigation();
    const scannedRef = useRef(false);
    const router = useRouter();

    const handleBarCodeScanned = useCallback(
        async (result: { data: string }) => {
            if (scannedRef.current) return;
            scannedRef.current = true; // bloqueia imediatamente

            // Beep sound
            player.play();
            Vibration.vibrate(100);

            alert(decrypt(result.data));
            if (navigation.canGoBack()) {
                setTimeout(() => {
                    //navigation.goBack();
                }, 500);
            }
        },
        []
    );

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, { justifyContent: "center" }]}>
                <Text style={styles.message}>
                    Precisamos da sua permissão para acessar a câmera
                </Text>
                <TouchableOpacity
                    onPress={requestPermission}
                    style={styles.button}
                >
                    <Text style={styles.text}>Permitir</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={handleBarCodeScanned}
            >
                <View style={styles.overlay}>
                    <Text style={styles.text}>Aponte para o QR Code</Text>
                </View>
                <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => router.back()}
                >
                    <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    message: { textAlign: "center", paddingBottom: 10, color: "#fff" },
    camera: { flex: 1 },
    overlay: {
        position: "absolute",
        top: 60,
        width: "100%",
        alignItems: "center",
    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
        backgroundColor: "rgba(0,0,0,0.5)",
        padding: 8,
        borderRadius: 8,
    },
    closeBtn: {
        position: "absolute",
        bottom: 40,
        alignSelf: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 24,
        opacity: 0.8,
    },
    closeText: {
        color: "#222",
        fontWeight: "bold",
        fontSize: 16,
    },
    button: {
        backgroundColor: "#3A86FF",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        alignSelf: "center",
        marginTop: 12,
        ...(Platform.OS === "web"
            ? {
                  paddingHorizontal: 24,
                  maxWidth: 320, // largura máxima (parece botão de login padrão)
                  width: "90%", // responsivo para telas menores
              }
            : {
                  marginHorizontal: 16,
              }),
    },
});
