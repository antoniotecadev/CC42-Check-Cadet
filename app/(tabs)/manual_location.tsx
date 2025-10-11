/**
 * 🧭 CHECKCADET - LOCALIZAÇÃO MANUAL DO ESTUDANTE
 *
 * Objetivo:
 * Permitir que o estudante declare onde está dentro da escola
 * tocando em uma área interativa de um mapa (imagem da planta da escola).
 *
 * Implementação:
 * - Usamos uma imagem da planta da escola como fundo com `ImageBackground`
 * - Sobre essa imagem, colocamos botões transparentes posicionados manualmente
 * - Cada botão representa um local específico (Cluster, Refeitório, etc.)
 * - Quando o estudante clica, a localização é salva no Firebase (futuramente)
 *
 * Vantagens:
 * - Rápido de implementar
 * - Interface simples e clara para o estudante
 * - Sem dependência de GPS, QR, Bluetooth
 *
 * ⚠️ Importante:
 * - As posições dos botões são relativas à imagem da planta
 * - Usamos `position: 'absolute'` com porcentagens para adaptar a qualquer tela
 */
import useAlert from "@/hooks/useAlert";
import { saveUserLocation } from "@/repository/manualLocationRepository";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SCHOOL_LOCATIONS, type Location } from "@/constants/schoolLocations";
import useItemStorage from "@/hooks/storage/useItemStorage";

interface Student42Data {
    id: number;
    login: string;
    usual_full_name: string;
    image: {
        link: string;
    };
    campus: Array<{ id: number }>;
    projects_users: Array<{ cursus_ids: number[] }>;
}

export default function ManualLocationScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { getItem } = useItemStorage();
    const { showConfirm, showSuccess, showError } = useAlert();
    const [selectedLocation, setSelectedLocation] = useState<string | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    // Estados para pesquisa de estudante
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedStudent, setSelectedStudent] =
        useState<Student42Data | null>(null);
    const [studentLocation, setStudentLocation] = useState<{
        areaId: string;
        areaName: string;
    } | null>(null);

    const searchStudent = async (login: string) => {
        if (!login.trim()) {
            showError("⚠️ Atenção", "Por favor, digite o login do estudante.");
            return;
        }

        setIsSearching(true);
        setStudentLocation(null);

        try {
            // Buscar token de acesso
            const accessToken = await getItem("access_token");
            if (!accessToken) {
                throw new Error("Token de acesso não encontrado");
            }

            // Fazer requisição à API da 42
            const response = await fetch(
                `https://api.intra.42.fr/v2/users/${login.trim()}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Estudante não encontrado");
                }
                throw new Error(`Erro na API: ${response.status}`);
            }

            const studentData: Student42Data = await response.json();

            setSelectedStudent(studentData);

            const { getUserLocation } = await import(
                "@/repository/manualLocationRepository"
            );

            const location = await getUserLocation(
                studentData.id.toString(),
                studentData.campus[0]?.id?.toString() || "",
                studentData.projects_users[0]?.cursus_ids[0]?.toString() || "0"
            );

            if (location) {
                setStudentLocation(location);
                showSuccess(
                    "📍 Localização Encontrada",
                    `${studentData.usual_full_name} está em: ${location.areaName}`
                );
            } else {
                showError(
                    "📍 Sem Localização",
                    `${studentData.usual_full_name} ainda não registrou sua localização.`
                );
            }
        } catch (error: any) {
            console.error("Erro ao buscar estudante:", error);
            showError(
                "❌ Erro",
                error.message || "Não foi possível encontrar o estudante."
            );
            setSelectedStudent(null);
        } finally {
            setIsSearching(false);
        }
    };

    /**
     * Limpa a seleção do estudante
     */
    const clearStudent = () => {
        setSelectedStudent(null);
        setSearchQuery("");
        setStudentLocation(null);
    };

    /**
     * Registra a própria localização do usuário logado
     */
    const handleLocationSelect = async (location: Location) => {
        setSelectedLocation(location.id);

        showConfirm(
            "📍 Confirmar Localização",
            `Você está em: ${location.name}`,
            async () => {
                setIsLoading(true);
                try {
                    const locationData = {
                        areaId: location.id,
                        areaName: location.name,
                    };

                    const userId = await getItem("user_id");
                    const campusId = await getItem("campus_id");
                    const cursusId = await getItem("cursus_id");

                    if (!userId) {
                        throw new Error("User ID not found in storage");
                    } else if (!campusId) {
                        throw new Error("Campus ID not found in storage");
                    } else if (!cursusId) {
                        throw new Error("Cursus ID not found in storage");
                    }

                    await saveUserLocation(
                        userId,
                        campusId,
                        cursusId,
                        locationData
                    );

                    showSuccess(
                        "🟢 Sucesso!",
                        "Sua localização foi registrada com sucesso."
                    );
                } catch (error) {
                    console.error("Erro ao salvar localização:", error);
                    showError(
                        "🔴 Erro",
                        "Não foi possível salvar sua localização."
                    );
                } finally {
                    setIsLoading(false);
                }
            },
            () => setSelectedLocation(null)
        );
    };

    return (
        <View style={styles.container}>
            {/* Search Section */}
            <View
                style={[styles.searchSection, { paddingTop: insets.top + 16 }]}
            >
                <Text style={styles.searchTitle}>Buscar Estudante</Text>

                <View style={styles.searchInputContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Digite o login do estudante (ex: andre)"
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        editable={!isSearching}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity
                        style={[
                            styles.searchButton,
                            isSearching && styles.searchButtonDisabled,
                        ]}
                        onPress={() => searchStudent(searchQuery)}
                        disabled={isSearching || !searchQuery.trim()}
                    >
                        {isSearching ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Ionicons name="search" size={20} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Selected Student Card */}
                {selectedStudent && (
                    <View style={styles.studentCard}>
                        <Image
                            source={{
                                uri:
                                    selectedStudent.image?.link ||
                                    "https://via.placeholder.com/60",
                            }}
                            style={styles.studentAvatar}
                        />
                        <View style={styles.studentInfo}>
                            <Text style={styles.studentName}>
                                {selectedStudent.usual_full_name}
                            </Text>
                            <Text style={styles.studentLogin}>
                                {selectedStudent.login}
                            </Text>
                            {studentLocation && (
                                <View style={styles.locationBadge}>
                                    <Ionicons
                                        name="location"
                                        size={16}
                                        color="#27ae60"
                                    />
                                    <Text style={styles.locationText}>
                                        {studentLocation.areaName}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={clearStudent}
                        >
                            <Ionicons
                                name="close-circle"
                                size={24}
                                color="#e74c3c"
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Instruções */}
            <View style={styles.instructionsContainer}>
                <Text style={styles.instructions}>
                    Toque na área do mapa onde você está localizado
                </Text>
            </View>

            {/* Mapa Interativo */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                maximumZoomScale={3}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.mapContainer}>
                    <ImageBackground
                        source={require("@/assets/images/42_luanda_blueprint.png")}
                        style={styles.mapBackground}
                        resizeMode="contain"
                        imageStyle={{ alignSelf: "center" }}
                        onLoadStart={() => setImageLoading(true)}
                        onLoadEnd={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)}
                    >
                        {/* Loading Indicator para a Imagem */}
                        {imageLoading && (
                            <View style={styles.imageLoadingContainer}>
                                <Ionicons
                                    name="map-outline"
                                    size={64}
                                    color="#3498db"
                                />
                                <ActivityIndicator
                                    size="large"
                                    color="#3498db"
                                    style={styles.loadingSpinner}
                                />
                                <Text style={styles.imageLoadingText}>
                                    Carregando mapa da escola...
                                </Text>
                                <Text style={styles.imageLoadingSubtext}>
                                    Por favor, aguarde
                                </Text>
                            </View>
                        )}

                        {/* Overlay com as áreas clicáveis */}
                        <View style={styles.overlay}>
                            {SCHOOL_LOCATIONS.map((location) => {
                                const isSelected =
                                    selectedLocation === location.id;
                                const isStudentHere =
                                    studentLocation?.areaId === location.id;

                                return (
                                    <TouchableOpacity
                                        key={location.id}
                                        style={[
                                            styles.locationButton,
                                            {
                                                top: location.top,
                                                left: location.left,
                                                width: location.width,
                                                height: location.height,
                                                backgroundColor: location.color,
                                                borderColor: isSelected
                                                    ? "#fff"
                                                    : isStudentHere
                                                    ? "#27ae60"
                                                    : "transparent",
                                                borderWidth:
                                                    isSelected || isStudentHere
                                                        ? 3
                                                        : 1,
                                            },
                                        ]}
                                        onPress={() =>
                                            handleLocationSelect(location)
                                        }
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.locationName}>
                                            {location.name}
                                        </Text>
                                        {isSelected && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={24}
                                                color="#fff"
                                            />
                                        )}
                                        {isStudentHere && !isSelected && (
                                            <Ionicons
                                                name="person"
                                                size={24}
                                                color="#27ae60"
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </ImageBackground>
                </View>
            </ScrollView>

            {/* Legenda */}
            <View
                style={[
                    styles.legendContainer,
                    { marginBottom: insets.bottom + 50 },
                ]}
            >
                <Text style={styles.legendTitle}>💡 Dica:</Text>
                <Text style={styles.legendText}>
                    As áreas coloridas representam diferentes locais da escola.
                    Toque na área onde você está para registrar sua presença.
                </Text>
            </View>

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>
                        Salvando localização...
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    instructionsContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: "#34495e",
    },
    instructions: {
        fontSize: 14,
        textAlign: "center",
        color: "#ecf0f1",
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    mapContainer: {
        width: "100%",
        aspectRatio: 4 / 3, // Ajuste conforme a proporção da sua imagem
        minHeight: 400,
        justifyContent: "center",
        alignItems: "center",
    },
    mapBackground: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    overlay: {
        position: "relative",
        width: "100%",
        height: "100%",
    },
    locationButton: {
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        padding: 8,
    },
    locationName: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
        textAlign: "center",
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10,
    },
    legendContainer: {
        padding: 16,
        backgroundColor: "#2c3e50",
        borderTopWidth: 1,
        borderTopColor: "#34495e",
    },
    legendTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#f39c12",
    },
    legendText: {
        fontSize: 12,
        color: "#bdc3c7",
        lineHeight: 18,
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: "#fff",
    },
    // Estilos para o loading da imagem
    imageLoadingContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(26, 26, 26, 0.95)",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
    },
    loadingSpinner: {
        marginTop: 20,
        marginBottom: 20,
    },
    imageLoadingText: {
        marginTop: 8,
        fontSize: 18,
        color: "#3498db",
        fontWeight: "600",
    },
    imageLoadingSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: "#95a5a6",
    },
    // Search Section Styles
    searchSection: {
        backgroundColor: "#2c3e50",
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#34495e",
    },
    searchTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#f39c12",
        marginBottom: 12,
    },
    searchInputContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    searchInput: {
        flex: 1,
        backgroundColor: "#34495e",
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: "#ecf0f1",
        borderWidth: 1,
        borderColor: "#3498db",
    },
    searchButton: {
        backgroundColor: "#3498db",
        borderRadius: 8,
        width: 48,
        height: 48,
        justifyContent: "center",
        alignItems: "center",
    },
    searchButtonDisabled: {
        backgroundColor: "#7f8c8d",
    },
    studentCard: {
        marginTop: 16,
        backgroundColor: "#34495e",
        borderRadius: 8,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#27ae60",
    },
    studentAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#2c3e50",
    },
    studentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    studentName: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#ecf0f1",
        marginBottom: 4,
    },
    studentLogin: {
        fontSize: 14,
        color: "#95a5a6",
        marginBottom: 4,
    },
    locationBadge: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        backgroundColor: "rgba(39, 174, 96, 0.2)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: "flex-start",
    },
    locationText: {
        fontSize: 13,
        color: "#27ae60",
        marginLeft: 4,
        fontWeight: "600",
    },
    clearButton: {
        padding: 8,
    },
});
