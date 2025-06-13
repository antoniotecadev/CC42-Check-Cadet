import * as SecureStore from "expo-secure-store";
import { useCallback } from "react";
import { Platform } from "react-native";
import useAlert from "./useAlert";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const EXPIRATION_KEY = "token_expiration_time";

function isWeb() {
    return Platform.OS === "web";
}

async function setItem(key: string, value: string) {
    if (isWeb()) {
        localStorage.setItem(key, value);
    } else {
        await SecureStore.setItemAsync(key, value);
    }
}

async function getItem(key: string): Promise<string | null> {
    return isWeb() ? localStorage.getItem(key) : SecureStore.getItemAsync(key);
}

async function removeItem(key: string) {
    if (isWeb()) {
        localStorage.removeItem(key);
    } else {
        await SecureStore.deleteItemAsync(key);
    }
}

export function useAuthToken() {
    const { showError } = useAlert();
    const saveToken = useCallback(
        async (token: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number; // segundos
        }) : Promise<boolean> => {
            try {
                const expirationTime = (
                    Date.now() +
                    token.expiresIn * 1000
                ).toString();
                await Promise.all([
                    setItem(ACCESS_TOKEN_KEY, token.accessToken),
                    setItem(REFRESH_TOKEN_KEY, token.refreshToken),
                    setItem(EXPIRATION_KEY, expirationTime),
                ]);
                return true;
            } catch (e) {
                showError("Token", "Erro ao salvar token: " + e);
                return false;
            }
        },
        []
    );

    const getAccessToken = useCallback(async () => {
        return await getItem(ACCESS_TOKEN_KEY);
    }, []);

    const isTokenExpired = useCallback(async () => {
        const exp = await getItem(EXPIRATION_KEY);
        if (!exp) return true;
        return Date.now() > parseInt(exp, 10);
    }, []);

    const clearTokens = useCallback(async () => {
        await Promise.all([
            removeItem(ACCESS_TOKEN_KEY),
            removeItem(REFRESH_TOKEN_KEY),
            removeItem(EXPIRATION_KEY),
        ]);
    }, []);

    return {
        saveToken,
        getAccessToken,
        isTokenExpired,
        clearTokens,
    };
}
