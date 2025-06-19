import { database } from "@/firebaseConfig";
import useAlert from "@/hooks/useAlert";
import { Event } from "@/model/Event";
import useApiInterceptors from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import { onValue, ref } from "firebase/database";

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
            showError("Evento", "Erro ao buscar eventos: " + error);
            return [];
        }
    };

    return useQuery<Event[]>({
        queryKey: ["events", params],
        queryFn: () => (params ? getEvents(params) : Promise.resolve([])),
        enabled: !!params,
        staleTime: 1000 * 60 * 5, // cache por 5 minutos
        retry: 1, // tenta 1x se falhar
    });
}

export type RatingResult = {
    ratingValue: number;
    ratingCount: number;
    stars: ("star" | "star-half" | "star-o")[];
};

export function fetchRatings(
    campusId: string,
    cursusId: string,
    type: string,
    typeId: string,
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

        callback({ ratingValue, ratingCount, stars });
    });

    return unsubscribe; // Chame para parar de ouvir
}
