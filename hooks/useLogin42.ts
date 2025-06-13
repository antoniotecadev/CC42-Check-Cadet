import {
    exchangeCodeAsync,
    makeRedirectUri,
    ResponseType,
    useAuthRequest,
} from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID =
    "u-s4t2ud-4ce9a69013fc7817425995ce488c2f0e9d4c968de61e0f7e51f4d5facc50cc27";
const CLIENT_SECRET = "TEU_CLIENT_SECRET";

const discovery = {
    authorizationEndpoint: "https://api.intra.42.fr/oauth/authorize",
    tokenEndpoint: "https://api.intra.42.fr/oauth/token",
};

export function useLogin42() {
    const isWeb = Platform.OS === "web";
    const isDev = __DEV__;

    const redirectUri = isWeb
        ? makeRedirectUri({
              path: "checkcadet42", // Deploy na expo vai usar: https://cc42--d769no9a5g.expo.app/--/checkcadet42
          }) // fixo para funcionar com 42 na web
        : "cc42://checkcadet42"; // para Android/iOS (dev ou produção)

    const [token, setToken] = useState<string | null>(null);
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
        const handleTokenExchange = async () => {
            if (response?.type === "success") {
                const { code } = response.params;
                alert("code:" + code);

                try {
                    const tokenResponse = await exchangeCodeAsync(
                        {
                            clientId: CLIENT_ID,
                            clientSecret: CLIENT_SECRET,
                            redirectUri,
                            code,
                            extraParams: {
                                grant_type: "authorization_code",
                            },
                        },
                        discovery
                    );

                    setToken(tokenResponse.accessToken);
                } catch (err) {
                    console.error("Erro ao trocar código por token:", err);
                }
            }
        };

        handleTokenExchange();
    }, [response]);

    return {
        request,
        token,
        promptAsync, // chama isto no botão ou evento
    };
}
