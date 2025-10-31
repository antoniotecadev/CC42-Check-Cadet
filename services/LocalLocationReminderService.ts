/**
 * 📍 LOCAL LOCATION REMINDER SERVICE
 * 
 * Serviço para agendar notificações locais que lembram o estudante
 * de actualizar sua localização a cada 2 horas durante horário de campus.
 * 
 * Características:
 * - Notificações locais (não usa internet)
 * - Horário: 8h às 20h
 * - Intervalo: A cada 2 horas
 * - Silencioso (sem som)
 * - Não drena bateria
 */

import { t } from "@/i18n";
import * as Notifications from "expo-notifications";

/**
 * Horários para enviar lembretes (8h às 20h, a cada 2 horas)
 */
const REMINDER_HOURS = [8, 10, 12, 14, 16, 18, 20];

/**
 * Identificador único para notificações de localização
 */
const LOCATION_REMINDER_ID_PREFIX = "location-reminder-";

/**
 * Agenda notificações locais diárias para lembrar de actualizar localização
 * 
 * @returns Promise<void>
 */
export async function scheduleLocationReminders(): Promise<void> {
    try {
        // Verifica permissões
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
            console.log("⚠️ Permissões de notificação não concedidas");
            return;
        }

        // Cancela notificações antigas de localização
        await cancelLocationReminders();

        // Agenda notificações para cada horário
        for (const hour of REMINDER_HOURS) {
            const identifier = await Notifications.scheduleNotificationAsync({
                content: {
                    title: t("location.reminderTitle"),
                    body: t("location.reminderBody"),
                    data: {
                        type: "location_reminder",
                        hour: hour,
                    },
                    sound: false, // Silencioso
                    priority: Notifications.AndroidNotificationPriority.DEFAULT,
                },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
                hour: hour,
                minute: 0,
                repeats: true, // Repete diariamente
            },
        });

        console.log(
            `✅ Lembrete agendado para ${hour}:00 (ID: ${identifier})`
        );
    }        console.log(
            `🎉 ${REMINDER_HOURS.length} lembretes de localização agendados com sucesso!`
        );
    } catch (error) {
        console.error("❌ Erro ao agendar lembretes de localização:", error);
    }
}

/**
 * Cancela todos os lembretes de localização agendados
 * 
 * @returns Promise<void>
 */
export async function cancelLocationReminders(): Promise<void> {
    try {
        // Busca todas as notificações agendadas
        const scheduledNotifications =
            await Notifications.getAllScheduledNotificationsAsync();

        // Filtra notificações de localização
        const locationReminders = scheduledNotifications.filter(
            (notification) =>
                notification.content.data?.type === "location_reminder"
        );

        // Cancela cada uma
        for (const notification of locationReminders) {
            await Notifications.cancelScheduledNotificationAsync(
                notification.identifier
            );
        }

        console.log(
            `🗑️ ${locationReminders.length} lembretes de localização cancelados`
        );
    } catch (error) {
        console.error("❌ Erro ao cancelar lembretes:", error);
    }
}

/**
 * Verifica se lembretes estão agendados
 * 
 * @returns Promise<boolean>
 */
export async function areRemindersScheduled(): Promise<boolean> {
    try {
        const scheduledNotifications =
            await Notifications.getAllScheduledNotificationsAsync();

        const locationReminders = scheduledNotifications.filter(
            (notification) =>
                notification.content.data?.type === "location_reminder"
        );

        return locationReminders.length > 0;
    } catch (error) {
        console.error("❌ Erro ao verificar lembretes:", error);
        return false;
    }
}

/**
 * Obtém contagem de lembretes agendados
 * 
 * @returns Promise<number>
 */
export async function getRemindersCount(): Promise<number> {
    try {
        const scheduledNotifications =
            await Notifications.getAllScheduledNotificationsAsync();

        const locationReminders = scheduledNotifications.filter(
            (notification) =>
                notification.content.data?.type === "location_reminder"
        );

        return locationReminders.length;
    } catch (error) {
        console.error("❌ Erro ao contar lembretes:", error);
        return 0;
    }
}

/**
 * Agenda um lembrete único (one-time) após X horas
 * Útil para lembrar após uma actualização de localização
 * 
 * @param hoursFromNow - Quantas horas a partir de agora
 * @returns Promise<string> - ID da notificação agendada
 */
export async function scheduleOneTimeReminder(
    hoursFromNow: number = 2
): Promise<string | null> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
            return null;
        }

        const identifier = await Notifications.scheduleNotificationAsync({
            content: {
                title: t("location.reminderOneTimeTitle"),
                body: t("location.reminderOneTimeBody", { hours: hoursFromNow }),
                data: {
                    type: "location_reminder_onetime",
                },
                sound: false,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: hoursFromNow * 60 * 60, // Converte horas para segundos
            },
        });

        console.log(
            `⏰ Lembrete único agendado para daqui ${hoursFromNow}h (ID: ${identifier})`
        );
        return identifier;
    } catch (error) {
        console.error("❌ Erro ao agendar lembrete único:", error);
        return null;
    }
}

/**
 * Reschedule - útil após reinstalar app ou actualização
 * 
 * @returns Promise<void>
 */
export async function rescheduleIfNeeded(): Promise<void> {
    const isScheduled = await areRemindersScheduled();
    
    if (!isScheduled) {
        console.log("🔄 Reagendando lembretes de localização...");
        await scheduleLocationReminders();
    } else {
        const count = await getRemindersCount();
        console.log(`✅ ${count} lembretes já estão agendados`);
    }
}
