import { database } from "@/firebaseConfig";
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
    if (cursusSelection === "42 Cursus") cursusId = "21";
    else if (cursusSelection === "C Piscine") cursusId = "9";
    else if (cursusSelection === "C-Piscine-Reloaded") cursusId = "66";
    
    if (!payload.title || payload.title.trim() === "") {
        throw new Error("O título não pode estar vazio");
    }
    if (!payload.message || payload.message.trim() === "") {
        throw new Error("A mensagem não pode estar vazia");
    }

    if (!cursusId) {
        throw new Error("Cursus inválido");
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
