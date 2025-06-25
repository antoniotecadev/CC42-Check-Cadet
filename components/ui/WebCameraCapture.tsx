import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function WebCameraCapture({
    onSetImage,
    onSetShowCameraWeb,
}: {
    onSetImage: React.Dispatch<React.SetStateAction<string | null>>;
    onSetShowCameraWeb: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const [facing, setFacing] = useState<CameraType>("back");
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView | null>(null);
    const [capturedUri, setCapturedUri] = useState<string | null>(null);

    if (!permission) {
        // Camera permissions are still loading.
        return <View />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    We need your permission to show the camera
                </Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing((current) => (current === "back" ? "front" : "back"));
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
            });
            setCapturedUri(photo.uri);
        }
    };

    return (
        <View style={styles.container}>
            {capturedUri ? (
                <>
                    <Image source={{ uri: capturedUri }} style={styles.image} />
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => setCapturedUri(null)}
                    >
                        <Text style={styles.buttonText}>📷 Tirar outra</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => {
                            onSetImage(capturedUri);
                            onSetShowCameraWeb(false);
                        }}
                    >
                        <Text style={styles.buttonText}>✔ Usar esta</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <CameraView
                    ref={(ref) => {
                        cameraRef.current = ref;
                    }}
                    style={styles.camera}
                    facing={facing}
                >
                    <View style={styles.controls}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={toggleCameraFacing}
                        >
                            <Text style={styles.buttonText}>
                                🔁 {facing === "back" ? "Frontal" : "Traseira"}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={takePicture}
                        >
                            <Text style={styles.buttonText}>📸 Capturar</Text>
                        </TouchableOpacity>
                    </View>
                </CameraView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 500,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
    },
    camera: {
        flex: 1,
        width: "100%",
        justifyContent: "flex-end",
    },
    controls: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        width: "100%",
        padding: 20,
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    button: {
        backgroundColor: "transparent",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginHorizontal: 10,
        alignItems: "center",
    },
    buttonText: {
        color: "#888",
        fontSize: 16,
        fontWeight: "bold",
    },
    image: {
        width: 300,
        height: 400,
        borderRadius: 12,
        marginTop: 20,
        resizeMode: "cover",
    },
    message: {
        color: "#fff",
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center",
    },
});
