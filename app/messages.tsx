import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { database } from "@/firebaseConfig";
import { FlashList } from "@shopify/flash-list";
import {
    limitToLast,
    onValue,
    orderByChild,
    query,
    ref,
} from "firebase/database";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import MessageItem from "@/components/ui/MessageItem";
import type { Message } from "@/model/Message";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";

export default function MessagesScreen() {
    const { color: colorCoalition } = useColorCoalition();

    const { campusId, cursusId } = useLocalSearchParams<{
        campusId: string;
        cursusId: string;
    }>();

    const navigation = useNavigation();

    const isWeb = Platform.OS === "web";

    const [loading, setLoading] = useState<boolean>(true);
    const [messages, setMessages] = useState<Message[]>([]);

    useLayoutEffect(() => {
        if (navigation.setOptions) {
            if (cursusId === "21") {
                navigation.setOptions({ title: "42 Cursus" });
            } else if (cursusId === "9") {
                navigation.setOptions({ title: "C Piscine" });
            } else if (cursusId === "66") {
                navigation.setOptions({
                    title: "C-Piscine-Reloaded",
                });
            }
        }
    }, [cursusId]);

    useEffect(() => {
        const messagesRef = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/messages`
        );
        const q = query(messagesRef, orderByChild("timestamp"), limitToLast(7));

        const unsubscribe = onValue(q, (snapshot) => {
            const list: Message[] = [];
            snapshot.forEach((child) => {
                const val = child.val();
                list.push({
                    id: child.key || undefined,
                    title: val.title || null,
                    message: val.message || null,
                    timestamp: val.timestamp || null,
                });
            });
            // ordenar decrescente (mais recente primeiro)
            list.sort((a, b) => {
                if (!a.timestamp && !b.timestamp) return 0;
                if (!a.timestamp) return 1;
                if (!b.timestamp) return -1;
                return b.timestamp - a.timestamp;
            });
            setMessages(list);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [campusId, cursusId]);

    if (loading)
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colorCoalition} size="large" />
            </View>
        );

    if (!messages.length)
        return (
            <View style={[styles.center, isWeb ? styles.inner : {}]}>
                <ThemedText>Nenhuma mensagem encontrada.</ThemedText>
            </View>
        );

    return (
        <FlashList
            data={messages}
            keyExtractor={(item) => item.id || Math.random().toString()}
            renderItem={({ item }) => <MessageItem message={item} />}
            contentContainerStyle={[
                { paddingVertical: 8 },
                isWeb ? styles.inner : {},
            ]}
        />
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    inner: {
        width: "100%",
        maxWidth: 600, // limite superior
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
});
