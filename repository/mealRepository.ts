import { database } from "@/firebaseConfig";
import { BarcodeResultParams } from "@/utility/QRCodeUtil";
import { get, ref, set, update } from "firebase/database";

// listMealQrCode: array de objetos { id: string }
export async function subscription({
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
    try {
        setLoading(true);

        // Se mealId não for passado, pega o primeiro da lista
        const mealIds = mealId
            ? [mealId]
            : (listMealQrCode || []).map((m) => m.id);

        if (!mealIds.length) {
            setLoading(false);
            showModal({
                title: "Erro!",
                message: "Nenhuma refeição selecionada.",
                color: "#E53935",
                imageSource: { uri: imageSource },
                onClose: onResumeCamera,
            });
            return;
        }

        // Verifica se já assinou a primeira refeição
        const subscriptionsRef = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/meals/${mealIds[0]}/subscriptions/${userId}`
        );
        const snapshot = await get(subscriptionsRef);
        if (snapshot.exists()) {
            setLoading(false);
            showModal({
                title: "Aviso!",
                message: `${displayName}\nVocê já assinou esta refeição.`,
                color: "#FDD835",
                imageSource: { uri: imageSource },
                onClose: onResumeCamera,
            });
            return;
        }

        // Monta updates para todas as refeições
        const updates: Record<string, boolean> = {};
        mealIds.forEach((id) => {
            updates[`cursus/${cursusId}/meals/${id}/subscriptions/${userId}`] =
                true;
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
            title: "Sucesso!",
            message: `${displayName}\nAssinatura realizada com sucesso!`,
            color: "#4CAF50",
            imageSource: { uri: imageSource },
            onClose: onResumeCamera,
        });
    } catch (e: any) {
        setLoading(false);
        showModal({
            title: "Erro!",
            message: `Erro ao assinar refeição: ${e.message}`,
            color: "#E53935",
            imageSource: { uri: imageSource },
            onClose: onResumeCamera,
        });
    }
}
