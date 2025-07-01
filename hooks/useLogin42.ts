import { fetchApiKeyFromDatabase } from "@/services/firebaseApiKey";
import {
    exchangeCodeAsync,
    makeRedirectUri,
    ResponseType,
    revokeAsync,
    useAuthRequest,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import useItemStorage from "./storage/useItemStorage";
import useTokenStorage from "./storage/useTokenStorage";
import useAlert from "./useAlert";
import useFetchUser from "./useFetchUser";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_API_KEY ?? "";

const discovery = {
    authorizationEndpoint: process.env.EXPO_PUBLIC_API_URL + "/oauth/authorize",
    tokenEndpoint: process.env.EXPO_PUBLIC_API_URL + "/oauth/token",
};

export function useLogin42() {
    const { showError } = useAlert();
    const { fetchUser } = useFetchUser();
    const { removeItem } = useItemStorage();
    const { saveToken, clearTokens } = useTokenStorage();
    const isWeb = Platform.OS === "web";
    const isDev = __DEV__;

    const redirectUri = isWeb
        ? makeRedirectUri({
              path: "checkcadet42",
          }) // fixo para funcionar com 42 na web
        : "cc42://checkcadet42"; // para Android/iOS (dev ou produção)

    const [sucess, setSucess] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [request, response, promptAsync] = useAuthRequest(
        {
            clientId: CLIENT_ID,
            redirectUri,
            responseType: ResponseType.Code,
            scopes: ["public"],
        },
        discovery
    );

    useEffect(() => {
        const handleTokenExchange = async (secret: string, code: string) => {
            try {
                const tokenResponse = await exchangeCodeAsync(
                    {
                        clientId: CLIENT_ID,
                        clientSecret: secret,
                        redirectUri,
                        code,
                        extraParams: {
                            grant_type: "authorization_code",
                        },
                    },
                    discovery
                );
                if (!tokenResponse.accessToken) {
                    throw new Error("Access token não recebido");
                }
                let sucess: boolean = await saveToken({
                    accessToken: tokenResponse.accessToken,
                    refreshToken: tokenResponse.refreshToken || "",
                    expiresIn: tokenResponse.expiresIn || 0,
                });
                if (sucess) {
                    sucess = await fetchUser(); // Busca os dados do usuário após salvar o token
                    if (!sucess) {
                        clearTokens(); // Limpa os tokens se falhar ao buscar usuário
                        removeItem("user_id"); // Remove user_id se falhar
                        removeItem("campus_id"); // Remove campus_id se falhar
                        removeItem("campus_name");
                    }
                    setSucess(sucess);
                } else {
                    setSucess(sucess);
                    showError("Erro", "Erro ao salvar o token");
                }
            } catch (err: any) {
                showError("Erro", "Erro ao trocar código por token");
            } finally {
                setLoading(false);
            }
        };

        const getSecret = async () => {
            if (response?.type === "success") {
                setLoading(true);
                const { code } = response.params;
                const secret = await fetchApiKeyFromDatabase("intra");
                if (secret) {
                    handleTokenExchange(secret, code);
                } else setLoading(false);
            }
        };
        getSecret();
    }, [response]);

    return {
        loading,
        request,
        sucess,
        promptAsync, // chama isto no botão ou evento
    };
}

export async function revokeToken(token: string) {
    const clientId = process.env.EXPO_PUBLIC_API_KEY ?? "";
    const clientSecret = "SEU_CLIENT_SECRET"; // se necessário

    // URL de revogação da 42 API
    const revocationEndpoint =
        process.env.EXPO_PUBLIC_API_URL + "/oauth/revoke";
    try {
        const result = await revokeAsync(
            {
                token,
                clientId,
            },
            {
                revocationEndpoint,
            }
        );

        console.log("Token revogado com sucesso:", result);
    } catch (error) {
        console.error("Erro ao revogar o token:", error);
    }
}
