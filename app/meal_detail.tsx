import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { ThemedText } from "@/components/ThemedText";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams } from "expo-router";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function MealDetailScreen() {
    const { color } = useColorCoalition();
    const { campusId, cursusId, mealData } = useLocalSearchParams<{
        campusId: string;
        cursusId: string;
        mealData: string;
    }>();
    const meal = JSON.parse(mealData);

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
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.card}>
                    <Text style={styles.type}>{meal.type}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.name}>{meal.name}</Text>
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
                    {/* Aqui você pode adicionar o componente de rating, média, etc. */}
                    <View style={styles.divider} />
                    <Text style={styles.date}>{meal.createdDate}</Text>
                    <Text style={styles.qty}>
                        Quantidade: {meal.quantity} / {meal.numberSubscribed}
                    </Text>
                </View>
                <View style={styles.fabRow}>
                    <TouchableOpacity style={styles.fab}>
                        <MaterialCommunityIcons
                            name="qrcode"
                            size={44}
                            color="#3A86FF"
                        />
                        {/* <Text style={styles.fabText}>QR Code</Text> */}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.fab}>
                        <MaterialCommunityIcons
                            name="clipboard-list-outline"
                            size={44}
                            color="#3A86FF"
                        />
                        {/* <Text style={styles.fabText}>Inscrições</Text> */}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        padding: 0,
        backgroundColor: "#f7f7f7",
        alignItems: "center",
    },
    card: {
        backgroundColor: "#fff",
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
        backgroundColor: "#eee",
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
        backgroundColor: "#fff",
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
});
