import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import useItemStorage from "@/hooks/storage/useItemStorage";
import { useColorScheme } from "@/hooks/useColorScheme.web";
import useApiInterceptors from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { AxiosInstance } from "axios";
import { Stack, router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
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
    const { getItem } = useItemStorage();
    const colorScheme = useColorScheme();
    const { api } = useApiInterceptors();
    const { color } = useColorCoalition();
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [campusId, setCampusId] = useState<string | null>(null);

    useEffect(() => {
        const fetchCampusId = async () => {
            const campusId = await getItem("campus_id");
            if (campusId) {
                setCampusId(campusId);
            } else {
                console.warn("Campus ID não encontrado");
            }
        };
        fetchCampusId();
    }, [getItem]);

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

    // IDs prioritários
    const priorityIds = [21, 66, 9];

    // Ordena os cursus: prioritários primeiro, depois os demais
    const sortedFiltered = React.useMemo(() => {
        if (!filtered.length) return [];
        const priority: Cursu[] = [];
        const others: Cursu[] = [];
        for (const c of filtered) {
            if (priorityIds.includes(c.id)) priority.push(c);
            else others.push(c);
        }
        // Mantém a ordem dos IDs prioritários
        priority.sort(
            (a, b) => priorityIds.indexOf(a.id) - priorityIds.indexOf(b.id)
        );
        return [...priority, ...others];
    }, [filtered]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: color,
                    },
                }}
            />
            <ThemedView
                style={[
                    styles.container,
                    Platform.OS === "web" ? styles.inner : {},
                ]}
            >
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
                    <ThemedText lightColor="#888" style={styles.notFound}>
                        Erro ao carregar cursus.
                    </ThemedText>
                ) : filtered.length === 0 ? (
                    <ThemedText lightColor="#888" style={styles.notFound}>
                        Nenhum cursus encontrado.
                    </ThemedText>
                ) : (
                    <FlashList
                        data={sortedFiltered}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.item,
                                    {
                                        borderColor:
                                            colorScheme === "light"
                                                ? "#f0f0f0"
                                                : "#333",
                                    },
                                ]}
                                onPress={() =>
                                    router.push({
                                        pathname: "/meals",
                                        params: {
                                            campusId: campusId,
                                            cursusId: item.id,
                                            cursusName: item.name,
                                        },
                                    })
                                }
                            >
                                <Ionicons
                                    name="school-outline"
                                    size={28}
                                    color={color}
                                    style={{ marginRight: 12 }}
                                />
                                <View>
                                    <ThemedText
                                        style={[
                                            styles.name,
                                            priorityIds.includes(item.id) && {
                                                color: "green",
                                            },
                                        ]}
                                    >
                                        {item.name}
                                    </ThemedText>
                                    <Text style={styles.id}>ID: {item.id}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                        estimatedItemSize={75}
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                )}
                {Platform.OS === "web" && (
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: color }]}
                        onPress={onRefresh}
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
    },
    name: { fontSize: 16, fontWeight: "bold" },
    id: { fontSize: 12, color: "#888" },
    notFound: { textAlign: "center", marginTop: 32 },
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
        minWidth: 480, // limite inferior (opcional)
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
});
