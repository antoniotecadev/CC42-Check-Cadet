import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { useColorScheme } from "@/hooks/useColorScheme";
import { MaterialIcons } from "@expo/vector-icons";

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const { color } = useColorCoalition();

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
                        maxWidth: 480, // limite superior
                        minWidth: 600, // limite inferior (opcional)
                        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
                    },
                    default: {},
                }),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Início",
                    tabBarIcon: ({ color }) => (
                        <IconSymbol size={28} name="house.fill" color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="cursus"
                options={{
                    title: "Refeição",
                    headerTitle: "Cursus",
                    tabBarIcon: ({ color }) => (
                        <MaterialIcons size={28} name="restaurant" color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
