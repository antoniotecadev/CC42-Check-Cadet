import { database } from "@/firebaseConfig";
import useAlert from "@/hooks/useAlert";
import { t } from "@/i18n";
import { get, ref } from "firebase/database";

export async function fetchApiKeyFromDatabase(
    source: string,
    isSPlash: boolean = false
): Promise<string | null> {
    const { showError } = useAlert();
    try {
        const dbRef = ref(database, `api_keys/${source}/secret`);
        const snapshot = await get(dbRef);

        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            throw new Error(t('common.apiKeyNotFound'));
        }
    } catch (error: any) {
        if (isSPlash) return null;
        showError(t('common.apiKey'), error.message);
        return null;
    }
}
