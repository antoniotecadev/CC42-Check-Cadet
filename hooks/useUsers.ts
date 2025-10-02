import { database } from "@/firebaseConfig";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";

export function useUser(
    campusId: string,
    cursusId: string,
    type: string,
    typeId: string,
    endPoint: string
) {
    const [ids, setIds] = useState<string[]>([]);
    const [quantityReceived, setQuantityReceived] = useState<number>(0);
    const [eventParticipants, setEventParticipants] = useState<
        Array<{ id: string; checkout?: string }>
    >([]);

    useEffect(() => {
        if (!campusId || !cursusId || !typeId) return;
        const reference = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/${type}/${typeId}/${endPoint}`
        );
        const unsubscribe = onValue(reference, (snapshot) => {
            if (type === "events") {
                // Para eventos: retorna objetos com id e checkout
                const participants: Array<{ id: string; checkout?: string }> =
                    [];
                snapshot.forEach((child) => {
                    const participantData = child.val();
                    const participant = {
                        id: child.key!,
                        ...(participantData.checkout && {
                            checkout: participantData.checkout,
                        }),
                    };
                    participants.push(participant);
                });
                setEventParticipants(participants);
            } else {
                // Para refeições: mantém lógica original
                const ids: string[] = [];
                let quantityReceivedUser: number = 0;
                snapshot.forEach((child) => {
                    ids.push(child.key!);
                    quantityReceivedUser += child.val().quantity || 0;
                });
                setIds(ids);
                setQuantityReceived(quantityReceivedUser);
            }
        });
        return () => unsubscribe();
    }, [campusId, cursusId, typeId]);

    return type === "events"
        ? { eventParticipants }
        : { ids, quantityReceived };
}
