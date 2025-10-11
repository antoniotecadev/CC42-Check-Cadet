import { Tabs } from "expo-router";
import React, { useEffect, useState } from "react";
import { Platform } from "react-native";

import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import useItemStorage from "@/hooks/storage/useItemStorage";
import { useFirebaseNotificationListener } from "@/hooks/useFirebaseNotificationListener";
import { t } from "@/i18n";
import { MaterialIcons } from "@expo/vector-icons";

export default function TabLayout() {
    const { color } = useColorCoalition();

    if (Platform.OS === "web") {
        const { getItem } = useItemStorage();

        const [campusId, setCampusId] = useState<string | null>(null);
        const [cursusId, setCursusId] = useState<string | null>(null);

        // Carrega campusId e cursusId do storage
        useEffect(() => {
            const loadStorageData = async () => {
                const [campusIdValue, cursusIdValue] = await Promise.all([
                    getItem("campus_id"),
                    getItem("cursus_id"),
                ]);
                setCampusId(campusIdValue);
                setCursusId(cursusIdValue);
            };
            loadStorageData();
        }, [getItem]);

        // Inicializa os listeners do Firebase para notificações (só na web)
        const { isListening } = useFirebaseNotificationListener({
            campusId: campusId || "",
            cursusId: cursusId || "",
            enabled: Platform.OS === "web" && !!campusId && !!cursusId,
        });

        useEffect(() => {
            if (isListening) {
                console.log("🔔 Listeners de notificação Firebase activos!");
            }
        }, [isListening]);
    }
    return (
        <Tabs
            screenOptions={{
                // tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
                tabBarActiveTintColor: color,
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarBackground: TabBarBackground,
                tabBarStyle: Platform.select({
                    ios: {
                        // Use a transparent background on iOS to show the blur effect
                        position: "absolute",
                    },
                    web: {
                        width: "100%",
                        maxWidth: 600, // limite superior
                        minWidth: 320, // limite inferior (opcional)
                        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
                    },
                    default: {},
                }),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: t("tabs.home"),
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={28} name="house.fill" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cursus"
                options={{
                    title: t("tabs.meals"),
                    headerTitle: t("cursus.title"),
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons
                            size={28}
                            name="restaurant"
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="manual_location"
                options={{
                    title: t("location.title"),
                    headerTitle: t("location.manualLocation"),
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons
                            size={28}
                            name="location-on"
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
