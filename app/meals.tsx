import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import CreateMealModal from "@/components/ui/CreateMealModal";
import MealItem from "@/components/ui/MealItem";
import { database } from "@/firebaseConfig";
import useAlert from "@/hooks/useAlert";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useCreateMeal } from "@/hooks/useCreateMeal";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import {
    endBefore,
    limitToLast,
    onValue,
    orderByKey,
    query,
    ref,
} from "firebase/database";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import {
    ActionSheetIOS,
    ActivityIndicator,
    Platform,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
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
    const { showConfirm } = useAlert();
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const { color } = useColorCoalition();
    const { height } = useWindowDimensions();
    const { deleteMealFromFirebase } = useCreateMeal();

    const isWeb = Platform.OS === "web";
    const { userId, campusId, campusName, cursusId, cursusName } =
        useLocalSearchParams<{
            userId: string;
            campusId: string;
            campusName: string;
            cursusId: string;
            cursusName: string;
        }>();
    const [loading, setLoading] = useState(true);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [endReached, setEndReached] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastKey, setLastKey] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editMeal, setEditMeal] = useState<Meal | null>(null);

    const fetchMeals = useCallback(
        (startAtKey: string | null = null, append = false) => {
            if (!campusId || !cursusId) return;
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
                        const subscription =
                            dataSnapshot.child("subscriptions");
                        meal.id = dataSnapshot.key;
                        meal.numberSubscribed = subscription?.size || 0;
                        meal.quantity = Math.max(
                            (meal.quantity || 0) - meal.numberSubscribed,
                            0
                        );
                        if (subscription.exists()) {
                            subscription.forEach((sub) => {
                                if (sub.key === userId) {
                                    meal.isSubscribed = true;
                                    return;
                                }
                            });
                        }
                        mealList.push(meal);
                        newLastKey = dataSnapshot.key;
                    });
                    mealList.reverse();
                    setMeals((prev) => {
                        let newMeals = append
                            ? [...prev, ...mealList]
                            : mealList;
                        // Remover duplicatas pelo id
                        const uniqueMeals = new Map();
                        newMeals.forEach((m) => uniqueMeals.set(m.id, m));
                        return Array.from(uniqueMeals.values());
                    });
                    setLastKey(newLastKey);
                    setLoading(false);
                    setRefreshing(false);
                    setLoadingMore(false);
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

    const onRefresh = (doRefresh = true) => {
        if (doRefresh) setRefreshing(true);
        fetchMeals(null, false);
    };

    const loadMore = () => {
        if (!endReached && lastKey) {
            setLoadingMore(true);
            fetchMeals(lastKey, true);
        }
    };

    const handleMenuPress = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ["Criar Refeição", "Cancelar"],
                cancelButtonIndex: 1,
                userInterfaceStyle: "dark",
            },
            (selectedIndex) => {
                if (selectedIndex === 0) setShowCreateModal(true);
            }
        );
    };

    const handleItemLongPress = (item: Meal) => {
        if (isWeb) setEditMeal(item);
        else
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ["Editar", "Eliminar", "Cancelar"],
                    destructiveButtonIndex: 1,
                    cancelButtonIndex: 2,
                    userInterfaceStyle: "dark",
                },
                (selectedIndex) => {
                    if (selectedIndex === 0) setEditMeal(item);
                    if (selectedIndex === 1) {
                        showConfirm(
                            "Eliminar",
                            item.name,
                            async () => {
                                await deleteMealFromFirebase(
                                    campusId,
                                    cursusId,
                                    { id: item.id, pathImage: item.pathImage },
                                    onRefresh
                                );
                            },
                            () => null
                        );
                    }
                }
            );
    };

    useLayoutEffect(() => {
        navigation.setOptions &&
            navigation.setOptions({
                title: cursusName || "Refeições",
                headerRight: () =>
                    isWeb ? (
                        <TouchableOpacity
                            onPress={() => setShowCreateModal(true)}
                            style={{ marginRight: 16 }}
                        >
                            <MaterialCommunityIcons
                                name="card-plus"
                                size={28}
                            />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleMenuPress}>
                            <MaterialCommunityIcons
                                name="dots-vertical"
                                size={28}
                            />
                        </TouchableOpacity>
                    ),
            });
    }, [navigation, color]);

    return (
        <>
            <CreateMealModal
                key={0}
                visible={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                campusId={campusId}
                cursusId={cursusId}
                campusName={campusName}
                userId={userId}
                onCreated={() => onRefresh(false)}
            />
            <CreateMealModal
                key={1}
                visible={!!editMeal}
                onClose={() => setEditMeal(null)}
                campusId={campusId}
                cursusId={cursusId}
                campusName={campusName}
                userId={userId}
                initialMeal={editMeal}
                editMode={true}
                onCreated={() => {
                    setEditMeal(null);
                    onRefresh(false);
                }}
            />
            <ThemedView
                lightColor="#fff"
                style={[styles.container, isWeb ? styles.inner : {}]}
            >
                {((isWeb && refreshing) || loading) && (
                    <ActivityIndicator
                        size="large"
                        color={color}
                        style={[
                            { marginTop: 16 },
                            loading
                                ? {
                                      alignItems: "center",
                                      justifyContent: "center",
                                      marginTop: height / 2.5,
                                  }
                                : null,
                        ]}
                    />
                )}
                {!loading && !meals.length && (
                    <ThemedView
                        style={{
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            width: "100%",
                            marginTop: height / 4,
                        }}
                    >
                        <ThemedText style={{ textAlign: "center" }}>
                            Refeições não encontradas 😪
                        </ThemedText>
                    </ThemedView>
                )}
                <FlashList
                    data={meals}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onLongPress={() => handleItemLongPress(item)}
                            onPress={() => {
                                router.push({
                                    pathname: "/meal_details",
                                    params: {
                                        userId,
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
                    ListFooterComponent={
                        loadingMore ? (
                            <ActivityIndicator
                                size="small"
                                color={color}
                                style={{ margin: 16 }}
                            />
                        ) : null
                    }
                    estimatedItemSize={76}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.2}
                />
                {isWeb && (
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: color }]}
                        onPress={() => onRefresh()}
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
    alignText: {
        alignSelf: "center",
        justifyContent: "center",
    },
});
