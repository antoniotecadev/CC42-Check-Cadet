import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { ThemedView } from "@/components/ThemedView";
import MealItem from "@/components/ui/MealItem";
import { database } from "@/firebaseConfig";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
    endBefore,
    limitToLast,
    onValue,
    orderByKey,
    query,
    ref,
} from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    TouchableOpacity,
} from "react-native";

interface Meal {
    id: string;
    name: string;
    type: string;
    description: string;
    createdDate: string;
    quantity: number;
    numberSubscribed: number;
    isSubscribed: boolean;
    pathImage?: string;
}

export default function MealsScreen() {
    const colorScheme = useColorScheme();
    const { color } = useColorCoalition();
    const { campusId, cursusId, cursusName } = useLocalSearchParams<{
        campusId: string;
        cursusId: string;
        cursusName: string;
    }>();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastKey, setLastKey] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [endReached, setEndReached] = useState(false);

    const fetchMeals = useCallback(
        (startAtKey: string | null = null, append = false) => {
            if (!campusId || !cursusId) return;
            setLoading(true);
            let mealsRef = ref(
                database,
                `campus/${campusId}/cursus/${cursusId}/meals`
            );
            let q = query(mealsRef, orderByKey());
            if (startAtKey) {
                q = query(
                    mealsRef,
                    orderByKey(),
                    endBefore(startAtKey),
                    limitToLast(15)
                );
            } else {
                q = query(mealsRef, orderByKey(), limitToLast(15));
            }
            onValue(
                q,
                (snapshot) => {
                    const mealList: Meal[] = [];
                    let newLastKey: string | null = null;
                    snapshot.forEach((dataSnapshot) => {
                        const meal = dataSnapshot.val();
                        meal.id = dataSnapshot.key;
                        meal.numberSubscribed =
                            dataSnapshot.child?.("subscriptions")?.size || 0;
                        meal.quantity = Math.max(
                            (meal.quantity || 0) - meal.numberSubscribed,
                            0
                        );
                        meal.isSubscribed = false; // Adapte para lógica do usuário
                        mealList.push(meal);
                        newLastKey = dataSnapshot.key;
                    });
                    mealList.reverse();
                    setMeals((prev) =>
                        append ? [...prev, ...mealList] : mealList
                    );
                    setLastKey(newLastKey);
                    setLoading(false);
                    setEndReached(mealList.length < 15);
                },
                { onlyOnce: true }
            );
        },
        [campusId, cursusId]
    );

    useEffect(() => {
        fetchMeals(null, false);
    }, [fetchMeals]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchMeals(null, false);
        setRefreshing(false);
    };

    const loadMore = () => {
        if (!endReached && lastKey) {
            fetchMeals(lastKey, true);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    title: cursusName || "Refeições",
                }}
            />
            <ThemedView
                lightColor="#fff"
                style={[
                    styles.container,
                    Platform.OS === "web" ? styles.inner : {},
                ]}
            >
                {loading && (
                    <ActivityIndicator
                        size="large"
                        color={color}
                        style={{ marginTop: 16 }}
                    />
                )}
                <FlashList
                    data={meals}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => {
                                router.push({
                                    pathname: "/meal_detail",
                                    params: {
                                        campusId,
                                        cursusId,
                                        mealData: JSON.stringify(item),
                                    },
                                });
                            }}
                        >
                            <MealItem
                                item={item}
                                color={color}
                                borderColor={
                                    colorScheme === "light" ? "#eee" : "#333"
                                }
                            />
                        </TouchableOpacity>
                    )}
                    estimatedItemSize={70}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.2}
                />
                {Platform.OS === "web" && (
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: color }]}
                        onPress={onRefresh}
                    >
                        <Ionicons name="refresh" size={28} color="#fff" />
                    </TouchableOpacity>
                )}
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    item: { padding: 16, borderBottomWidth: 1, borderColor: "#eee" },
    name: { fontWeight: "bold", fontSize: 16 },
    type: { fontSize: 12, color: "#888" },
    desc: { fontSize: 12 },
    qty: { fontSize: 12, color: "#007AFF" },
    date: { fontSize: 10, color: "#888" },
    sub: { fontSize: 12, fontWeight: "bold" },
    fab: {
        position: "absolute",
        bottom: 32,
        right: 24,
        borderRadius: 25,
        width: 50,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
    },
    inner: {
        width: "100%",
        maxWidth: 600, // limite superior
        minWidth: 480, // limite inferior (opcional)
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
});
