import axios from "axios";
import { tokenStorage } from "./storage/tokenStorage";
import { saveUser } from "./storage/userStorage";
import useAlert from "./useAlert";

const { showError } = useAlert();
const { getAccessToken } = tokenStorage();

export const fetchUser = async (): Promise<boolean> => {
    try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
            showError("Erro", "Token não encontrado");
            return false;
        }

        // 1. Buscar usuário
        const userResponse = await axios.get("https://api.intra.42.fr/v2/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        const userData = userResponse.data;

        // 2. Buscar coalizão
        const coalitionResponse = await axios.get(
            `https://api.intra.42.fr/v2/users/${userData.id}/coalitions`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        const coalitions = coalitionResponse.data;
        const coalition =
            coalitions && coalitions.length > 0 ? coalitions[0] : null;

        // 3. Juntar os dados
        const userWithCoalition = {
            ...userData,
            coalition,
        };

        // 4. Salvar localmente
        await saveUser(userWithCoalition);
        return true;
    } catch (e) {
        showError("Erro", "Erro ao buscar dados do usuário: " + e);
        return false;
    }
};
