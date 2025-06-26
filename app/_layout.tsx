import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import {
    ColorCoalitionProvider,
    useColorCoalition,
} from "@/components/ColorCoalitionContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import React, { useEffect } from "react";

import { useReactQueryDevTools } from "@dev-plugins/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Buffer } from 'buffer';
import { Platform } from "react-native";

// serve para disponibilizar o objeto Buffer globalmente em ambientes onde ele não está presente por padrão
global.Buffer = Buffer;

const queryClient = new QueryClient({});

export default function RootLayout() {
    useReactQueryDevTools(queryClient);
    const colorScheme = useColorScheme();
    const [loaded] = useFonts({
        SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    });

    useEffect(() => {
        // Libera manualmente a splash (impede que ela fique visível)
        SplashScreen.hideAsync().catch(() => {});
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
                                title: "EVENT",
                                headerBackTitle: "Voltar",
                                headerBackVisible: true,
                            }}
                        />
                        <Stack.Screen
                            name="event_users"
                            options={{
                                headerShown: true,
                                title: "Lista de Presença",
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
                        <Stack.Screen name="+not-found" />
                    </StackHeader>
                    <StatusBar style="auto" />
                </ColorCoalitionProvider>
            </ThemeProvider>
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
