import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import useAlert from "@/hooks/useAlert";
import { useColorScheme } from "@/hooks/useColorScheme";
import { fetchRatings, rate, RatingResult } from "@/repository/eventRepository";
import {
    FontAwesome,
    MaterialCommunityIcons,
    MaterialIcons,
} from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Button,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function MealDetailScreen() {
    const isWeb = Platform.OS === "web";
    const colorScheme = useColorScheme();
    const { color } = useColorCoalition();
    const { showError, showSuccess } = useAlert();
    const [rating, setRating] = useState<RatingResult>();
    const [userRating, setUserRating] = useState<number>(0);
    const starsToShow = rating?.userRating ?? userRating; // userRating = estado local para seleção
    const { userId, campusId, cursusId, mealData } = useLocalSearchParams<{
        userId: string;
        campusId: string;
        cursusId: string;
        mealData: string;
    }>();
    const meal = JSON.parse(mealData);
    const colorCard = colorScheme === "dark" ? "#333" : "#fff";
    const colorDivider = colorScheme === "dark" ? "#333" : "#eee";

    useEffect(() => {
        const unsubscribe = fetchRatings(
            campusId,
            cursusId,
            "meals",
            meal.id,
            userId,
            setRating
        );
        return () => unsubscribe();
    }, [meal]);

    if (!meal) {
        return (
            <ThemedText style={{ margin: 32, textAlign: "center" }}>
                Refeição não encontrada.
            </ThemedText>
        );
    }

    return (
        <>
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
                    <ThemedView darkColor="#222" style={styles.card}>
                        <ThemedText style={styles.type}>{meal.type}</ThemedText>
                        <View
                            style={[
                                styles.divider,
                                { backgroundColor: colorDivider },
                            ]}
                        />
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
                        {/* Rating Section */}
                        <ThemedView
                            darkColor="#333"
                            style={[styles.ratingContainer]}
                        >
                            <View style={styles.ratingLeft}>
                                <Text style={styles.ratingValue}>
                                    {rating?.ratingValue?.toFixed(1) ?? "-"}
                                </Text>
                                <View style={styles.starsRow}>
                                    {rating?.stars.map((star, i) => (
                                        <FontAwesome
                                            key={i}
                                            name={
                                                star === "star-half"
                                                    ? "star-half-full"
                                                    : star
                                            }
                                            size={28}
                                            color="#FFD700"
                                            style={{ marginRight: 2 }}
                                        />
                                    ))}
                                </View>
                                <Text style={styles.ratingCount}>
                                    {rating?.ratingCount ?? 0} avaliações
                                </Text>
                            </View>
                            <View style={styles.ratingRight}>
                                {!rating?.userRating && (
                                    <Text style={styles.tapToRate}>
                                        Toque para avaliar
                                    </Text>
                                )}
                                <View style={styles.starsRowSmall}>
                                    {[...Array(5)].map((_, i) => (
                                        <FontAwesome
                                            key={i}
                                            name={
                                                i < starsToShow
                                                    ? "star"
                                                    : "star-o"
                                            }
                                            size={22}
                                            color={
                                                i < starsToShow
                                                    ? "#FFD700"
                                                    : "#B0B0B0"
                                            }
                                            style={{ marginRight: 1 }}
                                            onPress={
                                                rating?.userRating
                                                    ? undefined // desabilita clique se já avaliou
                                                    : () => setUserRating(i + 1)
                                            }
                                        />
                                    ))}
                                </View>
                                <Button
                                    title={
                                        rating?.userRating
                                            ? `${rating.userRating} estrela${
                                                  rating.userRating > 1
                                                      ? "s"
                                                      : ""
                                              }`
                                            : "Enviar Avaliação"
                                    }
                                    onPress={() => {
                                        if (!rating?.userRating) {
                                            rate(
                                                campusId,
                                                cursusId,
                                                "meals",
                                                meal.id,
                                                userId,
                                                userRating,
                                                () =>
                                                    showSuccess(
                                                        "SUCESSO",
                                                        "Avaliação enviada com sucesso!"
                                                    ),
                                                (error) =>
                                                    showError(
                                                        "ERRO",
                                                        error.message
                                                    )
                                            );
                                        }
                                    }}
                                    disabled={
                                        !!rating?.userRating || userRating === 0
                                    }
                                />
                            </View>
                        </ThemedView>
                        <View
                            style={[
                                styles.divider,
                                { backgroundColor: colorDivider },
                            ]}
                        />
                        <Text style={styles.date}>{meal.createdDate}</Text>
                        <Text style={styles.qty}>
                            Quantidade: {meal.quantity} /{" "}
                            {meal.numberSubscribed}
                        </Text>
                    </ThemedView>
                    <View style={styles.fabRow}>
                        <TouchableOpacity
                            style={[styles.fab, { backgroundColor: colorCard }]}
                        >
                            <MaterialCommunityIcons
                                name="qrcode"
                                size={44}
                                color="#3A86FF"
                            />
                            {/* <Text style={styles.fabText}>QR Code</Text> */}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.fab, { backgroundColor: colorCard }]}
                        >
                            <MaterialCommunityIcons
                                name="clipboard-list-outline"
                                size={44}
                                color="#3A86FF"
                            />
                            {/* <Text style={styles.fabText}>Inscrições</Text> */}
                        </TouchableOpacity>
                    </View>
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
        padding: 20,
        width: "95%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    type: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 8,
    },
    divider: {
        width: "100%",
        height: 1,
        marginVertical: 8,
    },
    name: {
        fontSize: 20,
        fontWeight: "normal",
        textAlign: "center",
        marginBottom: 4,
        fontStyle: "italic",
    },
    desc: {
        fontSize: 15,
        textAlign: "center",
        marginBottom: 12,
        color: "#444",
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
        marginTop: 12,
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
        marginVertical: 24,
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
    ratingContainer: {
        flexDirection: "row",
        borderRadius: 18,
        marginHorizontal: 4,
        padding: 18,
        marginBottom: 18,
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.07,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    ratingLeft: {
        flex: 1,
        alignItems: "center",
        borderRightWidth: 1,
        borderRightColor: "#F0F0F0",
        paddingRight: 12,
    },
    ratingValue: {
        fontSize: 38,
        fontWeight: "bold",
        color: "#3A86FF",
        marginBottom: 2,
    },
    starsRow: {
        flexDirection: "row",
        marginBottom: 2,
    },
    ratingCount: {
        color: "#888",
        fontSize: 13,
        marginTop: 2,
    },
    ratingRight: {
        flex: 1,
        alignItems: "center",
        paddingLeft: 12,
    },
    tapToRate: {
        color: "#3A86FF",
        fontWeight: "bold",
        fontSize: 15,
        marginBottom: 4,
    },
    starsRowSmall: {
        flexDirection: "row",
    },
    inner: {
        width: "100%",
        maxWidth: 600, // limite superior
        minWidth: 480, // limite inferior (opcional)
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
});
