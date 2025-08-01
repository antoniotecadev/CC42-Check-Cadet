import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import EventUserItem from "@/components/ui/EventUserItem";
import useItemStorage from "@/hooks/storage/useItemStorage";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useIds } from "@/hooks/useEventAttendanceIds";
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
import * as FileSystem from "expo-file-system";
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
        mealCreatedDate: string;
    }>();
    const typeId = type === EVENTS ? eventId : mealId;
    const endPoint = type === EVENTS ? "participants" : "subscriptions";
    const ids = useIds(campusId, cursusId, type, typeId, endPoint);
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
        numberUnSubscribed: number = 0;

    if (type === EVENTS) {
        userAttendanceList = optimizeUsers(users, ids, "events");
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
    } else {
        userSubscriptionsList = optimizeUsers(users, ids, "meals");
        // Contagem de asinados e não assinados
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
            ? ["Lista de Presença", eventName]
            : ["Lista de Assinaturas", mealName];
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
        const header = `Nº;Nome Completo;Login; ${
            type === EVENTS ? "Presença" : "Assinatura"
        }\n`;
        const rows = userPresenceSubscribed
            .map(
                (u, i) =>
                    `${i + 1};"${u.displayname}";${u.login};${
                        type === EVENTS
                            ? u.isPresent
                                ? "Presente"
                                : "Ausente"
                            : u.isSubscribed
                            ? "Assinado"
                            : "Não assinado"
                    }`
            )
            .join("\n");
        // Adiciona BOM UTF-8 para compatibilidade com Excel
        const csv = String.fromCharCode(0xfeff) + header + rows;
        const fileName = `lista_presenca_${
            title[1] ? title[1].replace(/\s+/g, "_") : type
        }.csv`;
        if (isWeb) {
            // Cria um blob e faz download directo no navegador
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
                dialogTitle: "Exportar para Excel",
            });
        }
    }

    type Filter =
        | "Filtrar todos"
        | "Filtrar presentes"
        | "Filtrar ausentes"
        | "Filtrar assinados"
        | "Filtrar não assinados";

    const [filter, setFilter] = useState<Filter>("Filtrar todos");

    const userFilter = useMemo(() => {
        switch (filter) {
            case "Filtrar todos":
                return userPresenceSubscribed;
            case "Filtrar presentes":
                return userPresenceSubscribed.filter((u) => u.isPresent);
            case "Filtrar ausentes":
                return userPresenceSubscribed.filter((u) => !u.isPresent);
            case "Filtrar assinados":
                return userPresenceSubscribed.filter((u) => u.isSubscribed);
            case "Filtrar não assinados":
                return userPresenceSubscribed.filter((u) => !u.isSubscribed);
        }
    }, [filter, userPresenceSubscribed]);

    async function handlePrintPdf() {
        const html = generateAttendanceHtml({
            title: title[0],
            logoBase64: base64Image ?? "",
            description: title[1],
            date,
            numberPresenceORSubscribed,
            numberAbsentsORUnSubscribed,
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
                dialogTitle: `Imprimir ou Partilhar ${title}`,
                UTI: ".pdf",
                mimeType: "application/pdf",
            });
        }
    }

    const handleMenuPress = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: [
                    "Filtrar",
                    "Imprimir ou Partilhar",
                    "Exportar para Excel",
                    "Cancelar",
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
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: [
                    type === EVENTS ? "Filtrar presentes" : "Filtrar assinados",
                    type === EVENTS
                        ? "Filtrar ausentes"
                        : "Filtrar não assinados",
                    "Filtrar todos",
                    "Cancelar",
                ],
                cancelButtonIndex: 3,
                userInterfaceStyle: "dark",
            },
            (selectedIndex) => {
                if (selectedIndex === 0)
                    type === EVENTS
                        ? setFilter("Filtrar presentes")
                        : setFilter("Filtrar assinados");
                if (selectedIndex === 1)
                    type === EVENTS
                        ? setFilter("Filtrar ausentes")
                        : setFilter("Filtrar não assinados");
                if (selectedIndex === 2) setFilter("Filtrar todos");
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
                <ThemedText>Erro ao carregar estudantes.</ThemedText>
                <TouchableOpacity onPress={onRefresh}>
                    <Text style={styles.retry}>Tentar novamente</Text>
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
                {/* Chips de presentes e ausentes - agora absolutos no topo direito */}
                <View style={styles.chipAbsoluteRow} pointerEvents="box-none">
                    <View style={[styles.chip, styles.chipPresent]}>
                        <MaterialCommunityIcons
                            name="account-check"
                            size={18}
                            color={colorscheme}
                            style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.chipText, { color: colorscheme }]}>
                            {numberPresenceORSubscribed}
                        </Text>
                    </View>
                    <View style={[styles.chip, styles.chipAbsent]}>
                        <MaterialCommunityIcons
                            name="account-remove"
                            size={18}
                            color={colorscheme}
                            style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.chipText, { color: colorscheme }]}>
                            {numberAbsentsORUnSubscribed}
                        </Text>
                    </View>
                </View>
                <FlashList
                    data={userFilter}
                    renderItem={({ item }) => (
                        <EventUserItem
                            login={item.login}
                            colorscheme={colorscheme}
                            displayName={item.displayname}
                            imageUrl={
                                item.image?.link?.toString().trim() || undefined
                            }
                            type={type}
                            isPresent={item.isPresent}
                            isSusbscribed={item.isSubscribed}
                        />
                    )}
                    estimatedItemSize={type === EVENTS ? 100 : 300}
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
                {/* Floating Action Buttons */}
                {staff && (
                    <View style={styles.fabContainer} pointerEvents="box-none">
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
    chipAbsoluteRow: {
        position: "absolute",
        top: 32,
        right: 16,
        flexDirection: "row",
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
    chipText: {
        fontWeight: "bold",
        fontSize: 15,
    },
    inner: {
        width: "100%",
        maxWidth: 600, // limite superior
        minWidth: 480, // limite inferior (opcional)
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
});
