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
import {
    getUsersInArea,
    saveUserLocation,
} from "@/repository/manualLocationRepository";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ImageBackground,
    Modal,
    Platform,
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
import { t } from "@/i18n";
import useApiInterceptors from "@/services/api";
import { sendExpoNotificationToUser } from "@/services/ExpoNotificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

    const insets = useSafeAreaInsets();

    const { api } = useApiInterceptors();
    const { getItem } = useItemStorage();
    const { userLogin } = useLocalSearchParams<{ userLogin?: string }>();

    const { showConfirm, showSuccess, showError } = useAlert();
    const [selectedLocation, setSelectedLocation] = useState<string | null>(
        null
    );
    const [isLoading, setIsLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [isSendingNotification, setIsSendingNotification] = useState(false);
    const [isSharingLocation, setIsSharingLocation] = useState(false);
    const [selectedStudent, setSelectedStudent] =
        useState<Student42Data | null>(null);
    const [studentLocation, setStudentLocation] = useState<{
        areaId: string;
        areaName: string;
        lastUpdated: number;
        pushToken?: string;
    } | null>(null);
    const [myCurrentLocation, setMyCurrentLocation] = useState<{
        areaId: string;
        areaName: string;
        lastUpdated: number;
    } | null>(null);

    // Estados para modal de usuários na área
    const [showUsersModal, setShowUsersModal] = useState(false);
    const [selectedAreaForUsers, setSelectedAreaForUsers] =
        useState<Location | null>(null);
    const [usersInArea, setUsersInArea] = useState<
        Array<{
            userId: string;
            areaName: string;
            displayName: string | null;
            lastUpdated: number;
        }>
    >([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    /**
     * Carrega a localização atual do usuário logado
     */
    useEffect(() => {
        loadMyLocation();
    }, [userLogin]);

    const loadMyLocation = async () => {
        try {
            const userId = await getItem("user_id");
            const campusId = await getItem("campus_id");
            const cursusId = await getItem("cursus_id");

            setUserId(userId);

            if (!userId || !campusId || !cursusId || !userLogin) return;

            const { getUserLocation } = await import(
                "@/repository/manualLocationRepository"
            );
            searchStudent(userLogin);
            const location = await getUserLocation(userId, campusId, cursusId);
            if (location) {
                setMyCurrentLocation({
                    areaId: location.areaId,
                    areaName: location.areaName,
                    lastUpdated: location.lastUpdated,
                });
            }
        } catch (error) {
            console.error("Erro ao carregar minha localização:", error);
        }
    };

    /**
     * Calcula o nível de confiabilidade baseado no tempo decorrido
     * @param lastUpdated - Timestamp da última actualização
     * @returns Objeto com nível, cor e mensagem
     */
    const getReliability = (lastUpdated: number) => {
        const now = Date.now();
        const diffMs = now - lastUpdated;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Menos de 5 minutos: Muito Confiável
        if (diffMinutes < 5) {
            return {
                level: t("location.veryReliable"),
                color: "#27ae60", // Verde
                percentage: 100,
                message: t("location.updatedRecently"),
            };
        }
        // 5-30 minutos: Confiável
        else if (diffMinutes < 30) {
            return {
                level: t("location.reliable"),
                color: "#2ecc71", // Verde claro
                percentage: 80,
                message: t("location.updatedMinutesAgo", {
                    minutes: diffMinutes,
                }),
            };
        }
        // 30 minutos - 2 horas: Incerto
        else if (diffHours < 2) {
            return {
                level: t("location.uncertain"),
                color: "#f39c12", // Laranja
                percentage: 50,
                message:
                    diffHours === 1
                        ? t("location.updatedHoursAgo", { hours: 1 })
                        : t("location.updatedMinutesAgo", {
                            minutes: diffMinutes,
                        }),
            };
        }
        // Mais de 2 horas: Não Confiável
        else {
            return {
                level: t("location.unreliable"),
                color: "#e74c3c", // Vermelho
                percentage: 20,
                message:
                    diffDays > 0
                        ? t("location.updatedDaysAgo", { days: diffDays })
                        : t("location.updatedHoursAgo", { hours: diffHours }),
            };
        }
    };

    /**
     * Formata o tempo decorrido de forma legível
     */
    const getTimeAgo = (lastUpdated: number) => {
        const now = Date.now();
        const diffMs = now - lastUpdated;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return t("location.updatedRecently");
        if (diffMinutes < 60)
            return t("location.updatedMinutesAgo", { minutes: diffMinutes });
        if (diffHours < 24)
            return t("location.updatedHoursAgo", { hours: diffHours });
        return t("location.updatedDaysAgo", { days: diffDays });
    };

    /**
     * Busca os usuários em uma área específica
     */
    const fetchUsersInArea = async (location: Location) => {
        setLoadingUsers(true);
        setSelectedAreaForUsers(location);
        setShowUsersModal(true);

        try {
            const campusId = await getItem("campus_id");
            const cursusId = await getItem("cursus_id");

            if (!campusId || !cursusId) {
                showError(t("common.error"), t("location.campusInfoNotFound"));
                return;
            }

            const users = await getUsersInArea(location.id, campusId, cursusId);
            setUsersInArea(users);

            if (users.length === 0) {
                showError(
                    t("location.emptyArea"),
                    t("location.noStudentsInArea", { area: location.name })
                );
            }
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
            showError(t("common.error"), t("location.errorLoadingUsers"));
        } finally {
            setLoadingUsers(false);
        }
    };

    const searchStudent = async (login: string) => {
        if (!login.trim()) {
            showError(t("common.warning"), t("location.enterValidLogin"));
            return;
        }

        setIsSearching(true);
        setStudentLocation(null);

        try {
            const response = await api.get(
                `https://api.intra.42.fr/v2/users/${login.trim()}`
            );
            const studentData: Student42Data = await response.data;

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

                // Calcular confiabilidade
                const reliability = getReliability(location.lastUpdated);

                // Mensagem baseada na confiabilidade
                let reliabilityMessage = `${location.areaName}\n\n`;
                reliabilityMessage += `${t("location.reliability")} ${reliability.level
                    }\n`;
                reliabilityMessage += reliability.message;

                showSuccess(
                    t("location.locationFound"),
                    `${studentData.usual_full_name} ${t(
                        "location.studentIsAt"
                    )}\n${reliabilityMessage}`
                );
            } else {
                showError(
                    t("location.noLocation"),
                    t("location.studentNoLocation", {
                        name: studentData.usual_full_name,
                    })
                );
            }
        } catch (error: any) {
            console.error("Erro ao buscar estudante:", error);
            showError(
                t("common.error"),
                error.message || t("location.errorSearching")
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
     * Envia notificação para o estudante procurado
     */
    const notifyStudent = async () => {
        if (!selectedStudent || !studentLocation?.pushToken) {
            showError(t("common.error"), t("location.notifyStudentError"));
            return;
        }

        setIsSendingNotification(true);

        try {
            const myLogin = await getItem("user_login");
            const imageLink = await getItem("image_link");
            const myDisplayName = await getItem("displayname");

            await sendExpoNotificationToUser(studentLocation.pushToken, {
                title: t("location.someoneIsLookingForYou"),
                body: t("location.someoneIsLookingBody"),
                data: {
                    type: "location_search",
                    searchedBy:
                        `${myDisplayName} - ${myLogin}` || "Um estudante",
                    userLogin: myLogin || "",
                },
                image: imageLink || "https://via.placeholder.com/150",
            });

            showSuccess(
                t("location.notifyStudentTitle"),
                t("location.notifyStudentSuccess", {
                    name: selectedStudent.usual_full_name,
                })
            );
        } catch (error) {
            console.error("Erro ao enviar notificação:", error);
            showError(t("common.error"), t("location.notifyStudentError"));
        } finally {
            setIsSendingNotification(false);
        }
    };

    /**
     * Partilha a localização atual com o estudante procurado
     */
    const shareMyLocation = async () => {
        // Verifica se o estudante tem push token
        if (!selectedStudent || !studentLocation?.pushToken) {
            showError(t("common.error"), t("location.shareLocationError"));
            return;
        }

        // Verifica se o usuário marcou sua localização
        if (!myCurrentLocation) {
            Alert.alert(
                t("location.needToSetLocation"),
                t("location.needToSetLocationMessage"),
                [
                    {
                        text: t("common.cancel"),
                        style: "cancel",
                    },
                    {
                        text: t("location.markNow"),
                        onPress: () => {
                            // Marca a localização atual do usuário    
                        },
                    },
                ]
            );
            return;
        }

        // Confirma a localização antes de partilhar
        const timeAgo = getTimeAgo(myCurrentLocation.lastUpdated);
        Alert.alert(
            t("location.confirmShareLocation"),
            t("location.confirmShareLocationMessage", {
                location: myCurrentLocation.areaName,
                time: timeAgo,
            }),
            [
                {
                    text: t("common.cancel"),
                    style: "cancel",
                },
                {
                    text: t("location.updateFirst"),
                    onPress: () => {
                        // Marca a localização actual do usuário
                    },
                },
                {
                    text: t("location.sendLocation"),
                    onPress: async () => {
                        await sendLocationNotification();
                    },
                },
            ]
        );
    };

    /**
     * Envia a notificação de localização partilhada
     */
    const sendLocationNotification = async () => {
        if (
            !selectedStudent ||
            !studentLocation?.pushToken ||
            !myCurrentLocation
        ) {
            return;
        }

        setIsSharingLocation(true);

        try {
            const myLogin = await getItem("user_login");
            const imageLink = await getItem("image_link");
            const myDisplayName = await getItem("displayname");

            await sendExpoNotificationToUser(studentLocation.pushToken, {
                title: t("location.sharedLocationWithYou", {
                    name: myDisplayName || myLogin || "Um estudante",
                }),
                body: t("location.sharedLocationBody", {
                    name: myLogin || "Um estudante",
                    location: myCurrentLocation.areaName,
                }),
                data: {
                    type: "location_shared",
                    sharedBy: `${myDisplayName} - ${myLogin}` || "Um estudante",
                    location: myCurrentLocation.areaName,
                },
                image: imageLink || "https://via.placeholder.com/150",
            });

            showSuccess(
                t("location.shareLocationTitle"),
                t("location.shareLocationSuccess", {
                    name: selectedStudent.usual_full_name,
                })
            );
        } catch (error) {
            console.error("Erro ao partilhar localização:", error);
            showError(t("common.error"), t("location.shareLocationError"));
        } finally {
            setIsSharingLocation(false);
        }
    };

    /**
     * Registra a própria localização do usuário logado
     */
    const handleLocationSelect = async (location: Location) => {
        setSelectedLocation(location.id);

        showConfirm(
            t("location.confirmLocation"),
            t("location.youAreAt", { location: location.name }),
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
                    const displayName = await getItem("displayname");
                    const pushToken = await AsyncStorage.getItem("push_token");

                    if (!userId) {
                        throw new Error("User ID not found in storage");
                    } else if (!campusId) {
                        throw new Error("Campus ID not found in storage");
                    } else if (!cursusId) {
                        throw new Error("Cursus ID not found in storage");
                    } else if (!pushToken && Platform.OS !== "web") {
                        throw new Error("Push Token not found in storage");
                    }

                    await saveUserLocation(
                        userId,
                        campusId,
                        cursusId,
                        displayName,
                        pushToken,
                        locationData
                    );

                    // Actualiza o estado da localização atual
                    setMyCurrentLocation({
                        areaId: location.id,
                        areaName: location.name,
                        lastUpdated: Date.now(),
                    });

                    showSuccess(
                        t("location.locationSaved"),
                        t("location.locationSavedSuccess")
                    );
                } catch (error) {
                    console.error("Erro ao salvar localização: ", error);
                    showError(
                        t("location.errorSaving"),
                        t("location.errorSavingLocation")
                    );
                } finally {
                    setIsLoading(false);
                }
            },
            () => setSelectedLocation(null)
        );
    };

    return (
        <View style={[styles.container, Platform.OS === "web" ? styles.inner : {},]}>
            {/* Search Section */}
            {Platform.OS !== "web" &&
                <View
                    style={[styles.searchSection, { paddingTop: insets.top + 16 }]}
                >
                    <Text style={styles.searchTitle}>
                        {t("location.searchStudent")}
                    </Text>

                    <View style={styles.searchInputContainer}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t("location.searchPlaceholder")}
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
                                {studentLocation &&
                                    (() => {
                                        const reliability = getReliability(
                                            studentLocation.lastUpdated
                                        );
                                        return (
                                            <>
                                                <View style={styles.locationBadge}>
                                                    <Ionicons
                                                        name="location"
                                                        size={16}
                                                        color="#27ae60"
                                                    />
                                                    <Text
                                                        style={styles.locationText}
                                                    >
                                                        {studentLocation.areaName}
                                                    </Text>
                                                </View>
                                                <View
                                                    style={[
                                                        styles.reliabilityBadge,
                                                        {
                                                            backgroundColor: `${reliability.color}20`,
                                                        },
                                                    ]}
                                                >
                                                    <View
                                                        style={[
                                                            styles.reliabilityIndicator,
                                                            {
                                                                backgroundColor:
                                                                    reliability.color,
                                                            },
                                                        ]}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.reliabilityText,
                                                            {
                                                                color: reliability.color,
                                                            },
                                                        ]}
                                                    >
                                                        {reliability.level} •{" "}
                                                        {getTimeAgo(
                                                            studentLocation.lastUpdated
                                                        )}
                                                    </Text>
                                                </View>
                                            </>
                                        );
                                    })()}
                            </View>
                            <View style={styles.studentCardActions}>
                                {studentLocation?.pushToken &&
                                    userId !== selectedStudent.id.toString() && (
                                        <>
                                            <TouchableOpacity
                                                style={[
                                                    styles.notifyButton,
                                                    isSendingNotification &&
                                                    styles.notifyButtonDisabled,
                                                ]}
                                                onPress={notifyStudent}
                                                disabled={isSendingNotification}
                                            >
                                                {isSendingNotification ? (
                                                    <ActivityIndicator
                                                        color="#fff"
                                                        size="small"
                                                    />
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name="notifications"
                                                            size={16}
                                                            color="#fff"
                                                        />
                                                        <Text
                                                            style={
                                                                styles.notifyButtonText
                                                            }
                                                        >
                                                            {t(
                                                                "location.notifyStudent"
                                                            )}
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[
                                                    styles.shareButton,
                                                    isSharingLocation &&
                                                    styles.shareButtonDisabled,
                                                ]}
                                                onPress={shareMyLocation}
                                                disabled={isSharingLocation}
                                            >
                                                {isSharingLocation ? (
                                                    <ActivityIndicator
                                                        color="#fff"
                                                        size="small"
                                                    />
                                                ) : (
                                                    <>
                                                        <Ionicons
                                                            name="location"
                                                            size={16}
                                                            color="#fff"
                                                        />
                                                        <Text
                                                            style={
                                                                styles.shareButtonText
                                                            }
                                                        >
                                                            {t(
                                                                "location.shareMyLocation"
                                                            )}
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </>
                                    )}
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
                        </View>
                    )}
                </View>}

            {/* Instruções */}
            <View style={styles.instructionsContainer}>
                <Text style={styles.instructions}>
                    {t("location.tapToRegister")}
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
                        onLoadStart={() => setImageLoading(Platform.OS !== "web")}
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
                                    {t("common.loading")}
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
                                        onLongPress={() =>
                                            fetchUsersInArea(location)
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
                    { marginBottom: Platform.OS !== "web" ? insets.bottom + 48 : 0 },
                ]}
            >
                <Text style={styles.legendTitle}>{t("location.tipTitle")}</Text>
                <Text style={styles.legendText}>{t("location.tipText")}</Text>
            </View>

            {/* Modal de Usuários na Área */}
            <Modal
                visible={showUsersModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowUsersModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header do Modal */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleContainer}>
                                <Ionicons
                                    name="people"
                                    size={24}
                                    color="#f39c12"
                                />
                                <Text style={styles.modalTitle}>
                                    {selectedAreaForUsers?.name || "Área"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowUsersModal(false)}
                                style={styles.modalCloseButton}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={32}
                                    color="#e74c3c"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Contador de Usuários */}
                        <View style={styles.userCountBadge}>
                            <Ionicons name="person" size={16} color="#fff" />
                            <Text style={styles.userCountText}>
                                {usersInArea.length}{" "}
                                {usersInArea.length === 1
                                    ? t("location.student")
                                    : t("location.students")}{" "}
                                {t("location.inThisArea")}
                            </Text>
                        </View>

                        {/* Lista de Usuários */}
                        {loadingUsers ? (
                            <View style={styles.modalLoadingContainer}>
                                <ActivityIndicator
                                    size="large"
                                    color="#3498db"
                                />
                                <Text style={styles.modalLoadingText}>
                                    {t("location.searchingStudents")}
                                </Text>
                            </View>
                        ) : usersInArea.length > 0 ? (
                            <FlatList
                                data={usersInArea}
                                keyExtractor={(item) => item.userId}
                                contentContainerStyle={styles.usersList}
                                renderItem={({ item, index }) => {
                                    const reliability = getReliability(
                                        item.lastUpdated
                                    );
                                    return (
                                        <View style={styles.userCard}>
                                            <View style={styles.userNumber}>
                                                <Text
                                                    style={
                                                        styles.userNumberText
                                                    }
                                                >
                                                    {index + 1}
                                                </Text>
                                            </View>
                                            <View
                                                style={styles.userCardContent}
                                            >
                                                <View
                                                    style={
                                                        styles.userCardHeader
                                                    }
                                                >
                                                    <Ionicons
                                                        name="person-circle"
                                                        size={20}
                                                        color="#3498db"
                                                    />
                                                    <Text
                                                        style={
                                                            styles.userIdText
                                                        }
                                                    >
                                                        {item.displayName ||
                                                            "Nome não disponível"}
                                                    </Text>
                                                </View>

                                                {/* Badge de Confiabilidade */}
                                                <View
                                                    style={[
                                                        styles.reliabilityBadgeSmall,
                                                        {
                                                            backgroundColor: `${reliability.color}20`,
                                                        },
                                                    ]}
                                                >
                                                    <View
                                                        style={[
                                                            styles.reliabilityIndicatorSmall,
                                                            {
                                                                backgroundColor:
                                                                    reliability.color,
                                                            },
                                                        ]}
                                                    />
                                                    <Text
                                                        style={[
                                                            styles.reliabilityTextSmall,
                                                            {
                                                                color: reliability.color,
                                                            },
                                                        ]}
                                                    >
                                                        {reliability.level}
                                                    </Text>
                                                </View>

                                                <View
                                                    style={
                                                        styles.userCardFooter
                                                    }
                                                >
                                                    <Ionicons
                                                        name="time-outline"
                                                        size={14}
                                                        color="#95a5a6"
                                                    />
                                                    <Text
                                                        style={
                                                            styles.userTimestamp
                                                        }
                                                    >
                                                        {getTimeAgo(
                                                            item.lastUpdated
                                                        )}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                }}
                            />
                        ) : (
                            <View style={styles.emptyStateContainer}>
                                <Ionicons
                                    name="person-outline"
                                    size={64}
                                    color="#95a5a6"
                                />
                                <Text style={styles.emptyStateTitle}>
                                    {t("location.noStudentsHere")}
                                </Text>
                                <Text style={styles.emptyStateText}>
                                    {t("location.areaEmpty")}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>
                        {t("location.savingLocation")}
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
        padding: 16,
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
    reliabilityBadge: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    reliabilityIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    reliabilityText: {
        fontSize: 11,
        fontWeight: "600",
    },
    reliabilityBadgeSmall: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
        marginBottom: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: "flex-start",
    },
    reliabilityIndicatorSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    reliabilityTextSmall: {
        fontSize: 10,
        fontWeight: "600",
    },
    studentCardActions: {
        gap: 8,
        alignItems: "center",
    },
    notifyButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f39c12",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    notifyButtonDisabled: {
        backgroundColor: "#7f8c8d",
    },
    notifyButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#fff",
    },
    shareButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#3498db",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    shareButtonDisabled: {
        backgroundColor: "#7f8c8d",
    },
    shareButtonText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#fff",
    },
    clearButton: {
        padding: 8,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#2c3e50",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "80%",
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#34495e",
    },
    modalTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#ecf0f1",
    },
    modalCloseButton: {
        padding: 4,
    },
    userCountBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#3498db",
        marginHorizontal: 20,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 8,
    },
    userCountText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
    },
    usersList: {
        padding: 20,
        paddingTop: 16,
    },
    userCard: {
        backgroundColor: "#34495e",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        borderLeftWidth: 4,
        borderLeftColor: "#3498db",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    userNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#3498db",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    userNumberText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
    },
    userCardContent: {
        flex: 1,
    },
    userCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        gap: 8,
    },
    userIdText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#ecf0f1",
    },
    userCardFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    userTimestamp: {
        fontSize: 12,
        color: "#95a5a6",
    },
    modalLoadingContainer: {
        padding: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    modalLoadingText: {
        marginTop: 16,
        fontSize: 14,
        color: "#95a5a6",
    },
    emptyStateContainer: {
        padding: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#ecf0f1",
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 14,
        color: "#95a5a6",
        textAlign: "center",
    },
    inner: {
        width: "100%",
        maxWidth: 600, // limite superior
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
});
