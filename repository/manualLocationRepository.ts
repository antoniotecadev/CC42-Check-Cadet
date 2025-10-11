import { get, getDatabase, onValue, ref, set } from "firebase/database";

export interface LocationData {
    areaId: string;
    areaName: string;
}

export interface UserLocationDocument {
    areaId: string;
    areaName: string;
    timestamp: number;
    displayName: string | null;
    lastUpdated: number;
}

/**
 * Salva a localização do usuário no Firebase Realtime Database
 * @param userId - ID do usuário autenticado
 * @param locationData - Dados da localização selecionada
 */
export async function saveUserLocation(
    userId: string,
    campusId: string,
    cursusId: string,
    displayName: string | null,
    locationData: LocationData
): Promise<void> {
    try {
        const db = getDatabase();
        const userLocationRef = ref(
            db,
            `campus/${campusId}/cursus/${cursusId}/user_locations/${userId}`
        );

        const timestamp = Date.now();
        const locationDocument = {
            displayName: displayName,
            areaId: locationData.areaId,
            areaName: locationData.areaName,
            lastUpdated: timestamp,
        };

        await set(userLocationRef, locationDocument);
        console.log("✅ Localização salva com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao salvar localização:", error);
        throw error;
    }
}

/**
 * Busca a localização actual de um usuário específico
 * @param userId - ID do usuário
 * @returns Dados da localização actual ou null
 */
export async function getUserLocation(
    userId: string,
    campusId: string,
    cursusId: string
): Promise<UserLocationDocument | null> {
    try {
        const db = getDatabase();
        const userLocationRef = ref(
            db,
            `campus/${campusId}/cursus/${cursusId}/user_locations/${userId}`
        );
        const snapshot = await get(userLocationRef);

        if (snapshot.exists()) {
            return snapshot.val() as UserLocationDocument;
        }
        return null;
    } catch (error) {
        console.error("Erro ao buscar localização:", error);
        return null;
    }
}

/**
 * Busca todos os usuários em uma área específica
 * @param areaId - ID da área (ex: 'cluster_1')
 * @param campusId - ID do campus
 * @param cursusId - ID do cursus
 * @returns Lista de usuários na área com seus IDs
 */
export async function getUsersInArea(
    areaId: string,
    campusId: string,
    cursusId: string
): Promise<Array<UserLocationDocument & { userId: string }>> {
    try {
        const db = getDatabase();
        const usersRef = ref(
            db,
            `campus/${campusId}/cursus/${cursusId}/user_locations`
        );
        const snapshot = await get(usersRef);

        if (!snapshot.exists()) {
            return [];
        }

        const users: Array<UserLocationDocument & { userId: string }> = [];
        const allUsers = snapshot.val();

        Object.entries(allUsers).forEach(([userId, userData]: [string, any]) => {
            if (userData.areaId === areaId) {
                users.push({
                    ...userData,
                    userId,
                });
            }
        });

        return users;
    } catch (error) {
        console.error("Erro ao buscar usuários na área:", error);
        return [];
    }
}

/**
 * Calcula estatísticas de ocupação por área
 * @returns Objeto com contagem de usuários por área
 */
export async function getOccupancyStatistics(): Promise<
    Record<string, number>
> {
    try {
        const db = getDatabase();
        const locationsRef = ref(db, "user_locations");
        const snapshot = await get(locationsRef);

        if (!snapshot.exists()) {
            return {};
        }

        const stats: Record<string, number> = {};
        const allUsers = snapshot.val();

        Object.values(allUsers).forEach((userData: any) => {
            const areaId = userData.currentLocation?.areaId;
            if (areaId) {
                stats[areaId] = (stats[areaId] || 0) + 1;
            }
        });

        return stats;
    } catch (error) {
        console.error("Erro ao calcular estatísticas:", error);
        return {};
    }
}

/**
 * Observa mudanças na localização de um usuário em tempo real
 * @param userId - ID do usuário
 * @param callback - Função chamada quando a localização muda
 * @returns Função para cancelar o listener
 */
export function watchUserLocation(
    userId: string,
    callback: (location: UserLocationDocument | null) => void
): () => void {
    const db = getDatabase();
    const userLocationRef = ref(db, `user_locations/${userId}`);

    const unsubscribe = onValue(userLocationRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val() as UserLocationDocument);
        } else {
            callback(null);
        }
    });

    return unsubscribe;
}

/**
 * Observa mudanças em todas as localizações em tempo real
 * @param callback - Função chamada quando alguma localização muda
 * @returns Função para cancelar o listener
 */
export function watchAllLocations(
    callback: (locations: Record<string, UserLocationDocument>) => void
): () => void {
    const db = getDatabase();
    const locationsRef = ref(db, "user_locations");

    const unsubscribe = onValue(locationsRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback({});
        }
    });

    return unsubscribe;
}

/**
 * Observa mudanças em uma área específica em tempo real
 * @param areaId - ID da área
 * @param callback - Função chamada quando a ocupação da área muda
 * @returns Função para cancelar o listener
 */
export function watchAreaOccupancy(
    areaId: string,
    callback: (userCount: number, users: UserLocationDocument[]) => void
): () => void {
    const db = getDatabase();
    const locationsRef = ref(db, "user_locations");

    const unsubscribe = onValue(locationsRef, (snapshot) => {
        if (!snapshot.exists()) {
            callback(0, []);
            return;
        }

        const users: UserLocationDocument[] = [];
        const allUsers = snapshot.val();

        Object.values(allUsers).forEach((userData: any) => {
            if (userData.currentLocation?.areaId === areaId) {
                users.push(userData as UserLocationDocument);
            }
        });

        callback(users.length, users);
    });

    return unsubscribe;
}

/**
 * Determina o nível de ocupação de uma área
 * @param userCount - Número de usuários
 * @param maxCapacity - Capacidade máxima (padrão: 30)
 * @returns Nível de ocupação
 */
export function getOccupancyLevel(
    userCount: number,
    maxCapacity: number = 30
): "low" | "medium" | "high" {
    const percentage = (userCount / maxCapacity) * 100;

    if (percentage < 40) return "low"; // Verde
    if (percentage < 75) return "medium"; // Amarelo
    return "high"; // Vermelho
}

/**
 * Retorna a cor baseada no nível de ocupação
 * @param level - Nível de ocupação
 * @returns Código de cor hexadecimal
 */
export function getOccupancyColor(level: "low" | "medium" | "high"): string {
    const colors = {
        low: "#2ecc71", // Verde
        medium: "#f39c12", // Amarelo/Laranja
        high: "#e74c3c", // Vermelho
    };
    return colors[level];
}

/**
 * Verifica se amigos estão na mesma área
 * @param userId - ID do usuário atual
 * @param friendsIds - Lista de IDs dos amigos
 * @param campusId - ID do campus
 * @param cursusId - ID do cursus
 * @returns Amigos que estão na mesma área
 */
export async function checkNearbyFriends(
    userId: string,
    friendsIds: string[],
    campusId: string,
    cursusId: string
) {
    try {
        const userLocation = await getUserLocation(userId, campusId, cursusId);
        if (!userLocation) return [];

        const nearbyFriends = [];

        for (const friendId of friendsIds) {
            const friendLocation = await getUserLocation(
                friendId,
                campusId,
                cursusId
            );

            if (
                friendLocation &&
                friendLocation.areaId === userLocation.areaId
            ) {
                nearbyFriends.push({
                    friendId,
                    location: friendLocation,
                    isSameArea: true,
                });
            }
        }

        return nearbyFriends;
    } catch (error) {
        console.error("Erro ao verificar amigos próximos:", error);
        return [];
    }
}

export default {
    saveUserLocation,
    getUserLocation,
    getUsersInArea,
    checkNearbyFriends,
};
