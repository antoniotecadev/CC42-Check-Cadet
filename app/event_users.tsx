import { useColorCoalition } from "@/components/ColorCoalitionContext";
import EventUserItem from "@/components/ui/EventUserItem";
import { useEventUsersPaginated } from "@/repository/useEventUsersPaginated";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

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
            />
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
});
