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

    useEffect(() => {
        if (!campusId || !cursusId || !typeId) return;
        const reference = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/${type}/${typeId}/${endPoint}`
        );
        const unsubscribe = onValue(reference, (snapshot) => {
            const ids: string[] = [];
            let quantityReceivedUser: number = 0;
            snapshot.forEach((child) => {
                ids.push(child.key!);
                quantityReceivedUser += child.val().quantity || 0;
            });
            setIds(ids);
            setQuantityReceived(quantityReceivedUser);
        });
        return () => unsubscribe();
    }, [campusId, cursusId, typeId]);
    return type === "events" ? { ids } : { ids, quantityReceived };
}
