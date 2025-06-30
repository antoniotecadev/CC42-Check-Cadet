import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
    Linking,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AboutModalProps {
    color: string;
    visible: boolean;
    onClose: () => void;
}

export default function AboutModal({
    color,
    visible,
    onClose,
}: AboutModalProps) {
    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.container,
                        Platform.OS == "web" ? styles.inner : {},
                    ]}
                >
                    <LinearGradient
                        colors={["#333", "#eee"]}
                        style={styles.modalContainer}
                    >
                        <ScrollView contentContainerStyle={styles.content}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                            >
                                <Ionicons name="close" size={28} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.description}>
                                Este aplicativo foi criado para facilitar a
                                gestão de refeições e eventos no campus.
                                Aproveite a experiência!
                            </Text>
                            <Image
                                source={require("@/assets/images/ateca_about.jpg")}
                                style={styles.avatar}
                            />
                            <Text style={styles.name}>António Teca</Text>
                            <TouchableOpacity
                                onPress={() =>
                                    Linking.openURL(
                                        "https://profile.intra.42.fr/users/ateca"
                                    )
                                }
                            >
                                <Text style={styles.link}>
                                    ateca (Intra 42)
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() =>
                                    Linking.openURL(
                                        "https://github.com/antoniotecadev"
                                    )
                                }
                            >
                                <Text style={styles.link}>
                                    github.com/antoniotecadev
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() =>
                                    Linking.openURL(
                                        "mailto:antonioteca@hotmail.com"
                                    )
                                }
                            >
                                <Text style={styles.link}>
                                    antonioteca@hotmail.com
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(30,30,30,0.4)",
    },
    modalContainer: {
        width: "90%",
        borderRadius: 24,
        padding: 0,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
        maxHeight: "85%",
    },
    content: {
        alignItems: "center",
        padding: 24,
        paddingTop: 16,
    },
    closeButton: {
        alignSelf: "flex-end",
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        color: "#fff",
        textAlign: "center",
        marginBottom: 18,
        fontStyle: "italic",
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginVertical: 12,
        borderWidth: 3,
        borderColor: "#fff",
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    name: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#222",
        marginTop: 8,
        marginBottom: 4,
    },
    link: {
        fontSize: 15,
        color: "#007AFF",
        marginTop: 8,
        textDecorationLine: "underline",
    },
    inner: {
        width: "100%",
        maxWidth: 400, // limite superior
        minWidth: 300, // limite inferior (opcional)
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
});
