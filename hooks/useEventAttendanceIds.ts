import { database } from "@/firebaseConfig";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";

export function useIds(
    campusId: string,
    cursusId: string,
    type: string,
    typeId: string,
    endPoint: string
) {
    const [ids, setIds] = useState<string[]>([]);
    useEffect(() => {
        if (!campusId || !cursusId || !typeId) return;
        const reference = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/${type}/${typeId}/${endPoint}`
        );
        const unsubscribe = onValue(reference, (snapshot) => {
            const ids: string[] = [];
            snapshot.forEach((child) => {
                ids.push(child.key!);
            });
            setIds(ids);
        });
        return () => unsubscribe();
    }, [campusId, cursusId, typeId]);
    return ids;
}
