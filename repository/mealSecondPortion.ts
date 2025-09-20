import { database } from "@/firebaseConfig";
import {
    DataSnapshot,
    get,
    onValue,
    ref,
    runTransaction,
} from "firebase/database";
import { Alert, Platform } from "react-native";

type SecondPortionListener = (
    data: {
        enabled: boolean;
        subscribed: boolean;
        received: boolean;
        quantity?: number | null;
    } | null
) => void;

const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
        alert(message);
    } else {
        Alert.alert(title, message);
    }
};

export function observeSecondPortion(
    campusId: string,
    cursusId: string,
    mealId: string,
    userId: string,
    cb: SecondPortionListener
) {
    const listener = async (snap: DataSnapshot) => {
        if (!snap.exists()) {
            cb(null);
            return;
        }

        const hasSecondPortion = snap.child("hasSecondPortion").val() as
            | boolean
            | null;
        const quantitySecondPortion = snap
            .child("quantitySecondPortion")
            .val() as number | null;

        const subscriptionsRef = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/meals/${mealId}/subscriptions/-${userId}`
        );

        try {
            const snap = await get(subscriptionsRef);
            const subscribed = snap.exists();
            const received = subscribed && Boolean(snap.child("status").val());

            cb({
                enabled:
                    Boolean(hasSecondPortion) &&
                    !!quantitySecondPortion &&
                    quantitySecondPortion > 0,
                subscribed,
                received,
                quantity: quantitySecondPortion ?? null,
            });
        } catch (e) {
            cb({
                enabled:
                    Boolean(hasSecondPortion) &&
                    !!quantitySecondPortion &&
                    quantitySecondPortion > 0,
                subscribed: false,
                received: false,
                quantity: null,
            });
            showAlert(
                "Erro",
                "Erro ao verificar inscrição na segunda via: " + e
            );
        }
    };

    // Attach listener to secondPortion node (keeps parity with Android approach)
    const secondPortionRef = ref(
        database,
        `campus/${campusId}/cursus/${cursusId}/meals/${mealId}/secondPortion`
    );
    const off = onValue(secondPortionRef, listener as any);

    return () => {
        try {
            // onValue returns an unsubscribe function, so call it
            (off as unknown as () => void)();
        } catch (e) {
            // fallback: detach by ref
            // firebase v9 doesn't expose off by ref; using onValue return is correct
            showAlert(
                "Erro",
                "Erro ao desactivar listener da segunda via: " + e
            );
        }
    };
}

export async function subscribeSecondPortion(
    campusId: string,
    cursusId: string,
    mealId: string,
    currentUserId: string
): Promise<{ success: boolean; message?: string }> {
    const mealRef = ref(
        database,
        `campus/${campusId}/cursus/${cursusId}/meals/${mealId}`
    );

    let message: string[] = [];

    try {
        const res = await runTransaction(mealRef, (mutableData) => {
            if (mutableData == null) {
                return {
                    secondPortion: {
                        hasSecondPortion: false,
                        quantitySecondPortion: 0,
                    },
                    subscriptions: {},
                };
            }

            const second = (mutableData as any).secondPortion;
            const subscriptions = (mutableData as any).subscriptions || {};

            const hasSecondPortion = second?.hasSecondPortion;
            const quantitySecondPortion = second?.quantitySecondPortion;

            if (hasSecondPortion == null || quantitySecondPortion == null) {
                message.push("Segunda via não disponível");
                return;
            }

            // if already subscribed
            if (subscriptions[`-${currentUserId}`]?.status != null) {
                message.push("Já está inscrito na segunda via");
                return;
            }

            if (hasSecondPortion && quantitySecondPortion > 0) {
                const newQuantity = quantitySecondPortion - 1;
                // mutate currentData to reflect new values
                (mutableData as any).secondPortion = {
                    ...second,
                    quantitySecondPortion: newQuantity,
                    hasSecondPortion:
                        newQuantity === 0 ? false : second.hasSecondPortion,
                };

                (mutableData as any).subscriptions = {
                    ...subscriptions,
                    [`-${currentUserId}`]: { status: false, quantity: 0 },
                };

                return mutableData;
            } else {
                message.push("Segunda via não disponível");
                return;
            }
        });

        // runTransaction resolves with a snapshot that includes committed flag
        if ((res as any)?.committed) {
            return { success: true };
        }

        return {
            success: false,
            message:
                message.length > 0 ? message[0] : "Transaction not committed",
        };
    } catch (e: any) {
        return { success: false, message: e?.message ?? String(e) };
    }
}
