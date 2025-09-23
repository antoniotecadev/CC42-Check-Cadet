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
import { useColorScheme } from "@/hooks/useColorScheme";
import React, { useEffect } from "react";

import useItemStorage from "@/hooks/storage/useItemStorage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Buffer } from "buffer";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// serve para disponibilizar o objeto Buffer globalmente em ambientes onde ele não está presente por padrão
global.Buffer = Buffer;

const queryClient = new QueryClient({});

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
    // Show React Query DevTools in development only on web
    const showDevtools = __DEV__ && Platform.OS === "web";
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
            if (data && userId && campusId) {
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
                                title: "QR Code",
                                headerBackTitle: "Voltar", // iOS: texto do botão
                                headerBackVisible: true, // mostrar ou ocultar botão de voltar
                            }}
                        />
                        <Stack.Screen
                            name="qr_code_scanner"
                            options={{
                                headerShown: Platform.OS === "web",
                                title: "Scanear QR Code",
                                headerBackTitle: "Voltar",
                                headerBackVisible: true,
                            }}
                        />
                        <Stack.Screen
                            name="event_details"
                            options={{
                                headerShown: true,
                                title: "Detalhes",
                                headerBackTitle: "Voltar",
                                headerBackVisible: true,
                            }}
                        />
                        <Stack.Screen
                            name="meals"
                            options={{
                                headerShown: true,
                                title: "Refeições",
                                headerBackTitle: "Voltar",
                                headerBackVisible: true,
                            }}
                        />
                        <Stack.Screen
                            name="messages"
                            options={{
                                headerShown: true,
                                title: "Mensagens",
                                headerBackTitle: "Voltar",
                                headerBackVisible: true,
                            }}
                        />
                        <Stack.Screen
                            name="send_message"
                            options={{
                                headerShown: true,
                                title: "Mensagem",
                                headerBackTitle: "Voltar",
                                headerBackVisible: true,
                            }}
                        />
                        <Stack.Screen name="+not-found" />
                    </StackHeader>
                    <StatusBar style="auto" />
                </ColorCoalitionProvider>
            </ThemeProvider>
            {showDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
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
