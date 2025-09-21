import { database } from "@/firebaseConfig";
import type { Message } from "@/model/Message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { get, limitToLast, orderByChild, query, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedView } from "./ThemedView";

const PREFS_KEY_LAST_ID = "latest_message_last_seen_id";
const PREFS_KEY_DONT_SHOW = "latest_message_dont_show_until_new";

type Props = {
    campusId: string | number;
    cursusId: string | number;
    visible?: boolean; // optional override
};

export default function LatestMessageDialog({
    campusId,
    cursusId,
    visible,
}: Props) {
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<Message | null>(null);
    const [messageId, setMessageId] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        let mounted = true;

        const fetchLatest = async () => {
            try {
                const messagesRef = ref(
                    database,
                    `campus/${campusId}/cursus/${cursusId}/messages`
                );
                const q = query(
                    messagesRef,
                    orderByChild("timestamp"),
                    limitToLast(1)
                );
                const snap = await get(q);
                if (!mounted) return;

                if (snap.exists()) {
                    let lastSnap: any = null;
                    snap.forEach((child) => {
                        lastSnap = child;
                    });
                    if (lastSnap) {
                        const id = lastSnap.key as string;
                        const val = lastSnap.val();
                        const fetched: Message = {
                            id,
                            title: val.title || null,
                            message: val.message || null,
                            timestamp: val.timestamp || null,
                        };

                        const lastSeenId = await AsyncStorage.getItem(
                            PREFS_KEY_LAST_ID
                        );
                        const dontShow =
                            (await AsyncStorage.getItem(
                                PREFS_KEY_DONT_SHOW
                            )) === "true";

                        // Show if: not blocked, or it's a different/new message
                        if (
                            !dontShow ||
                            lastSeenId == null ||
                            lastSeenId !== id
                        ) {
                            setMessage(fetched);
                            setMessageId(id);
                            setShowModal(true);
                        }
                    }
                }
            } catch (e) {
                // ignore silently or log
                console.warn("Error fetching latest message", e);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchLatest();

        return () => {
            mounted = false;
        };
    }, [campusId, cursusId]);

    const onDontShowAgain = async () => {
        if (messageId) {
            await AsyncStorage.setItem(PREFS_KEY_LAST_ID, messageId);
            await AsyncStorage.setItem(PREFS_KEY_DONT_SHOW, "true");
        }
        setShowModal(false);
    };

    const onOk = async () => {
        if (messageId) {
            // Save last seen id so we can detect new messages later
            await AsyncStorage.setItem(PREFS_KEY_LAST_ID, messageId);
            // Also reset the dont-show flag so future messages show
            await AsyncStorage.setItem(PREFS_KEY_DONT_SHOW, "false");
        }
        setShowModal(false);
    };

    if (loading) return null; // nothing to show while loading

    // Allow external override of visible prop
    const visibleNow = typeof visible === "boolean" ? visible : showModal;

    return (
        <Modal
            visible={visibleNow}
            transparent
            animationType="fade"
            onRequestClose={() => {}}
        >
            <View style={styles.overlay}>
                <ThemedView style={styles.card}>
                    {message ? (
                        <>
                            <ThemedText style={styles.title}>
                                {message.title}
                            </ThemedText>
                            {message.timestamp ? (
                                <Text style={styles.ts}>
                                    {new Date(
                                        message.timestamp
                                    ).toLocaleString()}
                                </Text>
                            ) : null}
                            <ThemedText style={styles.body}>
                                {message.message}
                            </ThemedText>
                        </>
                    ) : (
                        <ThemedText>Sem mensagens</ThemedText>
                    )}

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={onOk}
                        >
                            <Text style={styles.actionText}>OK</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.ghost]}
                            onPress={onDontShowAgain}
                        >
                            <Text style={[styles.actionText, styles.ghostText]}>
                                Não mostrar novamente
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ThemedView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    card: {
        width: "100%",
        maxWidth: 520,
        borderRadius: 12,
        padding: 18,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
    title: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
    ts: { fontSize: 12, color: "#666", marginBottom: 12 },
    body: { fontSize: 15, marginBottom: 16 },
    actions: { flexDirection: "row", justifyContent: "space-between" },
    actionButton: { paddingHorizontal: 12, paddingVertical: 8, marginLeft: 8 },
    actionText: { color: "#1976D2", fontWeight: "600" },
    ghost: {},
    ghostText: { color: "#B00020" },
});
