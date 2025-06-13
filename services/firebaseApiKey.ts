import { database } from "@/firebaseConfig";
import useAlert from "@/hooks/useAlert";
import { get, ref } from "firebase/database";

export async function fetchApiKeyFromDatabase(
    source: string
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
        showError("Firebase", "Erro ao buscar chave da API: " + error);
        return null;
    }
}
