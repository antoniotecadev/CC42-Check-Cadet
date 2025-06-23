import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { ThemedView } from "@/components/ThemedView";
import EventUserItem from "@/components/ui/EventUserItem";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useEventAttendanceIds } from "@/hooks/useEventAttendanceIds";
import { useEventUsersPaginated } from "@/repository/eventRepository";
import { generateAttendanceHtml } from "@/utility/HTMLUtil";
import { useBase64Image } from "@/utility/ImageUtil";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback } from "react";
import {
    ActionSheetIOS,
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function EventUsersScreen() {
    const navigation = useNavigation();
    const colorScheme = useColorScheme();
    const base64Image = useBase64Image();
    const { color } = useColorCoalition();

    const isWeb = Platform.OS === "web";
    const { eventId, userId, campusId, cursusId, eventName, eventDate } =
        useLocalSearchParams<{
            eventId: string;
            userId: string;
            campusId: string;
            cursusId: string;
            eventName: string;
            eventDate: string;
        }>();
    const attendanceIds = useEventAttendanceIds(campusId, cursusId, eventId);
    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useEventUsersPaginated(Number(eventId));

    const [refreshing, setRefreshing] = React.useState(false);
    const colorscheme = colorScheme === "dark" ? "#333" : "#fff";

    const users = data?.pages.flatMap((page) => page.users) || [];
    // Marcar presença de acordo com o Firebase
    const usersWithPresence = users.map((u) => ({
        ...u,
        isPresent: attendanceIds.includes(String(u.id)),
    }));
    // Contagem de presentes e ausentes
    const presents = usersWithPresence.filter(
        (u) => u.isPresent === true
    ).length;
    const absents = usersWithPresence.filter(
        (u) => u.isPresent === false
    ).length;

    async function handlePrintPdf() {
        const html = generateAttendanceHtml({
            title: "Lista de Presença",
            logoBase64: base64Image ?? "",
            eventName,
            eventDate,
            presents,
            absents,
            usersWithPresence,
        });
        if (isWeb) {
            await Print.printAsync({ html });
        } else {
            const { uri } = await Print.printToFileAsync({
                html,
                base64: false,
            });
            await Sharing.shareAsync(uri, {
                dialogTitle: "Imprimir ou Partilhar Lista de Presença",
                UTI: ".pdf",
                mimeType: "application/pdf",
            });
        }
    }

    async function handleExportExcel() {
        // Monta os dados CSV
        const header = "Nº;Nome Completo;Login;Presença\n";
        const rows = usersWithPresence
            .map(
                (u, i) =>
                    `${i + 1};"${u.displayname}";${u.login};${
                        u.isPresent ? "Presente" : "Ausente"
                    }`
            )
            .join("\n");
        // Adiciona BOM UTF-8 para compatibilidade com Excel
        const csv = String.fromCharCode(0xfeff) + header + rows;
        const fileName = `lista_presenca_${
            eventName ? eventName.replace(/\s+/g, "_") : "evento"
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

    const handleMenuPress = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: [
                    "Imprimir ou Partilhar",
                    "Exportar para Excel",
                    "Cancelar",
                ],
                cancelButtonIndex: 2,
                userInterfaceStyle: "dark",
            },
            (selectedIndex) => {
                if (selectedIndex === 0) handlePrintPdf();
                if (selectedIndex === 1) handleExportExcel();
            }
        );
    };

    React.useLayoutEffect(() => {
        navigation.setOptions &&
            navigation.setOptions({
                headerRight: () =>
                    isWeb ? (
                        <>
                            <TouchableOpacity
                                onPress={handlePrintPdf}
                                style={{ marginRight: 16 }}
                            >
                                <MaterialCommunityIcons
                                    name="printer"
                                    size={28}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleExportExcel}
                                style={{ marginRight: 16 }}
                            >
                                <MaterialCommunityIcons
                                    name="file-excel"
                                    size={28}
                                />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity onPress={handleMenuPress}>
                            <MaterialCommunityIcons
                                name="dots-vertical"
                                size={28}
                            />
                        </TouchableOpacity>
                    ),
            });
    }, [navigation, color, usersWithPresence]);

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
                <Text>Erro ao carregar usuários.</Text>
                <Text onPress={() => refetch()} style={styles.retry}>
                    Tentar novamente
                </Text>
            </View>
        );
    }

    return (
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
                        {presents}
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
                        {absents}
                    </Text>
                </View>
            </View>
            <FlashList
                data={usersWithPresence}
                renderItem={({ item }) => (
                    <EventUserItem
                        login={item.login}
                        colorscheme={colorscheme}
                        displayName={item.displayname}
                        imageUrl={
                            item.image?.link?.toString().trim() || undefined
                        }
                        isPresent={item.isPresent}
                    />
                )}
                estimatedItemSize={80}
                onEndReached={() => {
                    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                }}
                onEndReachedThreshold={0.2}
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
                        <Ionicons name="refresh" size={28} color="#fff" />
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
        </ThemedView>
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
