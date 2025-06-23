import { useColorCoalition } from "@/components/ColorCoalitionContext";
import useApiInterceptors from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";
import { Stack } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Definição do tipo Cursu
interface Cursu {
    id: number;
    name: string;
}

// Função para buscar cursus
const fetchCursus = async (
    api: AxiosInstance,
    pageNumber = 1,
    pageSize = 100
) => {
    const res = await api.get("/v2/cursus", {
        params: { "page[number]": pageNumber, "page[size]": pageSize },
    });
    return res.data as Cursu[];
};

export default function CursusScreen() {
    const { api } = useApiInterceptors();
    const { color } = useColorCoalition();
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);

    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ["cursus"],
        queryFn: () => fetchCursus(api),
        enabled: !!api,
        staleTime: 1000 * 60 * 60 * 24, // Dados ficam "frescos" por 24 horas
        retry: 2, // Tenta novamente 2 vezes em caso de falha
    });

    const filtered =
        data?.filter(
            (cursu) =>
                cursu.name.toLowerCase().includes(search.toLowerCase()) ||
                String(cursu.id).includes(search)
        ) || [];

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    return (
        <>
            <Stack.Screen options={{ headerShown: true }} />
            <View style={styles.container}>
                <View style={styles.header}>
                    <TextInput
                        style={styles.input}
                        placeholder="Buscar cursus..."
                        value={search}
                        onChangeText={setSearch}
                    />
                    <View style={[styles.chip, { backgroundColor: color }]}>
                        <Text style={styles.chipText}>{filtered.length}</Text>
                    </View>
                </View>
                {isLoading || isFetching ? (
                    <ActivityIndicator
                        size="large"
                        color={color}
                        style={{ marginTop: 32 }}
                    />
                ) : isError ? (
                    <Text style={styles.notFound}>
                        Erro ao carregar cursus.
                    </Text>
                ) : filtered.length === 0 ? (
                    <Text style={styles.notFound}>
                        Nenhum cursus encontrado.
                    </Text>
                ) : (
                    <FlashList
                        data={filtered}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.item}
                                onPress={() =>
                                    alert(
                                        `Cursus: ${item.name}\nID: ${item.id}`
                                    )
                                }
                            >
                                <Ionicons
                                    name="school-outline"
                                    size={28}
                                    color={color}
                                    style={{ marginRight: 12 }}
                                />
                                <View>
                                    <Text style={styles.name}>{item.name}</Text>
                                    <Text style={styles.id}>ID: {item.id}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        estimatedItemSize={75}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                )}
                <TouchableOpacity style={styles.fab} onPress={onRefresh}>
                    <Ionicons name="refresh" size={28} color={color} />
                </TouchableOpacity>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    header: { flexDirection: "row", alignItems: "center", padding: 16 },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#eee",
        borderRadius: 8,
        padding: 8,
        marginRight: 12,
    },
    chip: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    chipText: { color: "#fff", fontWeight: "bold" },
    item: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderColor: "#f0f0f0",
    },
    name: { fontSize: 16, fontWeight: "bold" },
    id: { fontSize: 12, color: "#888" },
    notFound: { textAlign: "center", marginTop: 32, color: "#888" },
    fab: {
        position: "absolute",
        bottom: 32,
        right: 24,
        backgroundColor: "#007AFF",
        borderRadius: 25,
        width: 50,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
    },
});
