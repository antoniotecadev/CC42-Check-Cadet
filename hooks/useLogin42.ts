import { Colors } from "@/constants/Colors";
import { makeRedirectUri, revokeAsync } from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Platform } from "react-native";
import useItemStorage from "./storage/useItemStorage";
import useTokenStorage from "./storage/useTokenStorage";
import useAlert from "./useAlert";

import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { auth } from "@/firebaseConfig";
import { registerPushToken } from "@/services/ExpoNotificationService";
import axios from "axios";
import { signInWithCustomToken } from "firebase/auth";
import useUserStorage from "./storage/useUserStorage";

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
const isWeb = Platform.OS === "web";
const redirectUri = isWeb ? makeRedirectUri({}) : "cc42://checkcadet42";

export function useLogin42() {
    const { showError } = useAlert();
    const { saveToken } = useTokenStorage();
    const { setItem } = useItemStorage();
    const { setColor } = useColorCoalition();
    const { saveUser } = useUserStorage();

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const promptAsync = async () => {
        try {
            setLoading(true);
            const authUrl =
                `${AUTH_BASE_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
                    redirectUri
                )}&response_type=code&scope=public` +
                (isWeb ? `&prompt=login` : ``);

            const result = await WebBrowser.openAuthSessionAsync(
                authUrl,
                redirectUri,
                {
                    // ✅ Força sessão privada no iOS
                    preferEphemeralSession: Platform.OS === "ios",
                }
            );

            if (result.type === "success" && result.url) {
                const url = Linking.parse(result.url);
                let code = url.queryParams?.code;
                if (Array.isArray(code)) {
                    code = code[0];
                }
                if (typeof code === "string" && code) {
                    const ok = await loginWithIntra42Code(code, redirectUri);
                    setSuccess(ok);
                    return;
                }
                showError("Erro", "Código de autorização não encontrado.");
            }
        } catch (err: any) {
            console.error("Erro na autenticação:", err);
            showError("Erro na autenticação", err.message);
        } finally {
            setLoading(false);
        }
    };

    async function loginWithIntra42Code(
        code: string,
        redirectUri: string
    ): Promise<boolean> {
        console.log("Trocando código por token... " + redirectUri);
        try {
            const response = await axios.post(
                "https://check-cadet.vercel.app/api/loginWithIntra42Code",
                {
                    code,
                    redirectUri,
                }
            );

            const { firebaseToken, userWithCoalition, tokenResponse } =
                response.data;

            if (!firebaseToken || !userWithCoalition) {
                throw new Error("Resposta incompleta do servidor");
            }

            // 1. Login no Firebase
            await signInWithCustomToken(auth, firebaseToken);

            // 2. Salvar dados localmente
            await saveUser(userWithCoalition);
            await saveToken({
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token || "",
                expiresIn: tokenResponse.expires_in || 0,
            });

            // 3. Outros dados (ex: campus, cor)
            const coalition = userWithCoalition.coalition;
            setColor(coalition?.color?.trim() || Colors.light_blue_900.default);

            const staff: boolean = !!userWithCoalition?.["staff?"];

            if (staff) await setItem("staff", `${staff}`);

            await setItem("user_id", `${userWithCoalition.id}`);
            await setItem(
                "campus_id",
                `${userWithCoalition.campus?.[0]?.id ?? 0}`
            );
            await setItem(
                "campus_name",
                `${userWithCoalition.campus?.[0]?.name?.trim()}`
            );
            await setItem("cursus_id", `${userWithCoalition.projects_users?.[0]?.cursus_ids?.[0] ?? 0}`);
            if (Platform.OS === "ios") {
                registerPushToken(
                    userWithCoalition.id,
                    userWithCoalition["staff?"] as boolean,
                    userWithCoalition?.campus?.[0]?.id,
                    userWithCoalition?.projects_users?.[0]?.cursus_ids?.[0]
                );
            }
            return true;
        } catch (err: any) {
            console.error("Intra 42:", err);
            showError("Intra 42", err.message);
            return false;
        }
    }

    //  TROCA DO code COM access_token no CLIENTE - NÃO É SEGURO, SERVE PAENAS PARA TESTE
    // const handleTokenExchange = async (secret: string, code: string) => {
    //     try {
    //         const tokenResponse = await exchangeCodeAsync(
    //             {
    //                 clientId: CLIENT_ID,
    //                 clientSecret: secret,
    //                 redirectUri,
    //                 code,
    //                 extraParams: { grant_type: "authorization_code" },
    //             },
    //             {
    //                 tokenEndpoint: TOKEN_URL,
    //             }
    //         );

    //         if (!tokenResponse.accessToken) {
    //             throw new Error("Access token não recebido");
    //         }

    //         let ok = await saveToken({
    //             accessToken: tokenResponse.accessToken,
    //             refreshToken: tokenResponse.refreshToken || "",
    //             expiresIn: tokenResponse.expiresIn || 0,
    //         });

    //         if (ok) {
    //             ok = await fetchUser();
    //             if (!ok) {
    //                 clearTokens();
    //                 removeItem("user_id");
    //                 removeItem("campus_id");
    //                 removeItem("campus_name");
    //             }
    //             setSuccess(ok);
    //         } else {
    //             showError("Erro", "Erro ao salvar o token");
    //         }
    //     } catch (err) {
    //         showError("Erro", "Erro ao trocar código por token");
    //     }
    // };

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
