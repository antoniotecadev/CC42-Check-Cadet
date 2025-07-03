import { database } from "@/firebaseConfig";
import axios from "axios";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { get, ref, remove, set } from "firebase/database";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type ExpoNotificationPayload = {
    title: string;
    body: string;
    data?: Record<string, any>;
    image: string;
};

export async function sendExpoNotificationToGroup(
    campusId: string,
    cursusId: string,
    payload: ExpoNotificationPayload
): Promise<void> {
    // Busca os tokens do Firebase Realtime Database
    const tokens: string[] = await getAllNotificationTokens(campusId, cursusId);

    // Monta as mensagens
    const messages = tokens.map((token) => ({
        to: token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        image: payload.image,
    }));

    // Envia as notificações em lotes de 100 (limite do Expo)
    const batchSize = 100;
    for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        await axios.post(EXPO_PUSH_URL, batch, {
            headers: {
                Accept: "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
        });
    }
}

async function getAllNotificationTokens(
    campusId: string,
    cursusId: string
): Promise<string[]> {
    // Staff tokens
    const staffRef = ref(
        database,
        `campus/${campusId}/tokenIOSNotification/staff`
    );
    const staffSnap = await get(staffRef);
    const staffTokens = staffSnap.exists()
        ? (Object.values(staffSnap.val()) as string[])
        : [];

    // Student tokens
    const studentRef = ref(
        database,
        `campus/${campusId}/tokenIOSNotification/student/cursus/${cursusId}`
    );
    const studentSnap = await get(studentRef);
    const studentTokens = studentSnap.exists()
        ? (Object.values(studentSnap.val()) as string[])
        : [];

    // Junta todos os tokens
    return [...staffTokens, ...studentTokens];
}

export async function registerForPushNotificationsAsync(): Promise<
    string | null
> {
    let token: string | null = null;
    if (Device.isDevice) {
        const { status: existingStatus } =
            await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== "granted") {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== "granted") {
            alert("Failed to get push token for push notification!");
            return null;
        }
        const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId;
        if (!projectId) {
            alert("Project ID not found");
            token = null;
        }
        const expoPushToken = await Notifications.getExpoPushTokenAsync();
        token = expoPushToken.data;
    } else {
        alert("Must use physical device for Push Notifications");
    }
    return token;
}

export async function registerPushToken(
    userId: string,
    isStaff: boolean,
    campusId: string,
    cursusId: string
) {
    const token = await registerForPushNotificationsAsync();
    if (token && userId && campusId && (cursusId || isStaff)) {
        const tokenRef = ref(
            database,
            isStaff
                ? `campus/${campusId}/tokenIOSNotification/staff/${userId}`
                : `campus/${campusId}/tokenIOSNotification/student/cursus/${cursusId}/${userId}`
        );
        try {
            await set(tokenRef, token);
        } catch (e: any) {
            alert(e.message);
        }
    }
}

export async function removePushToken(
  userId: string,
  isStaff: boolean,
  campusId: string,
  cursusId?: string
) {
  const path = isStaff
    ? `campus/${campusId}/tokenIOSNotification/staff/${userId}`
    : `campus/${campusId}/tokenIOSNotification/student/cursus/${cursusId}/${userId}`;
  await remove(ref(database, path));
}