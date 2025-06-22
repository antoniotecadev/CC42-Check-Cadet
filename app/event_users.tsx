import { useColorCoalition } from "@/components/ColorCoalitionContext";
import EventUserItem from "@/components/ui/EventUserItem";
import { useEventUsersPaginated } from "@/repository/useEventUsersPaginated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
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
    const { eventId } = useLocalSearchParams<{ eventId: string }>();
    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useEventUsersPaginated(Number(eventId));

    const users = data?.pages.flatMap((page) => page.users) || []; // Combina todas as páginas em um único array
    const [refreshing, setRefreshing] = React.useState(false);

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
            <FlashList
                data={users}
                renderItem={({ item }) => (
                    <EventUserItem
                        login={item.login}
                        displayName={item.displayname}
                        imageUrl={
                            item.image?.link?.toString().trim() || undefined
                        }
                        isPresent={undefined} // Adapte se tiver info de presença
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
                        /* abrir camera traseira */
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
                        /* abrir camera frontal */
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
});
