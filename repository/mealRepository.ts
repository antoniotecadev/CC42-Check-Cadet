import { database } from "@/firebaseConfig";
import { t } from "@/i18n";
import { BarcodeResultParams } from "@/utility/QRCodeUtil";
import {
    DataSnapshot,
    get,
    onValue,
    ref,
    runTransaction,
    set,
    update,
} from "firebase/database";
import { Alert, Platform } from "react-native";

// listMealQrCode: array de objetos { id: string }
export async function subscription({
    mealQuantity,
    mealPortion,
    mealId,
    listMealQrCode,
    userStaffId,
    registeredBy,
    userId,
    displayName,
    cursusId,
    campusId,
    imageSource,
    setLoading,
    showModal,
    onResumeCamera,
}: BarcodeResultParams) {
    const uid = mealPortion === "second" ? `-${userId}` : userId;

    try {
        setLoading(true);

        // If mealId is not passed, get the first from the list
        const mealIds = mealId
            ? [mealId]
            : (listMealQrCode || []).map((m) => m.id);

        if (!mealIds.length) {
            setLoading(false);
            showModal({
                title: t('common.error'),
                message: t('meals.noMealSelected'),
                color: "#E53935",
                imageSource: { uri: imageSource },
                onClose: onResumeCamera,
            });
            return;
        }

        // Check if already signed up for the first meal
        const subscriptionsRef = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/meals/${mealIds[0]}/subscriptions/${uid}`
        );
        const snapshot = await get(subscriptionsRef);
        if (snapshot.exists()) {
            const isAlreadyReceived: boolean = Boolean(
                snapshot.child("status").val()
            );
            if (isAlreadyReceived) {
                setLoading(false);
                showModal({
                    title: t('common.warning'),
                    message: `${displayName}\n${t('meals.alreadySubscribed')} ${
                        mealPortion === "first" ? t('meals.firstPortion') : t('meals.secondPortion')
                    }.`,
                    color: "#FDD835",
                    imageSource: { uri: imageSource },
                    onClose: onResumeCamera,
                });
                return;
            }
        } else if (mealPortion === "second") {
            setLoading(false);
            showModal({
                title: t('common.warning'),
                message: `${displayName}\n${t('meals.notSubscribedSecondPortion')}`,
                color: "#FDD835",
                imageSource: { uri: imageSource },
                onClose: onResumeCamera,
            });
            return;
        }

        // Build updates for all meals
        const updates: Record<string, any> = {};
        const updatesStatus: Record<string, any> = {
            status: true,
            quantity: mealQuantity,
            createdBy: registeredBy,
        };

        mealIds.forEach((id) => {
            updates[`cursus/${cursusId}/meals/${id}/subscriptions/${uid}`] =
                updatesStatus;
        });

        const campusRef = ref(database, `campus/${campusId}`);
        await update(campusRef, updates);

        if (userStaffId) {
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
            message: `${displayName}\n${t('meals.subscriptionSuccessful')}`,
            color: "#4CAF50",
            imageSource: { uri: imageSource },
            onClose: onResumeCamera,
        });
    } catch (e: any) {
        setLoading(false);
        showModal({
            title: t('common.error'),
            message: `${t('meals.errorSigningMeal')}: ${e.message}`,
            color: "#E53935",
            imageSource: { uri: imageSource },
            onClose: onResumeCamera,
        });
    }
}

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
                t('common.error'),
                t('meals.errorCheckingSecondPortionSubscription') + e
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
                t('common.error'),
                t('meals.errorDeactivatingSecondPortionListener') + e
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
                message.push(t('meals.secondPortionNotAvailable'));
                return;
            }

            // if already subscribed
            if (subscriptions[`-${currentUserId}`]?.status != null) {
                message.push(t('meals.alreadySubscribedSecondPortion'));
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
                message.push(t('meals.secondPortionNotAvailable'));
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
