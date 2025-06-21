import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import useUserStorage from "@/hooks/storage/useUserStorage";
import useAlert from "@/hooks/useAlert";
import { Image } from "expo-image";

import { useColorCoalition } from "@/components/ColorCoalitionContext";
import FloatActionButton from "@/components/ui/FloatActionButton";
import { Colors } from "@/constants/Colors";
import { encrypt } from "@/utility/AESUtil";
import { router, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";

import EventItem from "@/components/ui/EventItem";
import { useEvents } from "@/repository/eventRepository";
import { FlashList } from "@shopify/flash-list";
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";

export default function HomeScreen() {
    const router = useRouter();
    const { showInfo } = useAlert();
    const { getUser } = useUserStorage();
    const { color, setColor } = useColorCoalition();

    const isWeb = Platform.OS === "web";

    const refreshRef = useRef<() => void>(null);

    const [user, setUser] = useState<any>(null);
    const [userCrypt, setUserCrypt] = useState<string | null>(null);

    const blurhash =
        "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

    const handleRefreshReady = (refreshFn: (() => void) | null) => {
        refreshRef.current = refreshFn;
    };

    const onReloadEvents = () => {
        if (refreshRef.current) {
            refreshRef.current();
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await getUser();
            setUser(userData);
            if (userData) {
                showInfo(
                    `Welcome back, ${userData.email}!`,
                    JSON.stringify(userData.coalition, null, 2)
                );
                setColor(
                    userData?.coalition?.color?.trim() ||
                        Colors.light_blue_900.default
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
                    <ThemedText
                        onPress={() =>
                            router.push({
                                pathname: "/qr_code_scanner",
                                params: {},
                            })
                        }
                        type="title"
                        style={{
                            color: "#fff",
                            position: "absolute",
                            alignSelf: "center",
                            bottom: 16,
                        }}
                    >
                        {user?.login || ""}
                    </ThemedText>
                    <FloatActionButton
                        nameIcon={isWeb ? "reload-outline" : "arrow.clockwise"}
                        left={16}
                        bottom={16}
                        onPress={onReloadEvents}
                    />
                    <FloatActionButton
                        right={16}
                        bottom={16}
                        nameIcon={isWeb ? "qr-code-outline" : "qrcode"}
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
                {user && (
                    <EventsList
                        isWeb={isWeb}
                        color={color}
                        userData={user}
                        onRefreshReady={handleRefreshReady}
                    />
                )}
            </>
        </ParallaxScrollView>
    );
}

type EventsListProps = {
    isWeb: boolean;
    color: string;
    userData: any;
    onRefreshReady: (refreshFn: (() => void) | null) => void;
};

function EventsList({
    isWeb,
    color,
    userData,
    onRefreshReady,
}: EventsListProps) {
    const {
        data: events,
        isLoading,
        error,
        refetch,
        isRefetching,
    } = useEvents({
        campusId: userData?.campus?.[0]?.id || 0,
        cursusId: userData?.projects_users?.[0]?.cursus_ids?.[0] || 0,
        isStaff: false,
    });

    const handleRefresh = useCallback(() => {
        refetch();
    }, [refetch]);

    useEffect(() => {
        if (onRefreshReady) {
            onRefreshReady(handleRefresh);
        }
    }, [handleRefresh, onRefreshReady]);

    if (isLoading)
        return (
            <Text
                style={[
                    {
                        color: color,
                    },
                    styles.alignText,
                ]}
            >
                Carregando eventos...
            </Text>
        );
    if (error)
        return (
            <Text style={[{ color: "red" }, styles.alignText]}>
                Erro ao carregar eventos
            </Text>
        );

    return (
        <FlashList
            data={events}
            estimatedItemSize={30}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
                <RefreshControl
                    colors={[color]} // Android: array de cores da animação
                    tintColor={color} // iOS: cor do spinner
                    refreshing={isRefetching || isLoading}
                    onRefresh={handleRefresh}
                />
            }
            ListHeaderComponent={
                <>
                    {isWeb && (isRefetching || isLoading) && (
                        <ActivityIndicator color={color} size="large" />
                    )}
                </>
            }
            renderItem={({ item }) => (
                <TouchableOpacity
                    onPress={() =>
                        router.push({
                            pathname: "/event_details",
                            params: {
                                userData: JSON.stringify({
                                    id: userData.id,
                                    campusId: userData?.campus?.[0]?.id || 0,
                                }),
                                eventData: JSON.stringify(item),
                            },
                        })
                    }
                >
                    <EventItem item={item} color={color} />
                </TouchableOpacity>
            )}
        />
    );
}

const styles = StyleSheet.create({
    coalitionLogo: {
        width: "100%",
        height: "100%",
        bottom: 0,
        left: 0,
        position: "absolute",
    },
    alignText: {
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        textAlign: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        textShadowColor: "#000",
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 3,
    },
});
