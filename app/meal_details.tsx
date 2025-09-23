import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import MessageModal from "@/components/ui/MessageModal";
import RatingSection from "@/components/ui/RatingSection";
import useItemStorage from "@/hooks/storage/useItemStorage";
import { showAlert } from "@/hooks/useAlert";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
    observeSecondPortion,
    subscribeSecondPortion,
} from "@/repository/mealRepository";
import { encrypt } from "@/utility/AESUtil";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function MealDetailScreen() {
    const [staff, setStaff] = useState<boolean>(false);

    const isWeb = Platform.OS === "web";
    const colorScheme = useColorScheme();
    const { getItem } = useItemStorage();
    const { color } = useColorCoalition();
    const { userId, campusId, cursusId, mealData } = useLocalSearchParams<{
        userId: string;
        campusId: string;
        cursusId: string;
        mealData: string;
    }>();
    const meal = JSON.parse(mealData);
    const colorCard = colorScheme === "dark" ? "#333" : "#fff";

    const [modalData, setModalData] = useState<{
        modalVisible: boolean;
        title: string;
        message: string;
        color: string;
        imageSource?: { uri: string } | undefined;
    }>({
        modalVisible: false,
        title: "",
        message: "",
        color: "#3A86FF",
    });

    useEffect(() => {
        const status = async () => {
            const result = (await getItem("staff")) as any;
            setStaff(result === "true");
        };
        status();
    }, [getItem]);

    // second portion state
    const [secondInfo, setSecondInfo] = useState<{
        enabled: boolean;
        subscribed: boolean;
        received: boolean;
        quantity?: number | null;
    } | null>(null);
    const [loadingSecond, setLoadingSecond] = useState(false);

    useEffect(() => {
        if (!campusId || !cursusId || !meal?.id || !userId) return;
        const off = observeSecondPortion(
            String(campusId),
            String(cursusId),
            String(meal.id),
            String(userId),
            (data) => {
                setSecondInfo(data);
            }
        );
        return () => off && off();
    }, [campusId, cursusId, meal?.id, userId]);

    if (!meal) {
        return (
            <ThemedText style={{ margin: 32, textAlign: "center" }}>
                Refeição não encontrada.
            </ThemedText>
        );
    }

    return (
        <>
            <MessageModal
                visible={modalData.modalVisible}
                title={modalData.title}
                message={modalData.message}
                color={modalData.color}
                imageSource={
                    modalData.imageSource ?? require("@/assets/images/icon.png")
                }
                buttonText="OK"
                onClose={() =>
                    setModalData({ ...modalData, modalVisible: false })
                }
            />
            <Stack.Screen
                options={{
                    title: "Detalhes",
                }}
            />
            <ThemedView
                lightColor={"#f7f7f7"}
                style={[styles.container, isWeb ? styles.inner : {}]}
            >
                <ScrollView showsVerticalScrollIndicator={isWeb}>
                    <ThemedView darkColor="#333" style={styles.card}>
                        <ThemedText style={styles.type}>{meal.type}</ThemedText>
                        <ThemedText style={styles.name}>{meal.name}</ThemedText>
                        <Text style={styles.desc}>{meal.description}</Text>
                        {meal.pathImage ? (
                            <Image
                                source={{ uri: meal.pathImage }}
                                style={styles.image}
                                contentFit="cover"
                            />
                        ) : (
                            <MaterialIcons
                                size={100}
                                color={color}
                                name="restaurant"
                            />
                        )}
                        <Text style={styles.date}>{meal.createdDate}</Text>
                        <Text style={styles.qty}>
                            Quantidade: {meal.quantityNotReceived}{" "}
                            {meal.numberSubscribed
                                ? "/ " + meal.numberSubscribed
                                : ""}
                        </Text>
                    </ThemedView>
                    <RatingSection
                        color={colorCard}
                        campusId={campusId}
                        cursusId={cursusId}
                        type="meals"
                        typeId={meal.id}
                        userId={userId}
                    />
                    {/* Second portion subscribe button */}
                    <View style={{ margin: 16 }}>
                        <TouchableOpacity
                            disabled={
                                !(
                                    secondInfo?.enabled &&
                                    !secondInfo.subscribed
                                ) || loadingSecond
                            }
                            onPress={async () => {
                                setLoadingSecond(true);
                                const res = await subscribeSecondPortion(
                                    String(campusId),
                                    String(cursusId),
                                    String(meal.id),
                                    String(userId)
                                );
                                if (res.success) {
                                    setLoadingSecond(false);
                                    setModalData({
                                        modalVisible: true,
                                        title: "Sucesso",
                                        message:
                                            meal.name + "\nInscrição feita",
                                        color: "#4caf50ff",
                                    });
                                } else {
                                    setLoadingSecond(false);
                                    showAlert(
                                        "Aviso",
                                        res.message ||
                                            "Não foi possível inscrever-se na segunda via"
                                    );
                                }
                            }}
                            style={[
                                styles.button,
                                {
                                    backgroundColor:
                                        secondInfo == null
                                            ? "#BDBDBD"
                                            : secondInfo?.subscribed
                                            ? secondInfo.received
                                                ? "#4caf50ff"
                                                : "#007AFF"
                                            : secondInfo.enabled
                                            ? "#4caf50ff"
                                            : "#e53935ff",
                                },
                            ]}
                        >
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>
                                {loadingSecond
                                    ? "Processando..."
                                    : secondInfo
                                    ? secondInfo.subscribed
                                        ? secondInfo.received
                                            ? "RECEBEU SEGUNDA VIA"
                                            : "INSCRIÇÃO FEITA"
                                        : secondInfo.enabled
                                        ? "INSCREVER - SE"
                                        : "SEGUNDA VIA TERMINOU"
                                    : "SEGUNDA VIA INDISPONÍVEL"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {staff && (
                        <View style={styles.fabRow}>
                            <TouchableOpacity
                                onPress={() =>
                                    router.push({
                                        pathname: "/qr_code",
                                        params: {
                                            content: encrypt(
                                                "cc42meal" +
                                                    meal.id +
                                                    "#" +
                                                    userId
                                            ),
                                            title: meal?.name,
                                            description: meal?.description,
                                            isEvent: "false",
                                            userId: userId,
                                            campusId: campusId,
                                            cursusId: cursusId,
                                        },
                                    })
                                }
                                style={[
                                    styles.fab,
                                    { backgroundColor: colorCard },
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name="qrcode"
                                    size={44}
                                    color="#3A86FF"
                                />
                                {/* <Text style={styles.fabText}>QR Code</Text> */}
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    router.push({
                                        pathname: "/meal_users",
                                        params: {
                                            type: "meals",
                                            mealId: meal.id,
                                            userId: userId,
                                            campusId: campusId,
                                            cursusId: cursusId,
                                            mealName: meal.name,
                                            mealCreatedDate: meal.createdDate,
                                        },
                                    });
                                }}
                                style={[
                                    styles.fab,
                                    { backgroundColor: colorCard },
                                ]}
                            >
                                <MaterialCommunityIcons
                                    name="clipboard-list-outline"
                                    size={44}
                                    color="#3A86FF"
                                />
                                {/* <Text style={styles.fabText}>Inscrições</Text> */}
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        borderRadius: 12,
        elevation: 4,
        margin: 16,
        padding: 12,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    button: {
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "stretch",
    },
    type: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 8,
    },
    name: {
        fontSize: 16,
        fontWeight: "normal",
        textAlign: "center",
        marginBottom: 4,
    },
    desc: {
        fontSize: 15,
        textAlign: "center",
        marginBottom: 12,
        color: "#888",
    },
    image: {
        width: "100%",
        height: 300,
        borderRadius: 10,
        marginBottom: 16,
        backgroundColor: "#eee",
    },
    date: {
        fontSize: 13,
        color: "#888",
        textAlign: "center",
    },
    qty: {
        fontSize: 15,
        color: "#007AFF",
        textAlign: "center",
        marginTop: 4,
        fontWeight: "bold",
    },
    fabRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 24,
    },
    fab: {
        borderRadius: 50,
        width: 90,
        height: 90,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        marginHorizontal: 8,
    },
    fabIcon: {
        width: 40,
        height: 40,
        marginBottom: 6,
    },
    fabText: {
        fontSize: 13,
        fontWeight: "bold",
        color: "#007AFF",
    },
    inner: {
        width: "100%",
        maxWidth: 600, // limite superior
        minWidth: 480, // limite inferior (opcional)
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
});
