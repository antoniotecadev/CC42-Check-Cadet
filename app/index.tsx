import useTokenStorage from "@/hooks/storage/useTokenStorage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Image,
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";

export default function SplashScreen() {
    const { width, height } = useWindowDimensions();
    const [isReady, setIsReady] = useState(false);

    const {
        getAccessToken,
        getRefreshToken,
        isTokenExpired,
        refreshTokenUser,
    } = useTokenStorage();

    useEffect(() => {
        const timeout = setTimeout(async () => {
            const accessToken = await getAccessToken();
            const refreshToken = await getRefreshToken();
            if (accessToken == null || refreshToken == null) {
                router.replace("/login");
            } else if (await isTokenExpired()) {
                const sucess = await refreshTokenUser(refreshToken, true);
                if (!sucess) router.replace("/login");
                else router.replace("/(tabs)");
            } else router.replace("/(tabs)");
        }, 5000);

        return () => clearTimeout(timeout);
    }, []);

    const imageBackground =
        Platform.OS === "web"
            ? require("@/assets/images/42_default_background.jpg")
            : require("@/assets/images/back_default_42_16_9.png");

    useEffect(() => {
        let cancelled = false;

        async function preload() {
            try {
                // On web require(...) returns a path usable directly as uri.
                if (Platform.OS === "web") {
                    // imageBackground is a module reference from require(...)
                    const uri =
                        typeof imageBackground === "number"
                            ? imageBackground
                            : (imageBackground as any)?.uri || imageBackground;
                    if (typeof uri === "string") {
                        await Image.prefetch(uri as string);
                    }
                }
            } catch (e) {
                // ignore preload errors, we'll still render
            } finally {
                if (!cancelled) setIsReady(true);
            }
        }

        preload();

        return () => {
            cancelled = true;
        };
    }, []);

    if (!isReady && Platform.OS === "web") {
        return (
            <View
                style={[
                    styles.container,
                    { width, height, backgroundColor: "black" },
                ]}
            >
                <Text style={{ color: "white" }}>Carregando...</Text>
            </View>
        );
    }

    return (
        <ImageBackground
            source={imageBackground}
            style={[styles.container, { width, height }]}
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
    },
    checkCadet: {
        fontSize: 16,
        color: "white",
        textShadowColor: "black",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
});
