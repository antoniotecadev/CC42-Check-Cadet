import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import type { Message } from "@/model/Message";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

type Props = {
    message: Message;
    onPress?: () => void;
};

export default function MessageItem({ message, onPress }: Props) {
    const title = message.title || "";
    const messageText = message.message || "";
    const ts = message.timestamp ? new Date(message.timestamp) : null;
    const formatted = ts
        ? `${ts.getDate().toString().padStart(2, "0")}/${(ts.getMonth() + 1)
              .toString()
              .padStart(2, "0")}/${ts.getFullYear()} ${ts.getHours().toString().padStart(2, "0")}:${ts.getMinutes().toString().padStart(2, "0")}`
        : "";

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <ThemedView style={styles.inner}>
                <ThemedText style={styles.title} numberOfLines={2} ellipsizeMode="tail">
                    {title}
                </ThemedText>
                <Text style={styles.timestamp}>{formatted}</Text>
                <ThemedText style={styles.body} selectable>
                    {messageText} {"text"}
                </ThemedText>
            </ThemedView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 8,
        marginHorizontal: 8,
        marginVertical: 4,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    inner: {
        padding: 16,
        borderRadius: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
    },
    timestamp: {
        marginTop: 4,
        color: "#666",
        fontSize: 12,
    },
    body: {
        marginTop: 8,
        fontSize: 14,
    },
});
