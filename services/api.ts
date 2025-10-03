import useTokenStorage from "@/hooks/storage/useTokenStorage";
import { t } from "@/i18n";
import { fetchApiKeyFromDatabase } from "@/services/firebaseApiKey";
import axios from "axios";
import { router } from "expo-router";
import { Platform } from "react-native";

export default function useApiInterceptors() {
    const { getAccessToken, getRefreshToken, saveToken, clearTokens } =
        useTokenStorage();

    const isWeb = Platform.OS === "web";
    const baseURL = isWeb
        ? "https://check-cadet.vercel.app/api/42-proxy"
        : process.env.EXPO_PUBLIC_API_URL;

    const api = axios.create({
        baseURL,
    });

    // Interceptor to automatically add token
    api.interceptors.request.use(async (config) => {
        const token = await getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Handle web proxy URL construction
        if (isWeb && config.url) {
            // Extract path and query parameters
            const [path, queryString] = config.url.split('?');
            
            // Create new URL with path parameter and preserve other parameters
            const proxyUrl = new URL(config.baseURL!);
            proxyUrl.searchParams.set('path', path);
            
            // Add original query parameters if they exist
            if (queryString) {
                const originalParams = new URLSearchParams(queryString);
                originalParams.forEach((value, key) => {
                    proxyUrl.searchParams.set(key, value);
                });
            }
            
            config.url = proxyUrl.toString();
            config.baseURL = ''; // Clear baseURL to use full URL
        }
        
        return config;
    });

    // Controls a single refresh attempt at a time
    let isRefreshing = false;
    let failedQueue: any[] = [];

    const processQueue = (error: any, token: string | null = null) => {
        failedQueue.forEach((prom) => {
            if (error) prom.reject(error);
            else prom.resolve(token);
        });
        failedQueue = [];
    };

    // Response interceptor
    api.interceptors.response.use(
        (response) => response,
        async (error) => {
            const originalRequest = error.config;

            // If already tried and failed, don't try again
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    });
                }

                isRefreshing = true;
                try {
                    const rfToken = await getRefreshToken();
                    if (!rfToken) throw new Error(t('auth.refreshTokenNotFound'));

                    const clientSecret = await fetchApiKeyFromDatabase("intra");
                    if (!clientSecret) throw new Error(t('auth.clientSecretMissing'));

                    const res = await axios.post(
                        process.env.EXPO_PUBLIC_API_URL + "/oauth/token",
                        new URLSearchParams({
                            grant_type: "refresh_token",
                            refresh_token: rfToken,
                            client_id: process.env.EXPO_PUBLIC_API_KEY ?? "",
                            client_secret: clientSecret,
                        }),
                        {
                            headers: {
                                "Content-Type":
                                    "application/x-www-form-urlencoded",
                            },
                        }
                    );

                    const accessToken = res.data.access_token;
                    const refreshToken = res.data.refresh_token;
                    const expiresIn = res.data.expires_in;

                    await saveToken({ accessToken, refreshToken, expiresIn });
                    processQueue(null, accessToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                } catch (err) {
                    processQueue(err, null);
                    await clearTokens();
                    // Redirect to login if desired
                    router.replace("/login");
                    return Promise.reject(err);
                } finally {
                    isRefreshing = false;
                }
            }

            return Promise.reject(error);
        }
    );
    return { api };
}
