import { database } from "@/firebaseConfig";
import useAlert from "@/hooks/useAlert";
import { Event } from "@/model/Event";
import useApiInterceptors from "@/services/api";
import { BarcodeResultParams } from "@/utility/QRCodeUtil";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { get, onValue, ref, set, update } from "firebase/database";

interface GetEventsParams {
    campusId: number;
    cursusId?: number;
    isStaff: boolean;
}

export function useEvents(params: GetEventsParams) {
    const { showError } = useAlert();
    const { api } = useApiInterceptors();

    const getEvents = async ({
        campusId,
        cursusId,
        isStaff,
    }: GetEventsParams): Promise<Event[]> => {
        try {
            const url = isStaff
                ? `/v2/campus/${campusId}/events`
                : `/v2/campus/${campusId}/cursus/${cursusId}/events`;

            const response = await api.get<Event[]>(url);
            return response.data;
        } catch (error) {
            showError("ERRO", "Erro ao buscar eventos: " + error);
            return [];
        }
    };

    return useQuery<Event[]>({
        queryKey: ["events", params],
        queryFn: () => (params ? getEvents(params) : Promise.resolve([])),
        enabled: !!params,
        staleTime: 1000 * 60 * 60 * 24, // Dados ficam "frescos" por 24 horas
        retry: 2, // tenta 2x se falhar
    });
}

export type RatingResult = {
    ratingValue: number;
    ratingCount: number;
    stars: ("star" | "star-half" | "star-o")[];
    userRating: number | undefined;
    userPresent?: boolean;
};

export async function userIsPresentOrSubscribed({
    campusId,
    cursusId,
    type,
    typeId,
    userId,
}: {
    campusId: string;
    cursusId: string;
    type: "events" | "meals";
    typeId: string;
    userId: string;
}): Promise<boolean> {
    const participantsRef = ref(
        database,
        `campus/${campusId}/cursus/${cursusId}/${type}/${typeId}/participants/${userId}`
    );
    const snapshot = await get(participantsRef);
    return snapshot.exists();
}

export function fetchRatings(
    campusId: string,
    cursusId: string,
    type: string,
    typeId: string,
    userId: string,
    callback: (result: RatingResult) => void
) {
    const reference = ref(
        database,
        `campus/${campusId}/cursus/${cursusId}/${type}/${typeId}/ratings`
    );

    const unsubscribe = onValue(reference, (snapshot) => {
        if (!snapshot.exists()) {
            callback({
                ratingValue: 0,
                ratingCount: 0,
                stars: ["star-o", "star-o", "star-o", "star-o", "star-o"],
                userRating: undefined,
            });
            return;
        }
        const ratingsObj = snapshot.val(); // { "1225555": 5, "2485466": 4, ... }
        const ratings = Object.values(ratingsObj || {}) as number[]; // [5, 4, 3, ...]
        const ratingCount = ratings.length;
        const sum = ratings.reduce((acc, val) => acc + val, 0); // soma todos os valores
        const ratingValue = ratingCount > 0 ? sum / ratingCount : 0;

        // Monta os ícones das estrelas
        const stars: ("star" | "star-half" | "star-o")[] = [];
        let value = ratingValue;
        for (let i = 0; i < 5; i++) {
            if (value >= 1) {
                stars.push("star");
            } else if (value >= 0.5) {
                stars.push("star-half");
            } else {
                stars.push("star-o");
            }
            value -= 1;
        }

        // Verifica se o usuário já avaliou
        const userRating = ratingsObj[userId]
            ? Number(ratingsObj[userId])
            : undefined;

        callback({ ratingValue, ratingCount, stars, userRating });
    });

    return unsubscribe; // Chame para parar de ouvir
}

export function rate(
    campusId: string,
    cursusId: string,
    type: string,
    typeId: string,
    userId: string,
    rating: number,
    onSuccess?: () => void,
    onError?: (error: any) => void
) {
    const ratingRef = ref(
        database,
        `campus/${campusId}/cursus/${cursusId}/${type}/${typeId}/ratings/${userId}`
    );

    set(ratingRef, rating)
        .then(() => {
            if (onSuccess) onSuccess();
        })
        .catch((error) => {
            if (onError) onError(error);
        });
}

export async function markAttendance({
    eventId,
    userStaffId,
    registeredBy,
    userId,
    displayName,
    cursusId,
    campusId,
    imageSource,
    setLoading,
    showModal,
    onResumeCamera,
}: BarcodeResultParams) {
    try {
        setLoading(true);

        // Referência para participantes do evento
        const participantsRef = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/events/${eventId}/participants/${userId}`
        );

        // Verifica se já marcou presença
        const snapshot = await get(participantsRef);
        if (snapshot.exists()) {
            setLoading(false);
            showModal({
                title: "Aviso!",
                message: `${displayName}\nVocê já marcou presença neste evento.`,
                color: "#FDD835",
                imageSource: { uri: imageSource },
                onClose: onResumeCamera,
            });
            return;
        }

        // Marca presença
        const participantData = {
            [userId]: true,
            registeredBy,
        };

        const eventUpdates = {
            [`cursus/${cursusId}/events/${eventId}/participants/${userId}`]:
                participantData,
        };

        const campusRef = ref(database, `campus/${campusId}`);
        await update(campusRef, eventUpdates);

        if (userStaffId) {
            // Atualiza a presença temporária para o usuário
            const infoTmpRef = ref(
                database,
                `campus/${campusId}/cursus/${cursusId}/infoTmpUserEventMeal/${userStaffId}`
            );
            await set(infoTmpRef, {
                displayName,
                urlImageUser: imageSource,
            });
        }

        setLoading(false);
        showModal({
            title: "Sucesso!",
            message: `${displayName}\nPresença marcada com sucesso!`,
            color: "#4CAF50",
            imageSource: { uri: imageSource },
            onClose: onResumeCamera,
        });
    } catch (e: any) {
        setLoading(false);
        showModal({
            title: "Erro!",
            message: `Erro ao marcar presença: ${e.message}`,
            color: "#E53935",
            imageSource: { uri: imageSource },
            onClose: onResumeCamera,
        });
    }
}

export interface EventUser {
    id: number;
    login: string;
    displayname: string;
    image?: string;
    isPresent: boolean;
    isSubscribed: boolean;
}

export function useEventUsersPaginated(eventId: number, pageSize = 30) {
    const { api } = useApiInterceptors();

    return useInfiniteQuery({
        queryKey: ["event-users", eventId], // Chave única para identificar a query
        queryFn: async ({ pageParam = 1 }) => {
            // Função que busca os usuários do evento
            const res = await api.get<EventUser[]>(
                `/v2/events/${eventId}/users?page[number]=${pageParam}&page[size]=${pageSize}`
            );
            return {
                users: res.data,
                nextPage:
                    res.data.length === pageSize ? pageParam + 1 : undefined,
            };
        },
        initialPageParam: 1, // Começa na primeira página
        getNextPageParam: (lastPage) => lastPage.nextPage, // Define a próxima página com base no tamanho da página
        enabled: !!eventId, // Garante que a query só roda se eventId estiver definido
        refetchOnWindowFocus: false, // Evita refetch automático ao voltar para a página
        staleTime: 1000 * 60 * 5, // Dados ficam "frescos" por 5 minutos
        retry: 2, // Tenta novamente 2 vezes em caso de falha
    });
}
