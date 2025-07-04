import { database } from "@/firebaseConfig";
import useApiInterceptors from "@/services/api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { get, ref, set } from "firebase/database";

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
        `campus/${campusId}/cursus/${cursusId}/${type}/${typeId}/${
            type === "events" ? `participants` : `subscriptions`
        }/${userId}`
    );
    const snapshot = await get(participantsRef);
    return snapshot.exists();
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

export interface UserPresence {
    id: number;
    login: string;
    displayname: string;
    image?: string;
    isPresent: boolean;
    isSubscribed: boolean;
}

export interface UserSubscription {
    user: UserPresence;
}

export function useUsersPaginated(
    type: string,
    eventId: string,
    cursusId: string,
    campusId: string,
    pageSize = 30
) {
    let res;
    const { api } = useApiInterceptors();
    return useInfiniteQuery({
        queryKey: type === "events" ? ["event-users", eventId] : ["meal-users"], // Chave única para identificar a query
        queryFn: async ({ pageParam = 1 }) => {
            // Função que busca os usuários
            type === "events"
                ? (res = await api.get<UserPresence[]>(
                      `/v2/events/${eventId}/users?page[number]=${pageParam}&page[size]=${pageSize}`
                  ))
                : (res = await api.get<UserSubscription[]>(
                      `/v2/cursus_users?filter[cursus_id]=${cursusId}&filter[campus_id]=${campusId}&filter[active]=true&page[number]=${pageParam}&page[size]=${pageSize}`
                  ));
            return {
                users: res.data,
                nextPage:
                    res.data.length === pageSize ? pageParam + 1 : undefined,
            };
        },
        initialPageParam: 1, // Começa na primeira página
        getNextPageParam: (lastPage) => lastPage.nextPage, // Define a próxima página com base no tamanho da página
        enabled: type === "events" ? !!eventId : !!cursusId && !!campusId, // Garante que a query só roda se eventId | cursusId && campusId estiver definido
        refetchOnWindowFocus: false, // Evita refetch automático ao voltar para a página
        staleTime: 1000 * 60 * 30, // Dados ficam "frescos" por 30 minutos
        retry: 2, // Tenta novamente 2 vezes em caso de falha
    });
}
