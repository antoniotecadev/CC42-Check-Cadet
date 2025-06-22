import useApiInterceptors from "@/services/api";
import { useInfiniteQuery } from "@tanstack/react-query";

export interface EventUser {
    id: number;
    login: string;
    displayname: string;
    image?: string;
}

export function useEventUsersPaginated(eventId: number, pageSize = 30) {
    const { api } = useApiInterceptors();

    return useInfiniteQuery({
        queryKey: ["event-users", eventId], // Chave única para identificar a query
        queryFn: async ({ pageParam = 1 }) => { // Função que busca os usuários do evento
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
