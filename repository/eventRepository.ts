import useAlert from "@/hooks/useAlert";
import { Event } from "@/model/Event";
import useApiInterceptors from "@/services/api";

interface GetEventsParams {
    campusId: number;
    cursusId?: number;
    isStaff: boolean;
}

export default function usevents() {
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
    return { getEvents };
}
