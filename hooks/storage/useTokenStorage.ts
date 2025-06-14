import { fetchApiKeyFromDatabase } from "@/services/firebaseApiKey";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { useCallback } from "react";
import { Platform } from "react-native";
import useAlert from "../useAlert";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const EXPIRATION_KEY = "token_expiration_time";
const API_42_URL = process.env.EXPO_PUBLIC_API_URL;
const API_42_CLIENT_ID = process.env.EXPO_PUBLIC_API_KEY;

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

export default function useTokenStorage() {
    const { showError } = useAlert();
    const saveToken = useCallback(
        async (token: {
            accessToken: string;
            refreshToken: string;
            expiresIn: number; // segundos
        }): Promise<boolean> => {
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
                showError("Erro", "Erro ao salvar token: " + e);
                return false;
            }
        },
        [showError]
    );

    const getAccessToken = useCallback(async () => {
        return await getItem(ACCESS_TOKEN_KEY);
    }, []);

    const getRefreshToken = useCallback(async () => {
        return await getItem(REFRESH_TOKEN_KEY);
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

    async function refreshTokenUser(
        refresh_token: string | null
    ): Promise<boolean> {
        const secret = await fetchApiKeyFromDatabase("intra");
        if (!secret) return false;
        try {
            if (!refresh_token) {
                showError("Erro", "Refresh token não encontrado.");
                return false;
            }

            if (!API_42_URL || !API_42_CLIENT_ID) {
                showError(
                    "Erro",
                    "EXPO_PUBLIC_API_URL ou EXPO_PUBLIC_API_42_CLIENT_ID não está definido."
                );
                return false;
            }

            const response = await axios.post(
                API_42_URL + "/oauth/token",
                new URLSearchParams({
                    grant_type: "refresh_token",
                    refresh_token,
                    client_id: API_42_CLIENT_ID,
                    client_secret: secret,
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            const data = response.data;

            if (!data.access_token) {
                showError("Erro", "Access token não recebido.");
                return false;
            }

            // Armazena os novos tokens
            let sucess: boolean = await saveToken({
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresIn: data.expires_in,
            });
            return sucess;
        } catch (error: any) {
            showError(
                "Erro",
                "Erro ao fazer refresh do token: " + error.message
            );
            return false;
        }
    }

    return {
        saveToken,
        getAccessToken,
        getRefreshToken,
        isTokenExpired,
        clearTokens,
        refreshTokenUser,
    };
}
