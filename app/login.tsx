import { useVideoPlayer, VideoView } from "expo-video";
import React from "react";
import {
    GestureResponderEvent,
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";

export default function LoginScreen() {
    const { width, height } = useWindowDimensions();
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

    const imageBackground =
        Platform.OS === "web"
            ? require("@/assets/images/42_default_background.jpg")
            : require("@/assets/images/back_default_42_16_9.png");

    return (
        <ImageBackground
            source={imageBackground}
            style={[styles.background, { width, height }]}
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
    },
    checkCadet: {
        fontSize: 16,
        color: "white",
        textShadowColor: "black",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
    button: {
        backgroundColor: "#AFC9F1",
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4, // sombra em Android
        shadowColor: "#000", // sombra iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        ...(Platform.OS === "web"
            ? {
                  height: 44,
                  paddingHorizontal: 24,
                  maxWidth: 320, // largura máxima (parece botão de login padrão)
                  alignSelf: "center",
                  width: "90%", // responsivo para telas menores
              }
            : {
                  height: 60,
                  marginHorizontal: 16,
              }),
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
