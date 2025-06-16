import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import useUserStorage from "@/hooks/storage/useUserStorage";
import useAlert from "@/hooks/useAlert";
import { Image } from "expo-image";
import { Platform, StyleSheet } from "react-native";

import FloatActionButton from "@/components/ui/FloatActionButton";
import { encrypt } from "@/utility/AESUtil";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";

export default function HomeScreen() {
    const router = useRouter();
    const { showInfo } = useAlert();
    const { getUser } = useUserStorage();
    const [user, setUser] = useState<any>(null);
    const [userCrypt, setUserCrypt] = useState<string | null>(null);

    const blurhash =
        "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await getUser();
            setUser(userData);
            if (userData) {
                showInfo(
                    `Welcome back, ${userData.email}!`,
                    JSON.stringify(userData.coalition, null, 2)
                );
                setUserCrypt(
                    encrypt(
                        "cc42user" +
                            (userData?.id ?? "0") +
                            "#" +
                            (userData?.login ?? "") +
                            "#" +
                            (userData?.displayname ?? "") +
                            "#" +
                            (userData?.projects_users?.[0]?.cursus_ids?.[0] ??
                                "0") +
                            "#" +
                            (userData?.campus?.[0]?.id ?? "0") +
                            "#" +
                            (userData?.image?.link?.trim() ?? "")
                    )
                );
            } else {
                showInfo("Welcome!", "You can start exploring the app.");
            }
        };
        fetchUser();
    }, []);

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
            headerImage={
                <React.Fragment>
                    <Image
                        source={
                            user?.coalition?.cover_url ||
                            require("@/assets/images/back_default_42_16_9_horizontal.png")
                        }
                        placeholder={{ blurhash }}
                        transition={1000}
                        style={styles.coalitionLogo}
                        contentFit="fill"
                    />
                    {/* Texto sobre a imagem */}
                    <ThemedView
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            justifyContent: "center",
                            alignItems: "center",
                            zIndex: 1,
                            backgroundColor: "transparent",
                        }}
                        pointerEvents="none"
                    >
                        <ThemedText
                            type="defaultSemiBold"
                            style={[
                                styles.text,
                                {
                                    color:
                                        user?.coalition?.color?.trim() ||
                                        "#fff",
                                },
                            ]}
                        >
                            {user?.coalition?.name || "Default Coalition"}
                        </ThemedText>
                        <ThemedText
                            type="default"
                            style={[
                                styles.text,
                                {
                                    color:
                                        user?.coalition?.color?.trim() ||
                                        "#fff",
                                },
                            ]}
                        >
                            {user?.displayname || ""}
                        </ThemedText>
                    </ThemedView>
                    <FloatActionButton
                        right={16}
                        bottom={16}
                        onPress={() =>
                            router.push({
                                pathname: "/qr_code",
                                params: {
                                    content: userCrypt,
                                    title: user?.login,
                                    description: user?.displayname,
                                },
                            })
                        }
                    />
                </React.Fragment>
            }
        >
            <>
                <ThemedView style={styles.titleContainer}>
                    <ThemedText type="title">Welcome!</ThemedText>
                    <HelloWave />
                </ThemedView>
                <ThemedView style={styles.stepContainer}>
                    <ThemedText type="subtitle">Step 1: Try it</ThemedText>
                    <ThemedText>
                        Edit{" "}
                        <ThemedText type="defaultSemiBold">
                            app/(tabs)/index.tsx
                        </ThemedText>{" "}
                        to see changes. Press{" "}
                        <ThemedText type="defaultSemiBold">
                            {Platform.select({
                                ios: "cmd + d",
                                android: "cmd + m",
                                web: "F12",
                            })}
                        </ThemedText>{" "}
                        to open developer tools.
                    </ThemedText>
                </ThemedView>
                <ThemedView style={styles.stepContainer}>
                    <ThemedText type="subtitle">Step 2: Explore</ThemedText>
                    <ThemedText>
                        {`Tap the Explore tab to learn more about what's included in this starter app.`}
                    </ThemedText>
                </ThemedView>
                <ThemedView style={styles.stepContainer}>
                    <ThemedText type="subtitle">
                        Step 3: Get a fresh start
                    </ThemedText>
                    <ThemedText>
                        {`When you're ready, run `}
                        <ThemedText type="defaultSemiBold">
                            npm run reset-project
                        </ThemedText>{" "}
                        to get a fresh{" "}
                        <ThemedText type="defaultSemiBold">app</ThemedText>{" "}
                        directory. This will move the current{" "}
                        <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
                        <ThemedText type="defaultSemiBold">
                            app-example
                        </ThemedText>
                        .
                    </ThemedText>
                </ThemedView>
            </>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    coalitionLogo: {
        width: "100%",
        height: "100%",
        bottom: 0,
        left: 0,
        position: "absolute",
    },
    text: {
        textAlign: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        textShadowColor: "#000",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
});
