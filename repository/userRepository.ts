import { database } from "@/firebaseConfig";
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
