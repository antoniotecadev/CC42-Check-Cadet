import { database } from "@/firebaseConfig";
import { t } from "@/i18n";
import Message from "@/model/Message";
import { push, ref, set } from "firebase/database";
import { sendNotificationForMessage } from "./FirebaseNotification";

export const sendMessage = async (
    campusId: number | string,
    campusName: string,
    cursusSelection: string,
    payload: Message
) => {
    let cursusId = "";
    if (cursusSelection === t('cursus.42cursus')) cursusId = "21";
    else if (cursusSelection === t('cursus.cpiscine')) cursusId = "9";
    else if (cursusSelection === t('cursus.cpiscineReloaded')) cursusId = "66";
    else if (cursusSelection === t('cursus.discoveryPiscine')) cursusId = "3";

    if (!payload.title || payload.title.trim() === "") {
        throw new Error(t('messages.titleCannotBeEmpty'));
    }
    if (!payload.message || payload.message.trim() === "") {
        throw new Error(t('messages.messageCannotBeEmpty'));
    }

    if (!cursusId) {
        throw new Error(t('cursus.invalidCursus'));
    }

    const messagesRef = ref(
        database,
        `campus/${campusId}/cursus/${cursusId}/messages`
    );

    const newMessageRef = push(messagesRef);
    const messageId = newMessageRef.key;

    const messageObj = {
        title: payload.title.trim(),
        message: payload.message.trim(),
        timestamp: Date.now(),
        createdBy: Number(payload.createdBy),
    };

    if (!messageId) throw new Error("error_generate_id_message");

    await set(newMessageRef, messageObj);

    try {
        const topicStudent = `meals_${campusId}_${cursusId}`;
        const topicStaff = `meals_${campusId}_${campusName}`;
        const topics = [topicStudent, topicStaff];
        const condition = topics.map((t) => `'${t}' in topics`).join(" || ");

        await sendNotificationForMessage(
            { title: payload.title, message: payload.message },
            String(campusId),
            cursusId,
            undefined,
            condition
        );
    } catch (e) {
        console.warn("Failed to send notification:", e);
    }
};

export default {
    sendMessage,
};
