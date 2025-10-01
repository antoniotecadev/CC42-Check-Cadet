import { database } from "@/firebaseConfig";
import useApiInterceptors from "@/services/api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { get, ref, set } from "firebase/database";

/**
 * Send a comment for a specific item (meal or event).
 * Stores the comment under: campus/{campusId}/cursus/{cursusId}/{type}/{typeId}/comments/{userId}
 */
export function sendComment(
    campusId: string,
    cursusId: string,
    type: string,
    typeId: string,
    userId: string,
    comment: string
): Promise<void> {
    const commentRef = ref(
        database,
        `campus/${campusId}/cursus/${cursusId}/${type}/${typeId}/comments/${userId}`
    );

    // Return the promise so callers can await and handle errors
    return set(commentRef, comment);
}

/**
 * Get a comment for a specific item (meal or event) by a user.
 * Returns the comment string or null if not present.
 */
export async function getComment(
    campusId: string,
    cursusId: string,
    type: string,
    typeId: string,
    userId: string
): Promise<string | null> {
    const commentRef = ref(
        database,
        `campus/${campusId}/cursus/${cursusId}/${type}/${typeId}/comments/${userId}`
    );

    const snapshot = await get(commentRef);
    if (snapshot.exists()) {
        return snapshot.val() as string;
    }
    return null;
}

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

/**
 * Send both rating and comment together.
 * If rating is 0 or null, only comment is sent.
 * If comment is empty, only rating is sent.
 * Both can be sent together.
 */
export async function sendRatingAndComment(
    campusId: string,
    cursusId: string,
    type: string,
    typeId: string,
    userId: string,
    rating: number | null,
    comment: string | null
): Promise<void> {
    const promises: Promise<void>[] = [];

    // Send rating if provided and > 0
    if (rating && rating > 0) {
        const ratingRef = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/${type}/${typeId}/ratings/${userId}`
        );
        promises.push(set(ratingRef, rating));
    }

    // Send comment if provided and not empty
    if (comment && comment.trim().length > 0) {
        const commentRef = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/${type}/${typeId}/comments/${userId}`
        );
        promises.push(set(commentRef, comment.trim()));
    }

    // Execute both operations
    if (promises.length > 0) {
        await Promise.all(promises);
    }
}

export interface UserPresence {
    id: number;
    kind: string;
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
        queryKey: type === "events" 
            ? ["event-users", eventId] 
            : ["cursus-users", cursusId, campusId],
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

export function optimizeUsers(
    users: UserPresence[],
    ids: (string | number)[],
    type: "events" | "meals"
): UserPresence[] {
    // Transforma lista de IDs em Set para buscas rápidas
    const idSet = new Set(ids.map(String));
    const key = type === "meals" ? 'isSubscribed' : 'isPresent';

    // Usa reduce para filtrar e mapear ao mesmo tempo
    return users.reduce<UserPresence[]>((acc, user) => {
        if (user.kind !== "student") {
            return acc; // pula se for 'student'
        }

        const updatedUser = {
            ...user,
            [key]: idSet.has(String(user.id)),
        };

        acc.push(updatedUser); // adiciona ao resultado
        return acc;
    }, []);
}
