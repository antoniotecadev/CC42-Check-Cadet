import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import useAlert from "@/hooks/useAlert";
import { useColorScheme } from "@/hooks/useColorScheme";
import { fetchRatings, rate, RatingResult } from "@/repository/eventRepository";
import { encrypt } from "@/utility/AESUtil";
import { getEventDuration, getTimeUntilEvent } from "@/utility/DateUtil";
import {
    FontAwesome,
    MaterialCommunityIcons,
    MaterialIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    Animated,
    Button,
    Dimensions,
    ImageBackground,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width: windowWidth } = Dimensions.get("window");
const CARD_MARGIN = 18;
const CARD_GAP = 8;
const infoCardWidth =
    Platform.OS === "web"
        ? Math.min(120, (windowWidth - CARD_MARGIN * 2 - CARD_GAP * 3) / 4)
        : (windowWidth - CARD_MARGIN * 2 - CARD_GAP * 3) / 4;

const HEADER_IMAGE = require("../assets/images/back_default_42_16_9_horizontal.png");
const QR_ICON = "qrcode";
const ATTENDANCE_ICON = "clipboard-list-outline";

const EventDetailScreen = () => {
    const isWeb = Platform.OS === "web";
    const colorScheme = useColorScheme();
    const { showError, showSuccess } = useAlert();
    const [rating, setRating] = useState<RatingResult>();
    const { userData, eventData } = useLocalSearchParams();
    const [userRating, setUserRating] = React.useState<number>(0);
    const user = typeof userData === "string" ? JSON.parse(userData) : null;
    const event = typeof eventData === "string" ? JSON.parse(eventData) : null;

    const color = colorScheme === "dark" ? "#333" : "#fff";

    // Se o usuário já avaliou, mostra a nota dele, senão mostra o que ele está selecionando
    const starsToShow = rating?.userRating ?? userRating; // userRating = estado local para seleção

    // Animation for floating buttons
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.92,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            useNativeDriver: true,
        }).start();
    };

    React.useEffect(() => {
        const unsubscribe = fetchRatings(
            user?.campusId,
            event?.cursus_ids[0],
            "events",
            event?.id,
            user?.id,
            setRating
        );
        return () => unsubscribe();
    }, [event]);

    return (
        <ThemedView style={[styles.container, isWeb ? styles.inner : {}]}>
            <ScrollView showsVerticalScrollIndicator={isWeb}>
                {/* Header with image and gradient */}
                <View style={styles.headerContainer}>
                    <ImageBackground
                        source={HEADER_IMAGE}
                        style={styles.headerImage}
                        resizeMode="cover"
                    >
                        <LinearGradient
                            colors={[
                                "rgba(0,0,0,0.7)",
                                "rgba(0,0,0,0.2)",
                                "transparent",
                            ]}
                            style={styles.headerGradient}
                        />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.kind}>{event?.kind}</Text>
                            <Text style={styles.title}>{event?.name}</Text>
                            <Text style={styles.date}>
                                {new Date(event?.begin_at).toLocaleString()}
                            </Text>
                        </View>
                    </ImageBackground>
                </View>

                {/* Quick Info Cards */}
                <View style={styles.infoRow}>
                    <View
                        style={[
                            styles.infoCard,
                            { width: infoCardWidth, backgroundColor: color },
                        ]}
                    >
                        <MaterialIcons
                            name="access-time"
                            size={22}
                            color="#3A86FF"
                        />
                        <Text style={styles.infoText}>
                            {getEventDuration(event?.begin_at, event?.end_at)}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.infoCard,
                            { width: infoCardWidth, backgroundColor: color },
                        ]}
                    >
                        <MaterialIcons
                            name="calendar-today"
                            size={22}
                            color="#3A86FF"
                        />
                        <Text style={styles.infoText}>
                            {getTimeUntilEvent(event?.begin_at)}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.infoCard,
                            { width: infoCardWidth, backgroundColor: color },
                        ]}
                    >
                        <MaterialIcons
                            name="location-on"
                            size={22}
                            color="#3A86FF"
                        />
                        <Text style={styles.infoText}>{event?.location}</Text>
                    </View>
                    <View
                        style={[
                            styles.infoCard,
                            { width: infoCardWidth, backgroundColor: color },
                        ]}
                    >
                        <MaterialIcons
                            name="people-outline"
                            size={22}
                            color="#3A86FF"
                        />
                        <Text style={styles.infoText}>
                            {event?.nbr_subscribers || 0}/
                            {event?.max_people || 0}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                <View style={[styles.card, { backgroundColor: color }]}>
                    <Text style={styles.sectionTitle}>Descrição</Text>
                    <ThemedText style={styles.description}>
                        {event?.description}
                    </ThemedText>
                </View>
                {/* Rating Section */}
                <View
                    style={[styles.ratingContainer, { backgroundColor: color }]}
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
                                    name={i < starsToShow ? "star" : "star-o"}
                                    size={22}
                                    color={
                                        i < starsToShow ? "#FFD700" : "#B0B0B0"
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
                                          rating.userRating > 1 ? "s" : ""
                                      }`
                                    : "Enviar Avaliação"
                            }
                            onPress={() => {
                                if (!rating?.userRating) {
                                    rate(
                                        user?.campusId,
                                        event?.cursus_ids[0],
                                        "events",
                                        event?.id,
                                        user?.id,
                                        userRating,
                                        () =>
                                            showSuccess(
                                                "SUCESSO",
                                                "Avaliação enviada com sucesso!"
                                            ),
                                        (error) =>
                                            showError("ERRO", error.message)
                                    );
                                }
                            }}
                            disabled={!!rating?.userRating || userRating === 0}
                        />
                    </View>
                </View>

                {/* Floating Action Buttons */}
                <View style={styles.fabRow}>
                    <Animated.View
                        style={[
                            styles.fabWrapper,
                            { transform: [{ scale: scaleAnim }] },
                        ]}
                    >
                        <TouchableOpacity
                            style={[styles.fab, { backgroundColor: color }]}
                            activeOpacity={0.8}
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                            onPress={() =>
                                router.push({
                                    pathname: "/qr_code",
                                    params: {
                                        content: encrypt(
                                            "cc42event" +
                                                event?.id +
                                                "#" +
                                                user?.id
                                        ),
                                        title: event?.kind,
                                        description: event?.name,
                                        isEvent: "true",
                                        userId: user?.id,
                                        campusId: user?.campusId,
                                        cursusId: event?.cursus_ids[0],
                                    },
                                })
                            }
                        >
                            <MaterialCommunityIcons
                                name={QR_ICON}
                                size={44}
                                color="#3A86FF"
                            />
                            {/* <Text style={styles.fabLabel}>QR Code</Text> */}
                        </TouchableOpacity>
                    </Animated.View>
                    <Animated.View
                        style={[
                            styles.fabWrapper,
                            { transform: [{ scale: scaleAnim }] },
                        ]}
                    >
                        <TouchableOpacity
                            style={[styles.fab, { backgroundColor: color }]}
                            activeOpacity={0.8}
                            onPressIn={handlePressIn}
                            onPressOut={handlePressOut}
                        >
                            <MaterialCommunityIcons
                                name={ATTENDANCE_ICON}
                                size={44}
                                color="#3A86FF"
                            />
                            {/* <Text style={styles.fabLabel}>Lista Presença</Text> */}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>
        </ThemedView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        height: 220,
        width: "100%",
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        overflow: "hidden",
        marginBottom: 12,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    headerImage: {
        flex: 1,
        width: "100%",
        justifyContent: "flex-end",
    },
    headerGradient: {
        ...StyleSheet.absoluteFillObject,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTextContainer: {
        alignItems: "center",
        paddingBottom: 24,
    },
    inner: {
        width: "100%",
        maxWidth: 600, // limite superior
        minWidth: 480, // limite inferior (opcional)
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
    kind: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "bold",
        letterSpacing: 2,
        textShadowColor: "#000",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
        textTransform: "uppercase",
    },
    title: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 6,
        textShadowColor: "#000",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 6,
        textAlign: "center",
    },
    date: {
        color: "#E0E0E0",
        fontSize: 13,
        marginTop: 6,
        textShadowColor: "#000",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 4,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 18,
        marginTop: -32,
        marginBottom: 18,
    },
    infoCard: {
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 10,
        alignItems: "center",
        //width: (width - 56) / 4,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    infoText: {
        textAlign: "center",
        marginTop: 6,
        color: "#3A86FF",
        fontWeight: "bold",
        fontSize: 13,
    },
    card: {
        borderRadius: 18,
        marginHorizontal: 18,
        padding: 18,
        marginBottom: 18,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.07,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "bold",
        color: "#3A86FF",
        marginBottom: 8,
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: "sans-serif-light",
    },
    ratingContainer: {
        flexDirection: "row",
        borderRadius: 18,
        marginHorizontal: 18,
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
    fabRow: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: 10,
        marginBottom: 32,
    },
    fabWrapper: {
        elevation: 6,
        shadowColor: "#3A86FF",
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        borderRadius: 50,
    },
    fab: {
        width: 90,
        height: 90,
        borderRadius: 45,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 8,
        marginBottom: 4,
    },
    fabLabel: {
        color: "#3A86FF",
        fontWeight: "bold",
        fontSize: 13,
        marginTop: 4,
    },
});

export default EventDetailScreen;
