import axios from "axios";
import { Alert } from "react-native";
import { getItem, setItem } from "./AccessTokenGeneratorRN";
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

export const sendNotificationForTopicDirect = async (
    accessToken: string,
    meal: any,
    campusId: string,
    cursusId: string,
    topic?: string,
    condition?: string
): Promise<void> => {
    const PROJECT_ID = "cadet-check-cc42";
    const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

    try {
        const notification = new Notification(
            meal.type,
            meal.name,
            meal.pathImage
        );
        const data = new Data(
            meal.id,
            meal.createdBy,
            meal.createdDate,
            meal.quantity,
            cursusId,
            "DetailsMealFragment",
            meal.description,
            notification
        );
        const message = new Message(topic, condition, notification, data);
        const fcmMessage = new FCMessage(message);

        console.log(
            "Sending FCM Message:",
            JSON.stringify(fcmMessage, null, 2)
        );

        const response = await axios.post(FCM_URL, fcmMessage, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (response.status === 200) {
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
            console.log("Notification sent:", response.data);
            Alert.alert("Sucesso", "Notificação enviada com sucesso!");
        } else {
            console.error(
                "Failed to send notification:",
                response.status,
                response.data
            );
            Alert.alert(
                "Erro",
                `Erro ao enviar notificação: ${
                    response.status
                } - ${JSON.stringify(response.data)}`
            );
        }
    } catch (error: any) {
        console.error(
            "Error sending notification:",
            error.response ? error.response.data : error.message
        );
        Alert.alert(
            "Erro na Requisição",
            `Erro: ${
                error.response
                    ? JSON.stringify(error.response.data)
                    : error.message
            }`
        );
    }
};

export async function subscribeToMealTopic(
    campusName: string,
    campusId: string,
    cursusId: string,
    isStaff: boolean
) {
    const isSubscribed = await getItem("subscribe_topic");
    if (!isSubscribed) {
        let topic = `meals_${campusId}_`;
        if (isStaff) {
            topic += campusName;
        } else {
            topic += cursusId;
        }
        try {
            // await messaging().subscribeToTopic(topic);
            await setItem("subscribe_topic", "true");
        } catch (error: any) {
            console.error("Failed to subscribe to topic:", error);
            Alert.alert(
                "Erro",
                "Failed to subscribe to topic: " + error.message
            );
        }
    }
}
