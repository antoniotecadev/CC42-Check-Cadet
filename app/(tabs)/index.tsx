import ParallaxScrollView from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import useUserStorage from "@/hooks/storage/useUserStorage";
import useAlert, { showAlert } from "@/hooks/useAlert";
import { Image } from "expo-image";
import * as Notifications from "expo-notifications";

import { useColorCoalition } from "@/components/ColorCoalitionContext";
import FloatActionButton from "@/components/ui/FloatActionButton";
import { Colors } from "@/constants/Colors";
import { encrypt } from "@/utility/AESUtil";
import { router, useRouter } from "expo-router";
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import LatestMessageDialog from "@/components/LatestMessageDialog";
import AboutModal from "@/components/ui/AboutModal";
import EventItem from "@/components/ui/EventItem";
import WebMenuModal from "@/components/ui/WebMenuModal";
import { database } from "@/firebaseConfig";
import useItemStorage from "@/hooks/storage/useItemStorage";
import useTokenStorage from "@/hooks/storage/useTokenStorage";
import { revokeToken } from "@/hooks/useLogin42";
import { useEvents } from "@/repository/eventRepository";
import { handleLogoutFirebase } from "@/services/authenticateWithFirebase";
import { removePushToken } from "@/services/ExpoNotificationService";
import { FlashList } from "@shopify/flash-list";
import { ref, set } from "firebase/database";
import {
    ActionSheetIOS,
    ActivityIndicator,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";

export default function HomeScreen() {
    const router = useRouter();
    const { removeItem } = useItemStorage();
    const { showConfirm } = useAlert();
    const { getUser, clearUser } = useUserStorage();
    const { color, setColor } = useColorCoalition();
    const { clearTokens, getAccessToken } = useTokenStorage();

    const isWeb = Platform.OS === "web";

    const refreshRef = useRef<() => void>(null);

    const [user, setUser] = useState<any>(null);
    const [aboutVisible, setAboutVisible] = useState(false);
    const [webMenuVisible, setWebMenuVisible] = useState(false);
    const [userCrypt, setUserCrypt] = useState<string | null>(null);

    const isStaff: boolean = !!user?.["staff?"];

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
                showConfirm(
                    "Ocorreu um erro ao carregar os dados ⚠",
                    "Sair e tentar logar novamente ?",
                    () => {
                        router.replace("/login");
                    }
                );
            }
        };

        const subscription = Notifications.addPushTokenListener(
            async (token) => {
                const userId = user?.id;
                const campusId = user?.campus?.[0]?.id;
                const cursusId = user?.projects_users?.[0]?.cursus_ids?.[0];
                console.log("🔁 Novo token detectado:", token.data);
                if (
                    userId &&
                    campusId &&
                    (cursusId || isStaff) &&
                    Platform.OS === "ios"
                ) {
                    const tokenRef = ref(
                        database,
                        isStaff
                            ? `campus/${campusId}/tokenIOSNotification/staff/${userId}`
                            : `campus/${campusId}/tokenIOSNotification/student/cursus/${cursusId}/${userId}`
                    );
                    try {
                        await set(tokenRef, token.data);
                    } catch (e: any) {
                        showAlert("Erro", e.message);
                    }
                }
            }
        );

        fetchUser();

        return () => subscription.remove();
    }, []);

    const handleMenuPress = () => {
        const options = [
            isStaff ? "Enviar Mensagem" : "Menu",
            "Ver Mensagens",
            "QR Code Scanner",
            "Sobre e Suporte",
            "Sair",
            "Cancelar",
        ];
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    disabledButtonIndices: isStaff ? [-1] : [0],
                    destructiveButtonIndex: 4,
                    cancelButtonIndex: 5,
                    userInterfaceStyle: "dark",
                },
                (selectedIndex) => {
                    if (selectedIndex === 0)
                        router.push({
                            pathname: "/send_message",
                            params: {
                                userId: user?.id,
                                campusId: user?.campus?.[0]?.id || 0,
                                campusName: user?.campus?.[0]?.name || "",
                            },
                        });
                    if (selectedIndex === 1) handleMenuCursus();
                    if (selectedIndex === 2) handleQrCodeScanner();
                    if (selectedIndex === 3) setAboutVisible(true);
                    if (selectedIndex === 4) handleSignOut();
                }
            );
        } else if (Platform.OS === "web") {
            setWebMenuVisible(true);
        }
    };

    const handleItemSelected = (cursusId: number) => {
        router.push({
            pathname: "/messages",
            params: {
                campusId: user?.campus?.[0]?.id || 0,
                cursusId: cursusId,
            },
        });
    };

    const handleMenuCursus = () => {
        const options = [
            "42Cursus",
            "C Piscine",
            "C-Piscine-Reloaded",
            "Cancelar",
        ];
        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: 3,
                    userInterfaceStyle: "dark",
                },
                (selectedIndex) => {
                    if (selectedIndex === 0) handleItemSelected(21);
                    if (selectedIndex === 1) handleItemSelected(9);
                    if (selectedIndex === 2) handleItemSelected(66);
                }
            );
        }
    };

    const handleWebMenuSelect = (option: number) => {
        if (option === 1) handleQrCodeScanner();
        if (option === 2) setAboutVisible(true);
        if (option === 3) handleSignOut();
    };

    const handleSignOut = () => {
        showConfirm(
            "Sair",
            "Tem certeza que deseja terminar a sessão?",
            async () => {
                const token = await getAccessToken();
                if (token) await revokeToken(token);
                await clearTokens();
                await clearUser();
                await removeItem("staff");
                await removeItem("user_id");
                await removeItem("campus_id");
                await removeItem("campus_name");
                if (Platform.OS === "ios")
                    await removePushToken(
                        user?.id,
                        user["staff?"],
                        user?.campus?.[0]?.id,
                        user?.projects_users?.[0]?.cursus_ids?.[0]
                    );
                await handleLogoutFirebase();
                router.replace("/login");
            },
            () => {
                // Código a executar se o usuário cancelar (opcional)
                console.log("Logout Cancelado!");
            }
        );
    };

    const handleQrCodeScanner = () => {
        router.push({
            pathname: "/qr_code_scanner",
            params: {
                userData: JSON.stringify({
                    id: user?.id,
                    login: user?.login,
                    displayname: user?.displayname,
                    cursusId: user?.projects_users?.[0]?.cursus_ids?.[0] || 0,
                    campusId: user?.campus?.[0]?.id || 0,
                    image: user?.image?.link?.trim() || undefined,
                }),
            },
        });
    };

    const cursusId = user?.projects_users?.[0]?.cursus_ids?.[0];

    return (
        <>
            {cursusId && (
                <LatestMessageDialog
                    campusId={user?.campus?.[0]?.id || 0}
                    cursusId={cursusId}
                />
            )}
            <AboutModal
                color={color}
                visible={aboutVisible}
                onClose={() => setAboutVisible(false)}
            />
            <WebMenuModal
                visible={webMenuVisible}
                onClose={() => setWebMenuVisible(false)}
                onSelect={handleWebMenuSelect}
            />
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
                            onPress={() => handleMenuPress()}
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
                            nameIcon={isWeb ? "menu" : "ellipsis"}
                            right={16}
                            top={isStaff ? undefined : isWeb ? 16 : 50}
                            bottom={isStaff ? 16 : undefined}
                            onPress={handleMenuPress}
                        />
                        <FloatActionButton
                            nameIcon={
                                isWeb ? "reload-outline" : "arrow.clockwise"
                            }
                            left={16}
                            bottom={16}
                            onPress={onReloadEvents}
                        />
                        {!isStaff && (
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
                        )}
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
        </>
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
        isStaff: userData["staff?"],
    });

    const [showEventsPast, setShowEventsPast] = useState(false);

    const now = new Date();

    const eventsFuture = useMemo(() => {
        return events?.filter((event) => new Date(event.end_at) > now);
    }, [events]);

    const eventsPast = useMemo(() => {
        return events?.filter((event) => new Date(event.end_at) <= now);
    }, [events]);

    const eventsFinal = showEventsPast ? events : eventsFuture;

    const renderFooter = () => {
        if (eventsPast?.length === 0) return null;

        return (
            <TouchableOpacity
                onPress={() => setShowEventsPast(!showEventsPast)}
                style={{ padding: 16, alignItems: "center" }}
            >
                <Text style={{ color: color, fontWeight: "bold" }}>
                    {showEventsPast
                        ? "Ocultar eventos realizados"
                        : "Ver eventos realizados "}
                </Text>
            </TouchableOpacity>
        );
    };

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
            data={eventsFinal}
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
                                    id: userData?.id || 0,
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
            ListFooterComponent={renderFooter}
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
        alignSelf: "center",
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
