import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import {
    Dimensions,
    GestureResponderEvent,
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
    const videoSource = require("@/assets/images/qr_code_phone_gif.mp4");

    const player = useVideoPlayer(videoSource, (player) => {
        player.loop = true;
        player.muted = true;
        player.volume = 0;
        player.play();
    });

    function signIn(): void {
        alert("Sign In button pressed!"); // Aqui você pode implementar a lógica de login
    }

    return (
        <ImageBackground
            source={require("@/assets/images/back_default_42_16_9.png")} // Coloca a imagem de fundo aqui
            style={styles.background}
            resizeMode="cover"
        >
            <View style={styles.container}>
                <View style={styles.card}>
                    <VideoView
                        player={player}
                        style={styles.video}
                        contentFit="contain"
                        nativeControls={false}
                        showsTimecodes={false}
                    />
                </View>
                <View style={styles.buttonContainer}>
                    <SignInButton onPress={() => signIn()} />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.appName}>CC 42</Text>
                    <Text style={styles.checkCadet}>Check Cadet</Text>
                </View>
            </View>
        </ImageBackground>
    );
}

interface SignInButtonProps {
    onPress: (event: GestureResponderEvent) => void;
}

const SignInButton: React.FC<SignInButtonProps> = ({ onPress }) => {
    return (
        <TouchableOpacity onPress={onPress} style={styles.button}>
            <Text style={styles.buttonText}>
                <Text style={styles.sign}>SIGN</Text>{" "}
                <Text style={styles.in}>IN</Text>
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
    container: {
        flex: 1,
        justifyContent: "space-between",
        paddingVertical: 50,
        paddingHorizontal: 16,
    },
    card: {
        width: 150,
        height: 150,
        alignSelf: "center",
        backgroundColor: "white",
        borderRadius: 5,
        elevation: 8,
        overflow: "hidden",
    },
    video: {
        width: 150,
        height: 150,
    },
    buttonContainer: {
        alignSelf: "stretch",
        height: 60,
        justifyContent: "center",
    },
    footer: {
        alignItems: "center",
        marginBottom: 25,
    },
    appName: {
        fontSize: 36,
        fontWeight: "bold",
        color: "white",
        textShadowColor: "black",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
        fontFamily: "Foldit-Medium", // Usa expo-font se necessário
    },
    checkCadet: {
        fontSize: 16,
        color: "white",
        textShadowColor: "black",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
        fontFamily: "Foldit-Medium",
    },
    button: {
        height: 60,
        backgroundColor: "#AFC9F1",
        borderRadius: 8,
        marginHorizontal: 16,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4, // sombra em Android
        shadowColor: "#000", // sombra iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    buttonText: {
        fontSize: 24,
        fontWeight: "bold",
    },
    sign: {
        color: "#419259",
        fontWeight: "bold",
    },
    in: {
        color: "#DFB50D",
        fontWeight: "bold",
    },
});
