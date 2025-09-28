import { useColorCoalition } from "@/components/ColorCoalitionContext";
import MessageModal from "@/components/ui/MessageModal";
import { handleQrCode } from "@/utility/QRCodeUtil";
import { useAudioPlayer } from "expo-audio";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
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

    const { color } = useColorCoalition();
    const { userData, eventId, mealId, camera } = useLocalSearchParams<{
        userData: string;
        eventId: string;
        mealId: string;
        camera: CameraType;
    }>();
    const user = typeof userData === "string" ? JSON.parse(userData) : null;

    const [modalData, setModalData] = useState<{
        title: string;
        message: string;
        color: string;
        imageSource?: { uri: string } | undefined;
        onClose: () => void;
    }>({
        title: "",
        message: "",
        color: "#3A86FF",
        onClose: () => setModalVisible(false),
    });
    // Local state for meal UI controls (used when scanning meals)
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const [mealQuantity, setMealQuantity] = useState<number>(1);
    const [mealPortion, setMealPortion] = useState<"first" | "second">("first");

    const scannedRef = useRef(false);
    const router = useRouter();

    const handleBarCodeScanned = useCallback(
        async (result: { data: string }) => {
            if (scannedRef.current) return;
            scannedRef.current = true; // bloqueia imediatamente

            // Beep sound
            player.play();
            Vibration.vibrate(100);

            const barcode = result.data;
            await handleQrCode({
                mealQuantity,
                mealPortion,
                barcodeResult: barcode,
                eventId: eventId,
                mealId: mealId,
                userId: user?.id,
                displayName: user?.displayname,
                cursusId: user?.cursusId,
                campusId: user?.campusId,
                imageSource: user?.image,
                setLoading: (loading) => setLoading(loading),
                showModal: ({
                    title,
                    message,
                    color,
                    imageSource,
                    onClose,
                }) => {
                    setModalVisible(true);
                    setModalData({
                        title,
                        message,
                        color,
                        imageSource,
                        onClose,
                    });
                },
                onResumeCamera: () => {
                    if (modalData.title === "Sucesso") {
                        router.back();
                    } else {
                        player.seekTo(0); // Reinicia o som
                        setModalVisible(false);
                        scannedRef.current = false;
                    }
                },
            });
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
            <MessageModal
                visible={modalVisible}
                title={modalData.title}
                message={modalData.message}
                color={modalData.color}
                imageSource={
                    modalData.imageSource ?? require("@/assets/images/icon.png")
                }
                buttonText="OK"
                onClose={() => modalData.onClose()}
            />
            <CameraView
                style={styles.camera}
                facing={camera ?? "back"}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
                onBarcodeScanned={handleBarCodeScanned}
            />
            {/* Overlay acima da camera */}
            <View style={[StyleSheet.absoluteFillObject, styles.overlay]}>
                <Text style={styles.text}>Aponte para o QR Code</Text>
                {/* Meal portion radio group (show only for meal flows) */}
                {mealId && (
                    <View style={styles.radioGroup}>
                        <TouchableOpacity
                            style={styles.radioButton}
                            onPress={() => setMealPortion("first")}
                        >
                            <View
                                style={
                                    mealPortion === "first"
                                        ? styles.radioSelected
                                        : styles.radioUnselected
                                }
                            />
                            <Text style={styles.radioText}>Primeira via</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.radioButton}
                            onPress={() => setMealPortion("second")}
                        >
                            <View
                                style={
                                    mealPortion === "second"
                                        ? styles.radioSelected
                                        : styles.radioUnselected
                                }
                            />
                            <Text style={styles.radioText}>Segunda via</Text>
                        </TouchableOpacity>
                    </View>
                )}
                <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => router.back()}
                >
                    {/* Quantity controls for meals (above the close button) */}
                    {mealId && (
                        <View style={styles.quantityContainer}>
                            <Text style={styles.quantityLabel}>Quantidade</Text>
                            <View style={styles.quantityRow}>
                                <TouchableOpacity
                                    onPress={() =>
                                        setMealQuantity((q) =>
                                            Math.max(1, q - 1)
                                        )
                                    }
                                    style={styles.qtyButton}
                                >
                                    <Text style={styles.qtyButtonText}>-</Text>
                                </TouchableOpacity>

                                <Text style={styles.quantityValue}>
                                    {mealQuantity}
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        setMealQuantity((q) =>
                                            Math.min(9, q + 1)
                                        )
                                    }
                                    style={styles.qtyButton}
                                >
                                    <Text style={styles.qtyButtonText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    {loading && (
                        <ActivityIndicator size="large" color={color} />
                    )}
                    <Text style={styles.closeText}>Fechar</Text>
                </TouchableOpacity>
            </View>
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
    radioGroup: {
        flexDirection: "row",
        marginTop: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    radioButton: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 8,
    },
    radioUnselected: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: "#fff",
        marginRight: 6,
    },
    radioSelected: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#fff",
        marginRight: 6,
    },
    radioText: { color: "#fff", fontWeight: "600" },
    quantityContainer: {
        position: "absolute",
        bottom: 90,
    },
    quantityLabel: {
        color: "#fff",
        textAlign: "center",
        marginBottom: 8,
    },
    quantityRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    qtyButton: {
        width: 50,
        height: 40,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
    },
    qtyButtonText: { color: "#fff", fontSize: 24, fontWeight: "600" },
    quantityValue: {
        marginHorizontal: 16,
        color: "#fff",
        fontSize: 36,
        fontWeight: "700",
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
