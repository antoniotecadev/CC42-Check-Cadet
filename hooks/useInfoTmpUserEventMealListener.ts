import { off, onValue, ref } from "firebase/database";
import { useEffect, useRef } from "react";
import { database } from "../firebaseConfig"; // ajuste o caminho conforme seu projeto

export interface UseInfoTmpUserEventMealListenerProps {
    campusId: string;
    cursusId: string;
    userStaffId: string;
    isEvent: boolean;
    showModal: (options: {
        title: string;
        message: string;
        color: string;
        imageSource?: { uri: string };
    }) => void;
}

export function useInfoTmpUserEventMealListener({
    campusId,
    cursusId,
    userStaffId,
    isEvent,
    showModal,
}: UseInfoTmpUserEventMealListenerProps) {
    const firstReader = useRef(true);

    useEffect(() => {
        if (!campusId || !cursusId || !userStaffId) return;
        const dbRef = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/infoTmpUserEventMeal/${userStaffId}`
        );

        const unsubscribe = onValue(
            dbRef,
            (snapshot) => {
                if (firstReader.current) {
                    firstReader.current = false;
                    return;
                }
                if (snapshot.exists()) {
                    const displayName = snapshot.child("displayName").val();
                    const urlImageUser = snapshot.child("urlImageUser").val();
                    const message =
                        displayName +
                        "\n" +
                        (isEvent
                            ? "Presença marcada com sucesso!"
                            : "Assinatura realizada com sucesso!");
                    showModal({
                        title: "Sucesso",
                        message,
                        color: "#4CAF50",
                        imageSource: urlImageUser
                            ? { uri: urlImageUser }
                            : undefined,
                    });
                }
            },
            (error) => {
                showModal({
                    title: "Erro",
                    message: error.message,
                    color: "#E53935",
                });
            }
        );

        // Cleanup: remove listener ao desmontar
        return () => {
            off(dbRef, "value", unsubscribe);
        };
    }, [isEvent]);
}

export default useInfoTmpUserEventMealListener;
