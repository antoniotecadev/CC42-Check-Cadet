import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function QrCodeScreen() {
    const { color } = useColorCoalition();
    const { content, title, description } = useLocalSearchParams();

    return (
        <>
            <Stack.Screen
                options={{
                    headerStyle: {
                        backgroundColor: color,
                    },
                }}
            />
            <View
                style={{
                    flex: 1,
                    backgroundColor: "#fff",
                }}
            >
                {/* Top section: título e descrição */}
                <View
                    style={{
                        paddingTop: 16,
                        paddingHorizontal: 24,
                    }}
                >
                    <Text
                        style={{
                            textAlign: "center",
                            color: "#000",
                            fontSize: 16,
                            fontWeight: "bold",
                        }}
                    >
                        {title || ""}
                    </Text>
                    <Text
                        style={{
                            marginTop: 8,
                            color: "#333",
                            textAlign: "center",
                        }}
                        numberOfLines={3}
                        ellipsizeMode="tail"
                    >
                        {description || ""}
                    </Text>
                </View>
                {/* QR code centralizado */}
                <View
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    <QRCode value={content?.toString() || ""} size={360} />
                </View>
            </View>
        </>
    );
}
