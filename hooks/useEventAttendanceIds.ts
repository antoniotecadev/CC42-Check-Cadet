import { database } from "@/firebaseConfig";
import { onValue, ref } from "firebase/database";
import { useEffect, useState } from "react";

export function useEventAttendanceIds(
    campusId?: string,
    cursusId?: string,
    eventId?: string
) {
    const [attendanceIds, setAttendanceIds] = useState<string[]>([]);
    useEffect(() => {
        if (!campusId || !cursusId || !eventId) return;
        const participantsRef = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/events/${eventId}/participants`
        );
        const unsubscribe = onValue(participantsRef, (snapshot) => {
            const ids: string[] = [];
            snapshot.forEach((child) => {
                ids.push(child.key!);
            });
            setAttendanceIds(ids);
        });
        return () => unsubscribe();
    }, [campusId, cursusId, eventId]);
    return attendanceIds;
}
