import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { router, SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
// Initialize Reanimated logger config early to avoid undefined config during module load
import "react-native-reanimated";
import "../reanimated-logger-init.js";

import {
    ColorCoalitionProvider,
    useColorCoalition,
} from "@/components/ColorCoalitionContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { t } from "@/i18n";
import React, { useEffect } from "react";

import useItemStorage from "@/hooks/storage/useItemStorage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Buffer } from "buffer";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

// serve para disponibilizar o objeto Buffer globalmente em ambientes onde ele não está presente por padrão
global.Buffer = Buffer;

const queryClient = new QueryClient({});

// Componente para DevTools que só carrega quando necessário
const DevTools = () => {
    const [DevToolsComponent, setDevToolsComponent] = React.useState<React.ComponentType<any> | null>(null);
    
    React.useEffect(() => {
        if (__DEV__ && Platform.OS === "web") {
            import("@tanstack/react-query-devtools").then((module) => {
                setDevToolsComponent(() => module.ReactQueryDevtools);
            }).catch(() => {
                // Ignora erros de import silenciosamente
            });
        }
    }, []);
    
    if (!DevToolsComponent) return null;
    
    return <DevToolsComponent initialIsOpen={false} />;
};

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export default function RootLayout() {
    const { getItem } = useItemStorage();
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
    });

    useEffect(() => {
        // Libera manualmente a splash (impede que ela fique visível)
        SplashScreen.hideAsync().catch(() => {});
    }, []);

    useEffect(() => {
        if (Platform.OS === "web") return;
        let isMounted = true;

        async function redirect(notification: Notifications.Notification) {
            const userId = await getItem("user_id");
            const campusId = await getItem("campus_id");
            const { title, body, data } = notification.request.content;
            
            if (!data || !userId || !campusId) return;

            // Verifica o tipo de notificação
            if (data.type === "location_search") {
                // Notificação de busca de localização
                const searchedBy = data.searchedBy || t("location.student");
                
                Alert.alert(
                    t("location.updateLocationPromptTitle"),
                    t("location.updateLocationPromptMessage", { name: searchedBy }),
                    [
                        {
                            text: t("common.cancel"),
                            style: "cancel",
                        },
                        {
                            text: t("location.goToLocationScreen"),
                            onPress: () => {
                                // Navega para a tela de localização manual
                                router.push("/(tabs)/manual_location");
                            },
                        },
                    ]
                );
            } else if (data.type === "location_shared") {
                // Notificação de localização partilhada
                const sharedBy = data.sharedBy || t("location.student");
                const location = data.location || "";
                
                Alert.alert(
                    title || t("location.sharedLocationWithYou", { name: sharedBy }),
                    body || t("location.sharedLocationBody", { name: sharedBy, location }),
                    [
                        {
                            text: t("common.confirm"),
                            style: "default",
                        },
                    ]
                );
            } else if (data.id) {
                // Notificação de refeição (lógica existente)
                router.push({
                    pathname: "/meal_details",
                    params: {
                        userId,
                        campusId,
                        cursusId: data.cursusId as string,
                        mealData: JSON.stringify({
                            id: data.id,
                            type: title,
                            name: body,
                            description: data.description,
                            createdDate: data.createdDate,
                            quantity: data.quantity,
                            pathImage: data.pathImage,
                        }),
                    },
                });
            }
        }

        // 🔁 1. Listener enquanto o app está rodando (foreground ou background)
        const subscription =
            Notifications.addNotificationResponseReceivedListener(
                (response) => {
                    const data = response.notification.request.content.data;
                    console.log(
                        "🟡 Notificação clicada (listener ativo):",
                        data
                    );
                    // ex: navegue para outra tela com esses dados
                    redirect(response.notification);
                }
            );

        // 🔁 2. Verifica se o app foi ABERTO pela notificação (estava fechado)
        function checkInitialNotification() {
            const response = Notifications.getLastNotificationResponse();
            if (!isMounted || !response?.notification) {
                return;
            }
            const data = response.notification.request.content.data;
            console.log("🔵 App reaberto pela notificação:", data);
            // ex: navegue para outra tela aqui também
            redirect(response?.notification);
        }
        checkInitialNotification();

        return () => {
            isMounted = false;
            subscription.remove();
        };
    }, []);

    if (!loaded) {
        // Async font loading only occurs in development.
        return null;
    }

    return (
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <ThemeProvider
                    value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                >
                    <ColorCoalitionProvider>
                        <StackHeader colorScheme={colorScheme ?? "light"}>
                            <Stack.Screen
                                name="index"
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="login"
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="(tabs)"
                                options={{ headerShown: false }}
                            />
                            <Stack.Screen
                                name="qr_code"
                                options={{
                                    headerShown: true,
                                    title: t('navigation.qrCode'),
                                    headerBackTitle: t('navigation.back'),
                                    headerBackVisible: true,
                                }}
                            />
                            <Stack.Screen
                            name="qr_code_scanner"
                            options={{
                                headerShown: Platform.OS === "web",
                                title: t('navigation.scanQrCode'),
                                headerBackTitle: t('navigation.back'),
                                headerBackVisible: true,
                            }}
                        />
                        <Stack.Screen
                            name="event_details"
                            options={{
                                headerShown: true,
                                title: t('navigation.details'),
                                headerBackTitle: t('navigation.back'),
                                headerBackVisible: true,
                            }}
                        />
                        <Stack.Screen
                            name="meals"
                            options={{
                                headerShown: true,
                                title: t('navigation.meals'),
                                headerBackTitle: t('navigation.back'),
                                headerBackVisible: true,
                            }}
                        />
                        <Stack.Screen
                            name="messages"
                            options={{
                                headerShown: true,
                                title: t('navigation.messages'),
                                headerBackTitle: t('navigation.back'),
                                headerBackVisible: true,
                            }}
                        />
                        <Stack.Screen
                            name="send_message"
                            options={{
                                headerShown: true,
                                title: t('navigation.message'),
                                headerBackTitle: t('navigation.back'),
                                headerBackVisible: true,
                            }}
                        />
                        <Stack.Screen name="+not-found" />
                    </StackHeader>
                    <StatusBar style="auto" />
                </ColorCoalitionProvider>
            </ThemeProvider>
            <DevTools />
        </LanguageProvider>
        </QueryClientProvider>
    );
}

// Esse componente vai dentro do ColorProvider
type StackHeaderProps = {
    colorScheme: string;
    children: React.ReactNode;
};

function StackHeader({ colorScheme, children }: StackHeaderProps) {
    const { color } = useColorCoalition();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: color,
                },
                headerTintColor:
                    colorScheme === "dark"
                        ? DarkTheme.colors.text
                        : DefaultTheme.colors.text,
            }}
        >
            {children}
        </Stack>
    );
}
