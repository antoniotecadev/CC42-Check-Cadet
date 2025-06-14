import { fetchApiKeyFromDatabase } from "@/services/firebaseApiKey";
import {
    exchangeCodeAsync,
    makeRedirectUri,
    ResponseType,
    useAuthRequest,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useTokenStorage } from "./storage/useTokenStorage";
import useAlert from "./useAlert";
import useFetchUser from "./useFetchUser";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID =
    "u-s4t2ud-4ce9a69013fc7817425995ce488c2f0e9d4c968de61e0f7e51f4d5facc50cc27";

const discovery = {
    authorizationEndpoint: "https://api.intra.42.fr/oauth/authorize",
    tokenEndpoint: "https://api.intra.42.fr/oauth/token",
};

export function useLogin42() {
    const { showError } = useAlert();
    const { fetchUser } = useFetchUser();
    const { saveToken, clearTokens } = useTokenStorage();
    const isWeb = Platform.OS === "web";
    const isDev = __DEV__;

    const redirectUri = isWeb
        ? makeRedirectUri({
              path: "checkcadet42", // Deploy na expo vai usar: https://cc42--d769no9a5g.expo.app/--/checkcadet42
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
                    }
                    setSucess(sucess);
                } else {
                    setSucess(sucess);
                    showError("Erro", "Erro ao salvar o token");
                }
            } catch (err: any) {
                showError("Erro", "Erro ao trocar código por token: " + err);
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
