import { showAlert } from "@/hooks/useAlert";
import { t } from "@/i18n";
import { NotificationPayload } from "@/model/Notification";
import axios from "axios";
import { sendExpoNotificationToGroup } from "./ExpoNotificationService";

class Notification {
    title: string;
    body: string;
    image: string;

    constructor(title: string, body: string, image: string) {
        this.title = title;
        this.body = body;
        this.image = image;
    }
}

// Equivalente a FCMessage.Data no Java
interface NotificationData {
    title: string;
    body: string;
    image: string;
}

class Data {
    key0: string;
    key1: string;
    key2: string;
    key3: string;
    key4: string;
    key5: string;
    key6: string;
    title: string;
    body: string;
    image: string;

    constructor(
        key0: string | number,
        key1: string | number,
        key2: string | number,
        key3: string | number,
        key4: string | number,
        key5: string | number,
        key6: string | number,
        notification: NotificationData
    ) {
        this.key0 = String(key0);
        this.key1 = String(key1);
        this.key2 = String(key2);
        this.key3 = String(key3);
        this.key4 = String(key4);
        this.key5 = String(key5);
        this.key6 = String(key6);
        this.title = notification.title;
        this.body = notification.body;
        this.image = notification.image;
    }
}

class Message {
    notification: Notification;
    data: Data;
    topic?: string;
    condition?: string;

    constructor(
        topic?: string,
        condition?: string,
        notification?: Notification,
        data?: Data
    ) {
        this.notification = notification!;
        this.data = data!;
        if (topic) {
            this.topic = topic;
        }
        if (condition) {
            this.condition = condition;
        }
    }
}

class FCMessage {
    message: Message;

    constructor(message: Message) {
        this.message = message;
    }
}
// SEND FCM NOTIFICATION FROM CLIENT - TESTING ONLY
// export const sendNotificationForTopicDirect = async (
//     accessToken: string,
//     meal: any,
//     campusId: string,
//     cursusId: string,
//     topic?: string,
//     condition?: string
// ): Promise<void> => {
//     const PROJECT_ID = "cadet-check-cc42";
//     const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

//     try {
//         const notification = new Notification(
//             meal.type,
//             meal.name,
//             meal.pathImage
//         );
//         const data = new Data(
//             meal.id,
//             meal.createdBy,
//             meal.createdDate,
//             meal.quantity,
//             cursusId,
//             "DetailsMealFragment",
//             meal.description,
//             notification
//         );
//         const message = new Message(topic, condition, notification, data);
//         const fcmMessage = new FCMessage(message);

//         console.log(
//             "Sending FCM Message:",
//             JSON.stringify(fcmMessage, null, 2)
//         );

//         const response = await axios.post(FCM_URL, fcmMessage, {
//             headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${accessToken}`,
//             },
//         });

//         if (response.status === 200) {
//             await sendExpoNotificationToGroup(campusId, cursusId, {
//                 title: meal.type,
//                 body: meal.name,
//                 data: {
//                     id: meal.id,
//                     cursusId: cursusId,
//                     description: meal.description,
//                     createdDate: meal.createdDate,
//                     quantity: meal.quantity,
//                     pathImage: meal.pathImage,
//                 },
//                 image: meal.pathImage,
//             });
//             console.log("Notification sent:", response.data);
//             showAlert("Sucesso", "Notificação enviada com sucesso!");
//         } else {
//             console.error(
//                 "Failed to send notification:",
//                 response.status,
//                 data
//             );
//             showAlert(
//                 "Erro",
//                 `Erro ao enviar notificação: ${
//                     response.status
//                 } - ${JSON.stringify(data)}`
//             );
//         }
//     } catch (error: any) {
//         console.error(
//             "Error sending notification:",
//             error.response ? error.response.data : error.message
//         );
//         showAlert(
//             "Erro na Requisição",
//             `Erro: ${
//                 error.response
//                     ? JSON.stringify(error.response.data)
//                     : error.message
//             }`
//         );
//     }
// };

export const sendNotificationForBackEnd = async (
    meal: any,
    campusId: string,
    cursusId: string,
    topic?: string,
    condition?: string
): Promise<void> => {
    const notification = new Notification(meal.type, meal.name, meal.pathImage);
    const data = new Data(
        meal.id,
        meal.createdBy,
        meal.createdDate,
        meal.quantityNotReceived,
        cursusId,
        "DetailsMealFragment",
        meal.description,
        notification
    );
    const message = new Message(topic, condition, notification, data);
    const fcmMessage = new FCMessage(message);

    console.log("Sending FCM Message:", JSON.stringify(fcmMessage, null, 2));

    await sendFCMNotification(fcmMessage);
    await sendExpoNotificationToGroup(campusId, cursusId, {
        title: meal.type,
        body: meal.name,
        data: {
            id: meal.id,
            cursusId: cursusId,
            description: meal.description,
            createdDate: meal.createdDate,
            quantity: meal.quantity,
            pathImage: meal.pathImage,
        },
        image: meal.pathImage,
    });
};

export const sendNotificationForMessage = async (
    payload: { title: string; message: string },
    campusId: string,
    cursusId: string,
    topic?: string,
    condition?: string
): Promise<void> => {
    const notification = new Notification(payload.title, payload.message, "");

    const message = new Message(topic, condition, notification);
    const fcmMessage = new FCMessage(message);

    console.log("Sending FCM Message:", JSON.stringify(fcmMessage, null, 2));

    await sendFCMNotification(fcmMessage);
    await sendExpoNotificationToGroup(campusId, cursusId, {
        title: payload.title,
        body: payload.message,
        data: {},
        image: "",
    });
};

const FIREBASE_PUSH_URL = "https://check-cadet.vercel.app/api/notifications";

const sendFCMNotification = async (fcmMessage: FCMessage) => {
    try {
        const response = await axios.post(FIREBASE_PUSH_URL, fcmMessage, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.status === 200) {
            console.log("Notification sent:", response.data);
            showAlert(
                t("common.success"),
                t("notifications.notificationSentSuccessfully")
            );
        } else {
            console.error(
                "Failed to send notification:",
                response.status,
                response.data
            );
            showAlert(
                t("common.error"),
                `${t("notifications.errorSendingNotification")}: ${
                    response.status
                } - ${JSON.stringify(response.data)}`
            );
        }
    } catch (error: any) {
        console.error(
            "Error sending notification:",
            error.response ? error.response.data : error.message
        );
        showAlert(
            t("notifications.requestError"),
            `${
                error.response
                    ? JSON.stringify(error.response.data)
                    : error.message
            }`
        );
    }
};

export async function sendFCMNotificationToUser(
    pushToken: string,
    payload: NotificationPayload
): Promise<void> {
    try {
        // Converte todos os valores de data para string (requisito do FCM v1)
        const dataAsStrings: Record<string, string> = {};
        if (payload.data) {
            Object.keys(payload.data).forEach((key) => {
                dataAsStrings[key] = String(payload.data![key]);
            });
        }

        const fcmMessage = {
            message: {
                token: pushToken, // FCM v1 usa 'token' ao invés de 'to'
                notification: {
                    title: payload.title,
                    body: payload.body,
                    ...(payload.image && { image: payload.image }),
                },
                data: dataAsStrings, // Data deve ter valores como strings
            },
        };

        console.log("Sending FCM to user:", JSON.stringify(fcmMessage, null, 2));

        const response = await axios.post(FIREBASE_PUSH_URL, fcmMessage, {
            headers: {
                "Content-Type": "application/json",
            },
        });

        console.log("✅ FCM notification sent successfully:", response.data);
    } catch (error: any) {
        console.error("❌ Erro ao enviar notificação:", error.response?.data || error.message);
        throw error;
    }
}
