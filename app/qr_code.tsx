import { useColorCoalition } from "@/components/ColorCoalitionContext";
import MessageModal from "@/components/ui/MessageModal";
import {
    useInfoTmpUserEventMealListener,
    UseInfoTmpUserEventMealListenerProps,
} from "@/hooks/useInfoTmpUserEventMealListener";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

export default function QrCodeScreen() {
    const { color } = useColorCoalition();
    const { content, title, description, isEvent, userId, campusId, cursusId } =
        useLocalSearchParams();

    const [modalData, setModalData] = React.useState<{
        title: string;
        message: string;
        color: string;
        imageSource?: { uri: string } | undefined;
    }>({
        title: "",
        message: "",
        color: "#3A86FF",
    });
    const [modalVisible, setModalVisible] = React.useState(false);

    useInfoTmpUserEventMealListener({
        campusId: campusId,
        cursusId: cursusId,
        userStaffId: userId,
        isEvent: isEvent === "true",
        showModal: ({ title, message, color, imageSource }) => {
            setModalVisible(true);
            setModalData({
                title,
                message,
                color,
                imageSource,
            });
        },
    } as UseInfoTmpUserEventMealListenerProps);

    return (
        <>
            <MessageModal
                visible={modalVisible}
                title={modalData.title}
                message={modalData.message}
                color={modalData.color}
                imageSource={
                    modalData.imageSource ?? require("@/assets/images/icon.png")
                }
                buttonText="OK"
                onClose={() => setModalVisible(false)}
            />
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
