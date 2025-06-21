import { Image } from "expo-image";
import React from "react";
import {
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface MessageModalProps {
    visible: boolean;
    title: string;
    message: string;
    color?: string;
    imageSource?: any; // require('../assets/logo_42.png') ou { uri: ... }
    buttonText?: string;
    onClose: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({
    visible,
    title,
    message,
    color = "#3A86FF",
    imageSource,
    buttonText = "OK",
    onClose,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {imageSource && (
                        <Image
                            source={imageSource}
                            style={styles.image}
                        />
                    )}
                    <Text style={[styles.title, { color }]}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: color }]}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{buttonText}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        width: width * 0.85,
        backgroundColor: "#fff",
        borderRadius: 18,
        alignItems: "center",
        padding: 24,
        elevation: 8,
    },
    image: {
        width: 200,
        height: 200,
        borderRadius: 100,
        marginBottom: 8,
    },
    title: {
        fontSize: 34,
        fontWeight: "bold",
        marginBottom: 8,
        textAlign: "center",
    },
    message: {
        fontSize: 16,
        color: "#555",
        marginBottom: 16,
        textAlign: "center",
    },
    button: {
        width: "100%",
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
    },
});

export default MessageModal;
