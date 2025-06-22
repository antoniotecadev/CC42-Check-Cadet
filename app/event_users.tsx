import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { ThemedView } from "@/components/ThemedView";
import EventUserItem from "@/components/ui/EventUserItem";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useEventAttendanceIds } from "@/hooks/useEventAttendanceIds";
import { useEventUsersPaginated } from "@/repository/useEventUsersPaginated";
import { useBase64Image } from "@/utility/ImageUtil";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { router, useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
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
    const { color } = useColorCoalition();

    const { eventId, userId, campusId, cursusId, eventName, eventDate } =
        useLocalSearchParams<{
            eventId: string;
            userId: string;
            campusId: string;
            cursusId: string;
            eventName?: string;
            eventDate?: string;
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

    const base64Image = useBase64Image();

    async function handlePrintPdf() {
        // Divide os usuários em páginas de 28 linhas
        const pageSize = 28;
        const pages = [];
        for (let i = 0; i < usersWithPresence.length; i += pageSize) {
            pages.push(usersWithPresence.slice(i, i + pageSize));
        }
        const html = `
        <html>
        <head>
            <style>
                @page { size: A4; }
                body { font-family: Arial, sans-serif; margin: 24px; margin-bottom: 60px; }
                .header { text-align: center; margin-bottom: 16px; }
                .logo { width: 80px; height: 40px; margin-bottom: 8px; }
                .title { font-size: 20px; font-weight: bold; margin-bottom: 4px; }
                .subtitle { font-size: 14px; margin-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th, td { border: 1px solid #ccc; padding: 6px 4px; font-size: 12px; text-align: left; }
                th { background: #f0f0f0; }
                .present { color: #2ecc40; font-weight: bold; }
                .absent { color: #e74c3c; font-weight: bold; }
                .footer { width: 100%; margin-top: 32px; text-align: center; font-size: 11px; color: #888; }
                .page-break { page-break-after: always; }
            </style>
        </head>
        <body>
            <div class="header">
                <img src="${base64Image}" class="logo" />
                <div class="title">Lista de Presença</div>
                <div class="subtitle">Presente: ${presents} | Ausente: ${absents}</div>
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
                ${pages[0]
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
            <div class="footer">Lista de presença gerada em ${new Date().toLocaleString()}</div>
            ${pages
                .slice(1)
                .map(
                    (page, pageIndex) => `
                <table>
                    <tr>
                        <th>#</th>
                        <th>Nome Completo</th>
                        <th>Login</th>
                        <th>Presença</th>
                    </tr>
                    ${page
                        .map(
                            (u, i) => `
                        <tr>
                            <td>${(pageIndex + 1) * pageSize + i + 1}</td>
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
                <div class="footer">Lista de presença gerada em ${new Date().toLocaleString()}</div>
                ${
                    pageIndex < pages.length - 2
                        ? '<div class="page-break"></div>'
                        : ""
                }
            `
                )
                .join("")}
        </body>
        </html>
        `;
        if (Platform.OS === "web") {
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
        const csv = header + rows;
        // Define nome do arquivo
        const fileName = `lista_presenca_${
            eventName ? eventName.replace(/\s+/g, "_") : "evento"
        }.csv`;
        const fileUri = FileSystem.cacheDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, csv, {
            encoding: FileSystem.EncodingType.UTF8,
        });
        await Sharing.shareAsync(fileUri, {
            mimeType: "text/csv",
            dialogTitle: "Exportar para Excel",
        });
    }

    // Adicione ao menu:
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
                    Platform.OS === "web" ? (
                        <TouchableOpacity
                            onPress={handlePrintPdf}
                            style={{ marginRight: 16 }}
                        >
                            <MaterialCommunityIcons name="printer" size={28} />
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
        <ThemedView
            lightColor={"#f7f7f7"}
            style={[{ flex: 1 }, Platform.OS === "web" ? styles.inner : {}]}
        >
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
                        color={colorscheme}
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
