import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import EventMealUserItem from "@/components/ui/EventMealUserItem";
import useItemStorage from "@/hooks/storage/useItemStorage";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useUser } from "@/hooks/useUsers";
import { t } from "@/i18n";
import {
    optimizeUsers,
    UserPresence,
    UserSubscription,
    useUsersPaginated,
} from "@/repository/userRepository";
import { generateAttendanceHtml } from "@/utility/HTMLUtil";
import { useBase64Image } from "@/utility/ImageUtil";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActionSheetIOS,
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const EVENTS: string = "events";

export default function EventUsersScreen() {
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const base64Image = useBase64Image();
    const { color } = useColorCoalition();

    const isWeb = Platform.OS === "web";
    const {
        type,
        eventId,
        userId,
        campusId,
        cursusId,
        eventName,
        eventDate,
        mealId,
        mealName,
        quantity,
        mealCreatedDate,
    } = useLocalSearchParams<{
        type: string;
        eventId: string;
        userId: string;
        campusId: string;
        cursusId: string;
        eventName: string;
        eventDate: string;
        mealId: string;
        mealName: string;
        quantity?: string;
        mealCreatedDate: string;
    }>();
    const typeId = type === EVENTS ? eventId : mealId;
    const endPoint = type === EVENTS ? "participants" : "subscriptions";
    const userResult = useUser(campusId, cursusId, type, typeId, endPoint);

    // Para acessar os IDs baseado no tipo:
    const participantIds =
        type === EVENTS
            ? userResult.eventParticipants?.map(
                  (participant) => participant.id
              ) || []
            : userResult.ids || [];

    // Função para enriquecer dados de eventos com informações de check-in/check-out
    const enrichEventData = (users: UserPresence[]) => {
        if (type !== EVENTS || !userResult.eventParticipants) {
            return users;
        }

        return users.map((user) => {
            const participant = userResult.eventParticipants?.find(
                (p) => p.id === String(user.id)
            );
            return {
                ...user,
                hasCheckin: !!participant, // Se existe no array, fez check-in
                hasCheckout: !!participant?.checkout, // Se tem checkout, fez check-out
            };
        });
    };

    // Função para enriquecer dados de refeições com informações de primeira/segunda via
    const enrichMealData = (users: UserPresence[]) => {
        if (type === EVENTS || !userResult.ids) {
            return users;
        }

        return users.map(user => {
            const userId = String(user.id);
            const hasFirstPortion = userResult.ids?.includes(userId) || false;
            const hasSecondPortion = userResult.ids?.includes(`-${userId}`) || false;
            const receivedSecondPortion = userResult.statusMap[`-${userId}`] || false;
            
            return {
                ...user,
                hasFirstPortion,
                hasSecondPortion,
                receivedSecondPortion,
            };
        });
    };

    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useUsersPaginated(type, eventId, cursusId, campusId);

    const { getItem } = useItemStorage();

    const [staff, setStaff] = useState<boolean>(false);
    const [refreshing, setRefreshing] = React.useState(false);
    const colorscheme = colorScheme === "dark" ? "#333" : "#fff";

    useEffect(() => {
        const status = async () => {
            const result = (await getItem("staff")) as any;
            setStaff(result === "true");
        };
        status();
    }, [getItem]);

    const users: UserPresence[] =
        data?.pages.flatMap((page) =>
            type === EVENTS
                ? (page.users as UserPresence[])
                : (page.users as UserSubscription[]).map((s) => ({
                      ...s.user,
                      isSubscribed: false, // default, will be set later
                  }))
        ) || [];

    // Marcar presença de acordo com o Firebase
    let userAttendanceList: UserPresence[] = [];
    let userSubscriptionsList: UserPresence[] = [];
    let numberPresents: number = 0,
        numberAbsents: number = 0,
        numberSubscribed: number = 0,
        numberUnSubscribed: number = 0,
        numberCheckout: number = 0,
        numberNoCheckout: number = 0;

    if (type === EVENTS) {
        userAttendanceList = optimizeUsers(users, participantIds, "events");
        // Contagem de presentes e ausentes
        const counts = userAttendanceList.reduce(
            (acc, u) => {
                if (u.isPresent) acc.isPresent++;
                else acc.isAbsents++;
                return acc;
            },
            { isPresent: 0, isAbsents: 0 }
        );
        numberPresents = counts.isPresent;
        numberAbsents = counts.isAbsents;

        // Contagem de check-out baseada nos dados do Firebase
        if (userResult.eventParticipants) {
            const checkoutCounts = userResult.eventParticipants.reduce(
                (acc, participant) => {
                    if (participant.checkout) {
                        acc.checkout++;
                    } else {
                        acc.noCheckout++;
                    }
                    return acc;
                },
                { checkout: 0, noCheckout: 0 }
            );
            numberCheckout = checkoutCounts.checkout;
            numberNoCheckout = checkoutCounts.noCheckout;
        }
    } else {
        userSubscriptionsList = optimizeUsers(users, participantIds, "meals");

        const counts = userSubscriptionsList.reduce(
            (acc, u) => {
                if (u.isSubscribed) acc.subscribed++;
                else acc.unsubscribed++;
                return acc;
            },
            { subscribed: 0, unsubscribed: 0 }
        );
        numberSubscribed = counts.subscribed;
        numberUnSubscribed = counts.unsubscribed;
    }

    const date = type === EVENTS ? eventDate : mealCreatedDate;
    const title =
        type === EVENTS
            ? [t('events.attendanceList'), eventName]
            : [t('events.subscriptionList'), mealName];
    const numberPresenceORSubscribed: number =
        type === EVENTS ? numberPresents : numberSubscribed;
    const numberAbsentsORUnSubscribed =
        type === EVENTS ? numberAbsents : numberUnSubscribed;
    const userPresenceSubscribed =
        type === EVENTS ? userAttendanceList : userSubscriptionsList;

    // Carrega todas as páginas automaticamente até não ter mais
    React.useEffect(() => {
        if (!isLoading && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [isLoading, hasNextPage, isFetchingNextPage, fetchNextPage]);

    async function handleExportExcel() {
        // Monta os dados CSV
        const header =
            type === EVENTS
                ? `Nº;${t('events.fullName')};Login;Check-in;Check-out\n`
                : `Nº;${t('events.fullName')};Login;${t('events.firstPortion')};${t('events.secondPortion')}\n`;

        const rows = userFilter
            .map((u, i) => {
                if (type === EVENTS) {
                    return `${i + 1};"${u.displayname}";${u.login};${
                        u.hasCheckin ? t('events.present') : t('events.absent')
                    };${u.hasCheckout ? t('events.present') : t('events.absent')}`;
                } else {
                    return `${i + 1};"${u.displayname}";${u.login};${
                        u.hasFirstPortion ? t('events.subscribed') : t('events.notSubscribed')
                    };${u.hasSecondPortion ? t('events.subscribed') : t('events.notSubscribed')}`;
                }
            })
            .join("\n");

        // Add UTF-8 BOM for Excel compatibility
        const csv = String.fromCharCode(0xfeff) + header + rows;
        const fileName = `lista_presenca_${
            title[1] ? title[1].replace(/\s+/g, "_") : type
        }.csv`;
        if (isWeb) {
            // Create a blob and download directly in the browser
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } else {
            // Mobile
            const fileUri = FileSystem.cacheDirectory + fileName;
            await FileSystem.writeAsStringAsync(fileUri, csv, {
                encoding: FileSystem.EncodingType.UTF8,
            });
            await Sharing.shareAsync(fileUri, {
                mimeType: "text/csv",
                dialogTitle: t('events.exportExcel'),
            });
        }
    }

    type Filter =
        | "filterAll"
        | "filterCheckinDone"
        | "filterCheckinNotDone"
        | "filterSubscribed"
        | "filterNotSubscribed"
        | "filterSecondPortion"
        | "filterCheckoutDone"
        | "filterCheckoutNotDone";

    const [filter, setFilter] = useState<Filter>("filterAll");

    // Search query for name or login
    const [searchQuery, setSearchQuery] = useState<string>("");
    // Debounced query to avoid excessive re-renders while typing
    const [debouncedQuery, setDebouncedQuery] = useState<string>("");

    // Web menus
    const [showWebMenu, setShowWebMenu] = useState<boolean>(false);
    const [showWebFilterMenu, setShowWebFilterMenu] = useState<boolean>(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 250); // 250ms debounce
        return () => clearTimeout(handler);
    }, [searchQuery]);

    let filterSecondPortion: boolean = false;
    const idsSet = new Set((participantIds || []).map(String));

    const userFilter = useMemo(() => {
        filterSecondPortion = false;
        let base = userPresenceSubscribed;

        // Enriquecer dados para eventos e refeições
        if (type === EVENTS) {
            base = enrichEventData(base);
        } else {
            base = enrichMealData(base);
        }

        switch (filter) {
            case "filterCheckinDone":
                base = base.filter((u) => u.isPresent);
                break;
            case "filterCheckinNotDone":
                base = base.filter((u) => !u.isPresent);
                break;
            case "filterSubscribed":
                base = base.filter((u) => u.isSubscribed);
                break;
            case "filterCheckoutDone":
                base = base.filter((u) => u.hasCheckout);
                break;
            case "filterCheckoutNotDone":
                base = base.filter((u) => u.hasCheckin && !u.hasCheckout);
                break;
            case "filterSecondPortion":
                base = base.filter((u) => idsSet.has(`-${String(u.id)}`));
                filterSecondPortion = true;
                break;
            case "filterNotSubscribed":
                base = base.filter((u) => !u.isSubscribed);
                break;
            case "filterAll":
            default:
                base = base;
        }

        // apply text search on displayname or login (case-insensitive)
        const q = (debouncedQuery || "").trim().toLowerCase();
        if (!q) return base;
        return base.filter((u) => {
            const name = (u.displayname || "").toLowerCase();
            const login = (u.login || "").toLowerCase();
            return name.includes(q) || login.includes(q);
        });
    }, [
        filter,
        userPresenceSubscribed,
        debouncedQuery,
        type,
        userResult.eventParticipants,
    ]);

    async function handlePrintPdf() {
        const html = generateAttendanceHtml({
            title: title[0],
            logoBase64: base64Image ?? "",
            description: title[1],
            date,
            numberPresenceORSubscribed,
            numberAbsentsORUnSubscribed,
            numberCheckout,
            numberNoCheckout,
            userFilter,
        });
        if (isWeb) {
            await Print.printAsync({ html });
        } else {
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false,
            });
            await Sharing.shareAsync(uri, {
                dialogTitle: `${t('events.printShare')} ${title}`,
                UTI: ".pdf",
                mimeType: "application/pdf",
            });
        }
    }

    const handleMenuPress = () => {
        if (isWeb) {
            setShowWebMenu(true);
            return;
        }
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: [
                    t('common.filter'),
                    t('events.printShare'),
                    t('events.exportExcel'),
                    t('common.cancel'),
                ],
                cancelButtonIndex: 3,
                userInterfaceStyle: "dark",
            },
            (selectedIndex) => {
                if (selectedIndex === 0) handleMenuFilter();
                if (selectedIndex === 1) handlePrintPdf();
                if (selectedIndex === 2) handleExportExcel();
            }
        );
    };

    const handleMenuFilter = () => {
        if (isWeb) {
            setShowWebFilterMenu(true);
            return;
        }
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: [
                    type === EVENTS
                        ? t('events.filterCheckinDone')
                        : t('events.filterSubscribed'),
                    type === EVENTS
                        ? t('events.filterCheckinNotDone')
                        : t('events.filterNotSubscribed'),
                    // Filtros específicos para eventos
                    ...(type === EVENTS
                        ? [
                              t('events.filterCheckoutDone'),
                              t('events.filterCheckoutNotDone'),
                          ]
                        : [t('events.filterSecondPortion')]),
                    t('events.filterAll'),
                    t('common.cancel'),
                ],
                cancelButtonIndex: type === EVENTS ? 5 : 4,
                userInterfaceStyle: "dark",
            },
            (selectedIndex) => {
                if (selectedIndex === 0)
                    type === EVENTS
                        ? setFilter("filterCheckinDone")
                        : setFilter("filterSubscribed");
                if (selectedIndex === 1)
                    type === EVENTS
                        ? setFilter("filterCheckinNotDone")
                        : setFilter("filterNotSubscribed");
                if (type === EVENTS) {
                    if (selectedIndex === 2)
                        setFilter("filterCheckoutDone");
                    if (selectedIndex === 3)
                        setFilter("filterCheckoutNotDone");
                    if (selectedIndex === 4) setFilter("filterAll");
                } else {
                    if (selectedIndex === 2) setFilter("filterSecondPortion");
                    if (selectedIndex === 3) setFilter("filterAll");
                }
            }
        );
    };

    React.useLayoutEffect(() => {
        const colorIcon = colorScheme === "light" ? "#333" : "#fdfdfd";
        navigation.setOptions &&
            staff &&
            navigation.setOptions({
                headerTitle: title[1],
                headerRight: () =>
                    isWeb ? (
                        <>
                            <TouchableOpacity
                                onPress={handlePrintPdf}
                                style={{ marginRight: 16 }}
                            >
                                <MaterialCommunityIcons
                                    color={colorIcon}
                                    name="printer"
                                    size={28}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleExportExcel}
                                style={{ marginRight: 16 }}
                            >
                                <MaterialCommunityIcons
                                    color={colorIcon}
                                    name="file-excel"
                                    size={28}
                                />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity onPress={handleMenuPress}>
                                <MaterialCommunityIcons
                                    color={colorIcon}
                                    name="dots-vertical"
                                    size={28}
                                />
                            </TouchableOpacity>
                        </>
                    ),
            });
    }, [navigation, staff, colorScheme, title]);

    const onRefresh = useCallback(async () => {
        filterSecondPortion = false;
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={color} />
            </View>
        );
    }
    if (isError) {
        return (
            <View style={styles.centered}>
                <ThemedText>{t('events.errorLoadingStudents')}</ThemedText>
                <TouchableOpacity onPress={onRefresh}>
                    <Text style={styles.retry}>{t('common.retry')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <>
            <ThemedView
                lightColor={"#f7f7f7"}
                style={[{ flex: 1 }, isWeb ? styles.inner : {}]}
            >
                {isWeb && refreshing && (
                    <ActivityIndicator
                        size="large"
                        color={color}
                        style={{ marginTop: 16 }}
                    />
                )}
                {/* Search input */}
                <View
                    style={[
                        styles.searchContainer,
                        isWeb ? styles.searchRow : {},
                    ]}
                >
                    <TextInput
                        placeholder={t('events.searchPlaceholder')}
                        placeholderTextColor={
                            colorScheme === "dark" ? "#aaa" : "#666"
                        }
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[
                            styles.searchInput,
                            {
                                backgroundColor:
                                    colorScheme === "dark" ? "#222" : "#fff",
                                color: colorScheme === "dark" ? "#fff" : "#000",
                            },
                        ]}
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                    />

                    {/* Chips na mesma linha do search */}
                    <View style={styles.chipInlineRow}>
                        <View style={[styles.chip, styles.chipPresent]}>
                            <MaterialCommunityIcons
                                name="account-check"
                                size={16}
                                color={colorscheme}
                                style={{ marginRight: 2 }}
                            />
                            <Text
                                style={[
                                    styles.chipText,
                                    { color: colorscheme, fontSize: 12 },
                                ]}
                            >
                                {numberPresenceORSubscribed}
                            </Text>
                        </View>
                        <View style={[styles.chip, styles.chipAbsent]}>
                            <MaterialCommunityIcons
                                name="account-remove"
                                size={16}
                                color={colorscheme}
                                style={{ marginRight: 2 }}
                            />
                            <Text
                                style={[
                                    styles.chipText,
                                    { color: colorscheme, fontSize: 12 },
                                ]}
                            >
                                {numberAbsentsORUnSubscribed}
                            </Text>
                        </View>

                        {/* Chips específicos para eventos - Check-out */}
                        {eventId && (
                            <>
                                <View
                                    style={[styles.chip, styles.chipCheckout]}
                                >
                                    <MaterialCommunityIcons
                                        name="logout"
                                        size={16}
                                        color={colorscheme}
                                        style={{ marginRight: 2 }}
                                    />
                                    <Text
                                        style={[
                                            styles.chipText,
                                            {
                                                color: colorscheme,
                                                fontSize: 12,
                                            },
                                        ]}
                                    >
                                        {numberCheckout}
                                    </Text>
                                </View>
                                <View
                                    style={[styles.chip, styles.chipNoCheckout]}
                                >
                                    <MaterialCommunityIcons
                                        name="logout-variant"
                                        size={16}
                                        color={colorscheme}
                                        style={{ marginRight: 2 }}
                                    />
                                    <Text
                                        style={[
                                            styles.chipText,
                                            {
                                                color: colorscheme,
                                                fontSize: 12,
                                            },
                                        ]}
                                    >
                                        {numberNoCheckout}
                                    </Text>
                                </View>
                            </>
                        )}

                        {mealId && (
                            <>
                                <View
                                    style={[styles.chip, styles.chipReceived]}
                                >
                                    <MaterialCommunityIcons
                                        name="food"
                                        size={16}
                                        color={colorscheme}
                                        style={{ marginRight: 2 }}
                                    />
                                    <Text
                                        style={[
                                            styles.chipText,
                                            {
                                                color: colorscheme,
                                                fontSize: 12,
                                            },
                                        ]}
                                    >
                                        {userResult.quantityReceived ?? 0}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.chip,
                                        styles.chipNotReceived,
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name="food-off"
                                        size={16}
                                        color={colorscheme}
                                        style={{ marginRight: 2 }}
                                    />
                                    <Text
                                        style={[
                                            styles.chipText,
                                            {
                                                color: colorscheme,
                                                fontSize: 12,
                                            },
                                        ]}
                                    >
                                        {Number(quantity) -
                                            (userResult.quantityReceived ?? 0)}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.chip,
                                        styles.chipSecondPortion,
                                    ]}
                                >
                                    <MaterialCommunityIcons
                                        name="account-multiple"
                                        size={16}
                                        color={colorscheme}
                                        style={{ marginRight: 2 }}
                                    />
                                    <Text
                                        style={[
                                            styles.chipText,
                                            {
                                                color: colorscheme,
                                                fontSize: 12,
                                            },
                                        ]}
                                    >
                                        {
                                            Array.from(idsSet).filter((id) =>
                                                id.startsWith("-")
                                            ).length
                                        }
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>

                    {staff && isWeb && (
                        <View style={styles.webMenuWrapper}>
                            <TouchableOpacity
                                onPress={() => setShowWebMenu((s) => !s)}
                                style={styles.webMenuButton}
                            >
                                <MaterialCommunityIcons
                                    name="dots-vertical"
                                    size={20}
                                    color={color}
                                />
                            </TouchableOpacity>
                        </View>
                    )}
                    {/* filter menu moved to end to ensure overlay */}
                </View>
                <FlashList
                    data={userFilter}
                    renderItem={({ item }) => (
                        <EventMealUserItem
                            login={item.login}
                            colorscheme={colorscheme}
                            displayName={item.displayname}
                            imageUrl={
                                item.image?.link?.toString().trim() || undefined
                            }
                            type={type}
                            isPresent={item.isPresent}
                            isSusbscribed={item.isSubscribed}
                            isSecondPortion={filterSecondPortion}
                            hasCheckin={item.hasCheckin}
                            hasCheckout={item.hasCheckout}
                            hasFirstPortion={item.hasFirstPortion}
                            hasSecondPortion={item.hasSecondPortion}
                            receivedSecondPortion={item.receivedSecondPortion}
                        />
                    )}
                    // onEndReached={() => { // option - if use remove function React.useEffectin line 72
                    //     if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                    // }}
                    // onEndReachedThreshold={0.2}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <ActivityIndicator color={color} />
                        ) : null
                    }
                    keyExtractor={(item) => String(item.id)}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
                {/* Web menus rendered after the list to ensure they overlay other content */}
                {isWeb && staff && showWebMenu && (
                    <View
                        style={[
                            styles.webMenu,
                            {
                                position: "absolute",
                                top: 90,
                                right: 24,
                                backgroundColor:
                                    colorScheme === "dark" ? "#222" : "#fff",
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                setShowWebMenu(false);
                                setShowWebFilterMenu(true);
                            }}
                            style={styles.webMenuItem}
                        >
                            <ThemedText>{t('common.filter')}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setShowWebMenu(false);
                                handlePrintPdf();
                            }}
                            style={styles.webMenuItem}
                        >
                            <ThemedText>{t('events.printShare')}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setShowWebMenu(false);
                                handleExportExcel();
                            }}
                            style={styles.webMenuItem}
                        >
                            <ThemedText>{t('events.exportExcel')}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowWebMenu(false)}
                            style={styles.webMenuItem}
                        >
                            <ThemedText>{t('common.cancel')}</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}

                {isWeb && showWebFilterMenu && (
                    <View
                        style={[
                            styles.webMenu,
                            {
                                position: "absolute",
                                top: 90,
                                right: 24,
                                backgroundColor:
                                    colorScheme === "dark" ? "#222" : "#fff",
                            },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => {
                                setShowWebFilterMenu(false);
                                setFilter(
                                    type === EVENTS
                                        ? "filterCheckinDone"
                                        : "filterSubscribed"
                                );
                            }}
                            style={styles.webMenuItem}
                        >
                            <ThemedText>
                                {type === EVENTS
                                    ? t('events.filterCheckinDone')
                                    : t('events.filterSubscribed')}
                            </ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                setShowWebFilterMenu(false);
                                setFilter(
                                    type === EVENTS
                                        ? "filterCheckinNotDone"
                                        : "filterNotSubscribed"
                                );
                            }}
                            style={styles.webMenuItem}
                        >
                            <ThemedText>
                                {type === EVENTS
                                    ? t('events.filterCheckinNotDone')
                                    : t('events.filterNotSubscribed')}
                            </ThemedText>
                        </TouchableOpacity>

                        {/* Filtros específicos para eventos - Check-out */}
                        {type === EVENTS && (
                            <>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowWebFilterMenu(false);
                                        setFilter("filterCheckoutDone");
                                    }}
                                    style={styles.webMenuItem}
                                >
                                    <ThemedText>
                                        {t('events.filterCheckoutDone')}
                                    </ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setShowWebFilterMenu(false);
                                        setFilter("filterCheckoutNotDone");
                                    }}
                                    style={styles.webMenuItem}
                                >
                                    <ThemedText>
                                        {t('events.filterCheckoutNotDone')}
                                    </ThemedText>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Apenas Segunda via - show only for meals on web as well */}
                        {type !== EVENTS && (
                            <TouchableOpacity
                                onPress={() => {
                                    setShowWebFilterMenu(false);
                                    setFilter("filterSecondPortion");
                                }}
                                style={styles.webMenuItem}
                            >
                                <ThemedText>{t('events.filterSecondPortion')}</ThemedText>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => {
                                setShowWebFilterMenu(false);
                                setFilter("filterAll");
                            }}
                            style={styles.webMenuItem}
                        >
                            <ThemedText>{t('events.filterAll')}</ThemedText>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowWebFilterMenu(false)}
                            style={styles.webMenuItem}
                        >
                            <ThemedText>{t('common.cancel')}</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}
                {/* Floating Action Buttons */}
                {staff && (
                    <View style={styles.fabContainer}>
                        <TouchableOpacity
                            style={[
                                styles.fab,
                                styles.fabLeft,
                                { backgroundColor: color },
                            ]}
                            onPress={() => {
                                router.push({
                                    pathname: "/qr_code_scanner",
                                    params: {
                                        camera: "back",
                                        eventId: eventId,
                                        mealId: mealId,
                                        userData: JSON.stringify({
                                            id: userId,
                                        }),
                                    },
                                });
                            }}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons
                                name="camera-rear"
                                size={32}
                                color={colorscheme}
                            />
                        </TouchableOpacity>
                        {isWeb && (
                            <TouchableOpacity
                                style={[styles.fab, { backgroundColor: color }]}
                                onPress={onRefresh}
                            >
                                <Ionicons
                                    name="refresh"
                                    size={28}
                                    color="#fff"
                                />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[
                                styles.fab,
                                styles.fabRight,
                                { backgroundColor: color },
                            ]}
                            onPress={() => {
                                router.push({
                                    pathname: "/qr_code_scanner",
                                    params: {
                                        camera: "front",
                                        eventId: eventId,
                                        mealId: mealId,
                                        userData: JSON.stringify({
                                            id: userId,
                                        }),
                                    },
                                });
                            }}
                            activeOpacity={0.8}
                        >
                            <MaterialCommunityIcons
                                name="camera-front"
                                size={32}
                                color={colorscheme}
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </ThemedView>
        </>
    );
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    retry: {
        color: "#007AFF",
        marginTop: 12,
        fontWeight: "bold",
    },
    fabContainer: {
        position: "absolute",
        bottom: 32,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 32,
        pointerEvents: "box-none",
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    fabLeft: {
        alignSelf: "flex-start",
    },
    fabRight: {
        alignSelf: "flex-end",
    },
    chipAbsoluteColumn: {
        position: "absolute",
        top: 65,
        right: 16,
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        zIndex: 10,
        pointerEvents: "box-none",
    },
    chipRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: 16,
        marginRight: 16,
        gap: 12,
    },
    chipInlineRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 12,
        justifyContent: "center",
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginLeft: 8,
        elevation: 2,
    },
    chipPresent: {
        backgroundColor: "#2ecc40",
    },
    chipAbsent: {
        backgroundColor: "#e74c3c",
    },
    chipReceived: {
        backgroundColor: "#007AFF",
    },
    chipNotReceived: {
        backgroundColor: "#FDD835",
    },
    chipSecondPortion: {
        backgroundColor: "#27b099ff",
    },
    chipCheckout: {
        backgroundColor: "#27b099ff", // Roxo para check-out feito
    },
    chipNoCheckout: {
        backgroundColor: "#FF9800", // Laranja para check-out não feito
    },
    chipText: {
        fontWeight: "bold",
        fontSize: 15,
    },
    inner: {
        width: "100%",
        maxWidth: 600, // limite superior
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
        overflow: "visible",
    },
    searchInput: {
        width: "100%",
        height: 40,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.08)",
    },
    searchRow: {
        flexDirection: "row",
    },
    webMenuWrapper: {
        position: "relative",
        marginLeft: 8,
        zIndex: 1000,
    },
    webMenuButton: {
        padding: 6,
        borderRadius: 6,
    },
    webMenu: {
        position: "absolute",
        top: 40,
        right: 0,
        minWidth: 180,
        borderRadius: 6,
        elevation: 20,
        zIndex: 1001,
        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        paddingVertical: 6,
    },
    webMenuItem: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
});
