import { router } from "expo-router";
import { useEffect } from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
    useEffect(() => {
        const timeout = setTimeout(() => {
            router.replace("/login"); // Redireciona para a tela de login
        }, 5000);

        return () => clearTimeout(timeout);
    }, []);

    return (
        <ImageBackground
            source={require("@/assets/images/back_default_42_16_9.png")}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.content}>
                <Text style={styles.appName}>CC 42</Text>
                <Text style={styles.checkCadet}>Check Cadet</Text>
            </View>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        alignItems: "center",
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 20,
        resizeMode: "contain",
    },
    appName: {
        fontSize: 50,
        fontWeight: "bold",
        color: "white",
        textShadowColor: "black",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
        fontFamily: "Foldit-Medium",
    },
    checkCadet: {
        fontSize: 16,
        color: "white",
        textShadowColor: "black",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
        fontFamily: "Foldit-Medium",
    },
});
