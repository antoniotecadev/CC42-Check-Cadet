import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import CreateMealModal from "@/components/ui/CreateMealModal";
import MealItem from "@/components/ui/MealItem";
import NotifyMealModal from "@/components/ui/NotifyMealModal";
import WebMenuModal from "@/components/ui/WebMenuModal";
import { database } from "@/firebaseConfig";
import useItemStorage from "@/hooks/storage/useItemStorage";
import useAlert from "@/hooks/useAlert";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useCreateMeal } from "@/hooks/useCreateMeal";
import { t } from "@/i18n";
import { Meal } from "@/model/Meal";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import {
    DataSnapshot,
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

export default function MealsScreen() {
    const { showConfirm } = useAlert();
    const { getItem } = useItemStorage();
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const { color } = useColorCoalition();
    const { height } = useWindowDimensions();
    const { deleteMealFromFirebase, onNotifyMeal } = useCreateMeal();

    const isWeb = Platform.OS === "web";
    const { userId, campusId, campusName, cursusId, cursusName } =
        useLocalSearchParams<{
            userId: string;
            campusId: string;
            campusName: string;
            cursusId: string;
            cursusName: string;
        }>();
    const [staff, setStaff] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [endReached, setEndReached] = useState<boolean>(false);
    const [loadingMore, setLoadingMore] = useState<boolean>(false);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

    const [meals, setMeals] = useState<Meal[]>([]);
    const [lastKey, setLastKey] = useState<string | null>(null);
    const [editMeal, setEditMeal] = useState<Meal | null>(null);
    const [notifyMeal, setNotifyMeal] = useState<Meal | null>(null);

    const [webMenu, setWebMenu] = useState<{
        visible: boolean;
        meal: Meal | null;
    }>({ visible: false, meal: null });

    const options = [
        { label: t('common.edit'), value: 0 },
        { label: t('meals.notify'), value: 1 },
        { label: t('common.delete'), value: 2 },
        { label: t('common.cancel'), value: 3 },
    ];

    useEffect(() => {
        const status = async () => {
            const result = (await getItem("staff")) as any;
            setStaff(result === "true");
        };
        status();
    }, [getItem]);

    const fetchMeals = useCallback(
        (startAtKey: string | null = null, append = false) => {
            if (!campusId || !cursusId) return;
            let mealsRef = ref(
                database,
                `campus/${campusId}/cursus/${cursusId}/meals`
            );
            // If user is staff, allow pagination with page size 15.
            // If not staff, always fetch only the last 7 items and disallow pagination.
            const pageSize = staff ? 15 : 7;
            let q = query(mealsRef, orderByKey());
            if (startAtKey && staff) {
                // only staff can request next pages
                q = query(
                    mealsRef,
                    orderByKey(),
                    endBefore(startAtKey),
                    limitToLast(pageSize)
                );
            } else {
                q = query(mealsRef, orderByKey(), limitToLast(pageSize));
            }
            onValue(
                q,
                (snapshot) => {
                    const mealList: Meal[] = [];
                    let newLastKey: string | null = null;
                    snapshot.forEach((dataSnapshot) => {
                        const meal = dataSnapshot.val();
                        let quantityReceived = 0;
                        const subscription: DataSnapshot =
                            dataSnapshot.child("subscriptions");
                        subscription.forEach((subSnap) => {
                            quantityReceived += subSnap.val().quantity || 0;
                        });
                        meal.id = dataSnapshot.key;
                        meal.quantityReceived = quantityReceived;
                        meal.quantityNotReceived = Math.max(
                            (meal.quantity || 0) - meal.quantityReceived,
                            0
                        );
                        meal.isSubscribed = subscription.child(userId).exists();
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
                    setEndReached(mealList.length < pageSize);
                },
                { onlyOnce: true }
            );
        },
        [campusId, cursusId, staff]
    );

    useEffect(() => {
        fetchMeals(null, false);
    }, [fetchMeals]);

    const onRefresh = (doRefresh = true) => {
        if (doRefresh) setRefreshing(true);
        fetchMeals(null, false);
    };

    const loadMore = () => {
        // Only staff can paginate. Non-staff see only the last `pageSize` items.
        if (!staff) return;
        if (!endReached && lastKey) {
            setLoadingMore(true);
            fetchMeals(lastKey, true);
        }
    };

    const handleMenuWeb = (selectedIndex: number, meal: Meal) => {
        if (selectedIndex === 0) setEditMeal(meal);
        if (selectedIndex === 1) setNotifyMeal(meal);
        if (selectedIndex === 2) {
            showConfirm(
                t('common.delete'),
                meal.name,
                async () => {
                    await deleteMealFromFirebase(
                        campusId,
                        cursusId,
                        { id: meal.id, pathImage: meal.pathImage },
                        onRefresh
                    );
                },
                () => null
            );
        }
    };

    const handleMenuPress = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: [t('meals.createMeal'), t('common.cancel')],
                cancelButtonIndex: 1,
                userInterfaceStyle: "dark",
            },
            (selectedIndex) => {
                if (selectedIndex === 0) setShowCreateModal(true);
            }
        );
    };

    const handleItemLongPress = (meal: Meal) => {
        if (isWeb) setWebMenu({ visible: true, meal });
        else
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [t('common.edit'), t('meals.notify'), t('common.delete'), t('common.cancel')],
                    destructiveButtonIndex: 2,
                    cancelButtonIndex: 3,
                    userInterfaceStyle: "dark",
                },
                (selectedIndex) => {
                    if (selectedIndex === 0) setEditMeal(meal);
                    if (selectedIndex === 1) setNotifyMeal(meal);
                    if (selectedIndex === 2) {
                        showConfirm(
                            t('common.delete'),
                            meal.name,
                            async () => {
                                await deleteMealFromFirebase(
                                    campusId,
                                    cursusId,
                                    { id: meal.id, pathImage: meal.pathImage },
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
        const colorIcon = colorScheme === "light" ? "#333" : "#fdfdfd";
        navigation.setOptions &&
            staff &&
            navigation.setOptions({
                title: cursusName || t('navigation.meals'),
                headerRight: () =>
                    isWeb ? (
                        <TouchableOpacity
                            onPress={() => setShowCreateModal(true)}
                            style={{ marginRight: 16 }}
                        >
                            <MaterialCommunityIcons
                                color={colorIcon}
                                name="card-plus"
                                size={28}
                            />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={handleMenuPress}>
                            <MaterialCommunityIcons
                                color={colorIcon}
                                name="dots-vertical"
                                size={28}
                            />
                        </TouchableOpacity>
                    ),
            });
    }, [navigation, staff, colorScheme, cursusName]);

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
            <WebMenuModal
                isHome={false}
                options={options}
                isStaff={staff}
                visible={webMenu.visible}
                onClose={() => setWebMenu({ ...webMenu, visible: false })}
                onSelect={(option) => handleMenuWeb(option, webMenu.meal!)}
            />
            <NotifyMealModal
                visible={!!notifyMeal}
                meal={notifyMeal}
                onClose={() => setNotifyMeal(null)}
                onNotify={(opt) => {
                    onNotifyMeal(notifyMeal, campusId, cursusId, String(opt));
                    setNotifyMeal(null);
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
                            {t('meals.notFoundEmpty')}
                        </ThemedText>
                    </ThemedView>
                )}
                <FlashList
                    data={meals}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onLongPress={() =>
                                staff ? handleItemLongPress(item) : null
                            }
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
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
    alignText: {
        alignSelf: "center",
        justifyContent: "center",
    },
});
