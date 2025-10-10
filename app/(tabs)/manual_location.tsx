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
    ImageBackground,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SCHOOL_LOCATIONS, type Location } from "@/constants/schoolLocations";
import useItemStorage from "@/hooks/storage/useItemStorage";

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

    const handleLocationSelect = async (location: Location) => {
        setSelectedLocation(location.id);

        showConfirm(
            "📍 Confirmar Localização",
            `Você está em: ${location.name}`,
            async () => {
                setIsLoading(true);
                try {
                    // TODO: Implementar salvamento no Firebase
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
            {/* Instruções */}
            <View
                style={[
                    styles.instructionsContainer,
                    { paddingTop: insets.top + 16 },
                ]}
            >
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
                            {SCHOOL_LOCATIONS.map((location) => (
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
                                            borderColor:
                                                selectedLocation === location.id
                                                    ? "#fff"
                                                    : "transparent",
                                            borderWidth:
                                                selectedLocation === location.id
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
                                    {selectedLocation === location.id && (
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={24}
                                            color="#fff"
                                        />
                                    )}
                                </TouchableOpacity>
                            ))}
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
});
