import { Colors } from "@/constants/Colors";
import { makeRedirectUri, revokeAsync } from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";
import { Platform } from "react-native";
import { t } from "../i18n";
import useItemStorage from "./storage/useItemStorage";
import useTokenStorage from "./storage/useTokenStorage";
import useAlert from "./useAlert";

import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { auth } from "@/firebaseConfig";
import { registerPushToken } from "@/services/ExpoNotificationService";
import axios from "axios";
import { signInWithCustomToken } from "firebase/auth";
import useUserStorage from "./storage/useUserStorage";

/* OPTIONAL - IF YOU DON'T NEED TO OPEN THE POP UP WINDOW IN ANONYMOUS MODE
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
        : "cc42://checkcadet42"; // for Android/iOS (dev or production)

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
                    throw new Error(t('auth.accessTokenNotReceived'));
                }
                let sucess: boolean = await saveToken({
                    accessToken: tokenResponse.accessToken,
                    refreshToken: tokenResponse.refreshToken || "",
                    expiresIn: tokenResponse.expiresIn || 0,
                });
                if (sucess) {
                    sucess = await fetchUser(); // Fetch user data after saving token
                    if (!sucess) {
                        clearTokens(); // Clear tokens if user fetch fails
                        removeItem("user_id"); // Remove user_id if failed
                        removeItem("campus_id"); // Remove campus_id if failed
                        removeItem("campus_name");
                    }
                    setSucess(sucess);
                } else {
                    setSucess(sucess);
                    showError(t('common.error'), t('auth.errorSavingToken'));
                }
            } catch (err: any) {
                showError(t('common.error'), t('auth.errorExchangingCodeForToken'));
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
        promptAsync, // call this on button or event
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
                    // ✅ Force private session on iOS
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
                showError(
                    t("common.error"),
                    t("auth.authorizationCodeNotFound")
                );
            }
        } catch (err: any) {
            console.error("Authentication error:", err);
            showError(t("auth.authenticationError"), err.message);
        } finally {
            setLoading(false);
        }
    };

    async function loginWithIntra42Code(
        code: string,
        redirectUri: string
    ): Promise<boolean> {
        console.log("Exchanging code for token... " + redirectUri);
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
                throw new Error(t("auth.incompleteServerResponse"));
            }

            // 1. Firebase login
            await signInWithCustomToken(auth, firebaseToken);

            // 2. Save data locally
            await saveUser(userWithCoalition);
            await saveToken({
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token || "",
                expiresIn: tokenResponse.expires_in || 0,
            });

            // 3. Other data (e.g.: campus, color)
            const coalition = userWithCoalition.coalition;
            setColor(coalition?.color?.trim() || Colors.light_blue_900.default);

            const staff: boolean = !!userWithCoalition?.["staff?"];

            if (staff) await setItem("staff", `${staff}`);

            await setItem("user_id", `${userWithCoalition.id}`);
            await setItem("user_login", `${userWithCoalition.login}`);
            await setItem(
                "displayname",
                `${userWithCoalition.displayname?.trim()}`
            );
            await setItem(
                "image_link",
                `${userWithCoalition.image?.link?.trim()}`
            );
            await setItem(
                "campus_id",
                `${userWithCoalition.campus?.[0]?.id ?? 0}`
            );
            await setItem(
                "campus_name",
                `${userWithCoalition.campus?.[0]?.name?.trim()}`
            );
            await setItem(
                "cursus_id",
                `${userWithCoalition.projects_users?.[0]?.cursus_ids?.[0] ?? 0}`
            );
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

    //  CODE EXCHANGE WITH access_token ON CLIENT - NOT SECURE, ONLY FOR TESTING
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
        promptAsync, // call this on login button
    };
}

export async function revokeToken(token: string) {
    const clientId = process.env.EXPO_PUBLIC_API_KEY ?? "";
    const clientSecret = "YOUR_CLIENT_SECRET"; // if necessary

    // 42 API revocation URL
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
