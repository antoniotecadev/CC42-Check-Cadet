import {
    LocalNotificationOptions,
    requestNotificationPermission,
    showLocalNotification,
} from "@/services/LocalNotificationService";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

/**
 * Hook para gerenciar notificações locais no navegador
 */
export function useLocalNotification() {
    const [hasPermission, setHasPermission] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if (Platform.OS === "web" && "Notification" in window) {
            setIsSupported(true);
            setHasPermission(Notification.permission === "granted");
        }
    }, []);

    /**
     * Solicita permissão para notificações
     */
    const requestPermission = useCallback(async (): Promise<boolean> => {
        const granted = await requestNotificationPermission();
        setHasPermission(granted);
        return granted;
    }, []);

    /**
     * Exibe uma notificação
     */
    const notify = useCallback(async (
        options: LocalNotificationOptions
    ): Promise<boolean> => {
        // Se não tem permissão, solicita
        if (!hasPermission) {
            const granted = await requestPermission();
            if (!granted) return false;
        }
        return await showLocalNotification(options);
    }, [hasPermission, requestPermission]);

    /**
     * Notificação de sucesso (verde)
     */
    const notifySuccess = useCallback(async (title: string, body: string) => {
        return notify({
            title: `✅ ${title}`,
            body,
            tag: "success",
        });
    }, [notify]);

    /**
     * Notificação de erro (vermelho)
     */
    const notifyError = useCallback(async (title: string, body: string) => {
        return notify({
            title: `❌ ${title}`,
            body,
            tag: "error",
        });
    }, [notify]);

    /**
     * Notificação de info (azul)
     */
    const notifyInfo = useCallback(async (title: string, body: string) => {
        return notify({
            title: `ℹ️ ${title}`,
            body,
            tag: "info",
        });
    }, [notify]);

    /**
     * Notificação de aviso (amarelo)
     */
    const notifyWarning = useCallback(async (title: string, body: string) => {
        return notify({
            title: `⚠️ ${title}`,
            body,
            tag: "warning",
        });
    }, [notify]);

    return {
        notify,
        notifySuccess,
        notifyError,
        notifyInfo,
        notifyWarning,
        requestPermission,
        hasPermission,
        isSupported,
    };
}
