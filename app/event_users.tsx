import { useColorCoalition } from "@/components/ColorCoalitionContext";
import EventUserItem from "@/components/ui/EventUserItem";
import { useEventAttendanceIds } from "@/hooks/useEventAttendanceIds";
import { useEventUsersPaginated } from "@/repository/useEventUsersPaginated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function EventUsersScreen() {
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
