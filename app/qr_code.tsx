import { useLocalSearchParams } from "expo-router";
import React from "react";
import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function QrCodeScreen() {
    const { content } = useLocalSearchParams();

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#fff",
            }}
        >
            <QRCode value={content.toString() || ""} size={400} />
        </View>
    );
}
