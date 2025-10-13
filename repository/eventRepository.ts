import { database } from "@/firebaseConfig";
import useAlert from "@/hooks/useAlert";
import { t } from "@/i18n";
import { Event } from "@/model/Event";
import useApiInterceptors from "@/services/api";
import { BarcodeResultParams } from "@/utility/QRCodeUtil";
import { useQuery } from "@tanstack/react-query";
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
        } catch (error: any) {
            showError(t('common.error'), t('events.errorLoadingEvents') + error.message);
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

        // Build star icons
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

        // Check if user has already rated
        const userRating = ratingsObj[userId]
            ? Number(ratingsObj[userId])
            : undefined;

        callback({ ratingValue, ratingCount, stars, userRating });
    });

    return unsubscribe; // Chame para parar de ouvir
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
    eventAction,
    setLoading,
    showModal,
    onResumeCamera,
}: BarcodeResultParams & { eventAction?: "checkin" | "checkout" }) {
    try {
        setLoading(true);

        // Reference to event participants
        const participantsRef = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/events/${eventId}/participants/${userId}`
        );

        // Check current attendance status
        const snapshot = await get(participantsRef);
        const existingData = snapshot.exists() ? snapshot.val() : null;
        
        if (eventAction === "checkin") {
            // Check-in logic
            if (existingData && existingData.checkin) {
                setLoading(false);
                showModal({
                    title: t('common.warning'),
                    message: `${displayName}\n${t('events.alreadyCheckedIn')}`,
                    color: "#FDD835",
                    imageSource: { uri: imageSource },
                    onClose: onResumeCamera,
                });
                return;
            }

            // Marca check-in
            const participantData = {
                ...existingData,
                checkin: Date.now(),
                registeredBy,
            };

            const eventUpdates = {
                [`cursus/${cursusId}/events/${eventId}/participants/${userId}`]:
                    participantData,
            };

            const campusRef = ref(database, `campus/${campusId}`);
            await update(campusRef, eventUpdates);

            if (userStaffId) {
                // Actualiza a presença temporária para o usuário
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
                title: t('common.success'),
                message: `${displayName}\n${t('events.checkinSuccessful')}`,
                color: "#4CAF50",
                imageSource: { uri: imageSource },
                onClose: onResumeCamera,
            });
            
        } else {
            // Check-out logic
            if (!existingData || !existingData.checkin) {
                setLoading(false);
                showModal({
                    title: t('common.warning'),
                    message: `${displayName}\n${t('events.needCheckinFirst')}`,
                    color: "#FF5722",
                    imageSource: { uri: imageSource },
                    onClose: onResumeCamera,
                });
                return;
            }

            if (existingData.checkout) {
                setLoading(false);
                showModal({
                    title: t('common.warning'),
                    message: `${displayName}\n${t('events.alreadyCheckedOut')}`,
                    color: "#FDD835",
                    imageSource: { uri: imageSource },
                    onClose: onResumeCamera,
                });
                return;
            }

            // Marca check-out
            const participantData = {
                ...existingData,
                checkout: Date.now(),
                registeredBy,
            };

            const eventUpdates = {
                [`cursus/${cursusId}/events/${eventId}/participants/${userId}`]:
                    participantData,
            };

            const campusRef = ref(database, `campus/${campusId}`);
            await update(campusRef, eventUpdates);

            if (userStaffId) {
                // Actualiza a presença temporária para o usuário
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
                title: t('common.success'),
                message: `${displayName}\n${t('events.checkoutSuccessful')}`,
                color: "#4CAF50",
                imageSource: { uri: imageSource },
                onClose: onResumeCamera,
            });
        }
    } catch (e: any) {
        setLoading(false);
        showModal({
            title: t('common.error'),
            message: `${t('events.errorMakingCheck')}: ${e.message}`,
            color: "#E53935",
            imageSource: { uri: imageSource },
            onClose: onResumeCamera,
        });
    }
}
