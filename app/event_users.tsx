import { useColorCoalition } from "@/components/ColorCoalitionContext";
import EventUserItem from "@/components/ui/EventUserItem";
import { useEventAttendanceIds } from "@/hooks/useEventAttendanceIds";
import { useEventUsersPaginated } from "@/repository/useEventUsersPaginated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
import {
    ActionSheetIOS,
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function EventUsersScreen() {
    const navigation = useNavigation();
    const { color } = useColorCoalition();
    const { eventId, userId, campusId, cursusId } = useLocalSearchParams<{
        eventId: string;
        userId: string;
        campusId: string;
        cursusId: string;
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
    const users = data?.pages.flatMap((page) => page.users) || [];
    // Marcar presença de acordo com o Firebase
    const usersWithPresence = users.map((u) => ({
        ...u,
        isPresent: attendanceIds.includes(String(u.id)),
    }));
    // Contagem de presentes e ausentes
    const presentes = usersWithPresence.filter(
        (u) => u.isPresent === true
    ).length;
    const ausentes = usersWithPresence.filter(
        (u) => u.isPresent === false
    ).length;

    // Pega nome e data do evento dos params
    const { eventName, eventDate } = useLocalSearchParams<{
        eventName?: string;
        eventDate?: string;
    }>();

    // Função para gerar e compartilhar PDF
    async function handlePrintPdf() {
        // Usa os dados reais do evento
        const logoUri = require("@/assets/images/icon.png"); // Use require para assets locais
        const html = `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; margin: 24px; }
                .header { text-align: center; margin-bottom: 16px; }
                .logo { width: 60px; height: 60px; margin-bottom: 8px; }
                .title { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
                .subtitle { font-size: 14px; margin-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th, td { border: 1px solid #ccc; padding: 6px 4px; font-size: 12px; text-align: left; }
                th { background: #f0f0f0; }
                .present { color: #2ecc40; font-weight: bold; }
                .absent { color: #e74c3c; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${logoUri}" class="logo" />
                <div class="title">Lista de Presença</div>
                <div class="subtitle">${eventName || ""} - ${
            eventDate || ""
        }</div>
            </div>
            <table>
                <tr>
                    <th>#</th>
                    <th>Nome Completo</th>
                    <th>Login</th>
                    <th>Presença</th>
                </tr>
                ${usersWithPresence
                    .map(
                        (u, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${u.displayname}</td>
                        <td>${u.login}</td>
                        <td class="${u.isPresent ? "present" : "absent"}">${
                            u.isPresent ? "Presente" : "Ausente"
                        }</td>
                    </tr>
                `
                    )
                    .join("")}
            </table>
        </body>
        </html>
        `;
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri);
    }

    const handleMenuPress = () => {
        ActionSheetIOS.showActionSheetWithOptions(
            {
                options: ["Imprimir lista de presença", "Cancelar"],
                cancelButtonIndex: 1,
            },
            (selectedIndex) => {
                if (selectedIndex === 0) handlePrintPdf();
            }
        );
    };

    React.useLayoutEffect(() => {
        navigation.setOptions &&
            navigation.setOptions({
                headerRight: () => (
                    <TouchableOpacity
                        onPress={handleMenuPress}
                        style={{ paddingHorizontal: 16 }}
                    >
                        <MaterialCommunityIcons
                            name="dots-vertical"
                            size={28}
                        />
                    </TouchableOpacity>
                ),
            });
    }, [navigation, color, usersWithPresence]);

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
        <View style={{ flex: 1, backgroundColor: "#f7f7f7" }}>
            {/* Chips de presentes e ausentes - agora absolutos no topo direito */}
            <View style={styles.chipAbsoluteRow} pointerEvents="box-none">
                <View style={[styles.chip, styles.chipPresent]}>
                    <MaterialCommunityIcons
                        name="account-check"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 4 }}
                    />
                    <Text style={styles.chipText}>{presentes}</Text>
                </View>
                <View style={[styles.chip, styles.chipAbsent]}>
                    <MaterialCommunityIcons
                        name="account-remove"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 4 }}
                    />
                    <Text style={styles.chipText}>{ausentes}</Text>
                </View>
            </View>
            <FlashList
                data={usersWithPresence}
                renderItem={({ item }) => (
                    <EventUserItem
                        login={item.login}
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
                onRefresh={async () => {
                    setRefreshing(true);
                    await refetch();
                    setRefreshing(false);
                }}
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
                        color="#fff"
                    />
                </TouchableOpacity>
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
                        color="#fff"
                    />
                </TouchableOpacity>
            </View>
        </View>
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
        color: "#fff",
        fontWeight: "bold",
        fontSize: 15,
    },
});
