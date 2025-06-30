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
                        colors={["#333", "#444"]}
                        style={styles.modalContainer}
                    >
                        <ScrollView contentContainerStyle={styles.content}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={onClose}
                            >
                                <Ionicons name="close" size={28} color="red" />
                            </TouchableOpacity>
                            <Text style={styles.description}>
                                Esta aplicação foi criada para facilitar a
                                gestão de refeições e eventos no campus.
                                Aproveite a experiência!
                            </Text>
                            <Profile
                                name="António Teca"
                                photo={require("@/assets/images/ateca_about.jpg")}
                                intra="ateca"
                                gitHub="antoniotecadev"
                                email="antonioteca@hotmail.com"
                            />
                            <Profile
                                name="António Pedro"
                                photo={require("@/assets/images/pedro_about.jpeg")}
                                intra="ansebast"
                                gitHub="AntonioSebastiaoPedro"
                                email="antoniosebastiaopedro19@gmail.com"
                            />
                        </ScrollView>
                    </LinearGradient>
                </View>
            </View>
        </Modal>
    );
}

type ProfileProps = {
    name: string;
    photo: string;
    intra: string;
    gitHub: string;
    email: string;
};

const Profile: React.FC<ProfileProps> = ({
    name,
    photo,
    intra,
    gitHub,
    email,
}) => {
    return (
        <>
            <Image source={photo} style={styles.avatar} />
            <Text style={styles.name}>{name}</Text>
            <TouchableOpacity
                onPress={() =>
                    Linking.openURL(
                        `https://profile.intra.42.fr/users/${intra}`
                    )
                }
            >
                <Text style={styles.link}>{intra} (Intra 42)</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => Linking.openURL(`https://github.com/${gitHub}`)}
            >
                <Text style={styles.link}>github.com/{gitHub}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => Linking.openURL(`mailto:{email}`)}
            >
                <Text style={styles.link}>{email}</Text>
            </TouchableOpacity>
        </>
    );
};

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
        color: "#eee",
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
