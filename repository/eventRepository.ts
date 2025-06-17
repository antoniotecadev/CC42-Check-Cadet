import useAlert from "@/hooks/useAlert";
import { Event } from "@/model/Event";
import useApiInterceptors from "@/services/api";
import { useQuery } from "@tanstack/react-query";

interface GetEventsParams {
    campusId: number;
    cursusId?: number;
    isStaff: boolean;
}

export default function useEvents(params: GetEventsParams) {
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
