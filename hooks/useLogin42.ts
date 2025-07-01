import { fetchApiKeyFromDatabase } from "@/services/firebaseApiKey";
import {
    exchangeCodeAsync,
    makeRedirectUri,
    revokeAsync
} from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Platform } from "react-native";
import useItemStorage from "./storage/useItemStorage";
import useTokenStorage from "./storage/useTokenStorage";
import useAlert from "./useAlert";
import useFetchUser from "./useFetchUser";

/* OPTIONAL - CASO NÃO PRECISE ABRIR A JANELA POP UP NO MODO ANONIMO
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
}*/

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_API_KEY ?? "";
const AUTH_BASE_URL = process.env.EXPO_PUBLIC_API_URL + "/oauth/authorize";
const TOKEN_URL = process.env.EXPO_PUBLIC_API_URL + "/oauth/token";

const redirectUri =
    Platform.OS === "web"
        ? makeRedirectUri({ path: "checkcadet42" })
        : "cc42://checkcadet42";

export function useLogin42() {
    const { showError } = useAlert();
    const { fetchUser } = useFetchUser();
    const { removeItem } = useItemStorage();
    const { saveToken, clearTokens } = useTokenStorage();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const promptAsync = async () => {
        try {
            setLoading(true);
            const authUrl = `${AUTH_BASE_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
                redirectUri
            )}&response_type=code&scope=public`;

            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                redirectUri,
                {
                    // ✅ Força sessão privada no iOS
                    preferEphemeralSession: true,
                }
            );

            if (result.type === "success" && result.url) {
                const url = Linking.parse(result.url);
                let code = url.queryParams?.code;
                if (Array.isArray(code)) {
                    code = code[0];
                }
                if (typeof code === "string" && code) {
                    const secret = await fetchApiKeyFromDatabase("intra");
                    if (secret) {
                        await handleTokenExchange(secret, code);
                        return;
                    }
                }
                showError("Erro", "Código de autorização não encontrado.");
            }
        } catch (err) {
            showError("Erro", "Erro na autenticação.");
        } finally {
            setLoading(false);
        }
    };

    const handleTokenExchange = async (secret: string, code: string) => {
        try {
            const tokenResponse = await exchangeCodeAsync(
                {
                    clientId: CLIENT_ID,
                    clientSecret: secret,
                    redirectUri,
                    code,
                    extraParams: { grant_type: "authorization_code" },
                },
                {
                    tokenEndpoint: TOKEN_URL,
                }
            );

            if (!tokenResponse.accessToken) {
                throw new Error("Access token não recebido");
            }

            let ok = await saveToken({
                accessToken: tokenResponse.accessToken,
                refreshToken: tokenResponse.refreshToken || "",
                expiresIn: tokenResponse.expiresIn || 0,
            });

            if (ok) {
                ok = await fetchUser();
                if (!ok) {
                    clearTokens();
                    removeItem("user_id");
                    removeItem("campus_id");
                    removeItem("campus_name");
                }
                setSuccess(ok);
            } else {
                showError("Erro", "Erro ao salvar o token");
            }
        } catch (err) {
            showError("Erro", "Erro ao trocar código por token");
        }
    };

    return {
        loading,
        success,
        promptAsync, // chame isso no botão de login
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
