import { database } from "@/firebaseConfig";
import useAlert from "@/hooks/useAlert";
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
            throw new Error("Chave da API não encontrada");
        }
    } catch (error: any) {
        if (isSPlash) return null;
        showError("Chave de API", error.message);
        return null;
    }
}
