import { getComment, sendComment } from "@/repository/userRepository";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { useColorCoalition } from "../ColorCoalitionContext";

type Props = {
    campusId?: string | undefined | null;
    cursusId?: string | undefined | null;
    userId?: string | undefined | null;
    type: "meals" | "events" | string;
    typeId?: string | number | undefined | null;
    containerStyle?: any;
};

const MAX_LEN = 42;

export default function CommentBox({
    campusId,
    cursusId,
    userId,
    type,
    typeId,
    containerStyle,
}: Props) {
    const { color } = useColorCoalition();

    const [comment, setComment] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingComment, setLoadingComment] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState<boolean>(false);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!campusId || !cursusId || !userId || !typeId) return;
            setLoadingComment(true);
            try {
                const c = await getComment(
                    String(campusId),
                    String(cursusId),
                    type,
                    String(typeId),
                    String(userId)
                );
                if (mounted) {
                    setComment(c ?? "");
                    setSaved(Boolean(c && String(c).trim().length > 0));
                }
            } catch (e: any) {
                if (mounted) setError(e?.message ?? String(e));
            } finally {
                if (mounted) setLoadingComment(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [campusId, cursusId, userId, type, typeId]);

    const handleSend = async () => {
        if (!comment || comment.trim().length === 0) {
            setError("Comentário obrigatório");
            return;
        }
        if (!campusId || !cursusId || !userId || !typeId) {
            setError("Dados insuficientes para enviar comentário");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            await sendComment(
                String(campusId),
                String(cursusId),
                type,
                String(typeId),
                String(userId),
                comment.trim()
            );
            setSaved(true);
            Keyboard.dismiss();
        } catch (e: any) {
            setError(e?.message ?? String(e));
        } finally {
            setLoading(false);
        }
    };
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={80}
            style={{ flex: 0 }}
        >
            {Platform.OS === "web" ? (
                <View style={containerStyle}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Comentário</Text>
                        {loadingComment ? (
                            <ActivityIndicator
                                style={{ alignSelf: "center" }}
                            />
                        ) : (
                            <>
                                <TextInput
                                    value={comment}
                                    onChangeText={(t) => {
                                        if (t.length <= MAX_LEN && !saved)
                                            setComment(t);
                                    }}
                                    placeholder="Escreva seu comentário"
                                    style={[
                                        styles.input,
                                        saved ? styles.inputDisabled : null,
                                    ]}
                                    maxLength={MAX_LEN}
                                    editable={!saved}
                                />
                                <Text style={styles.counter}>
                                    {String(comment?.length ?? 0)}/{MAX_LEN}
                                </Text>
                                {error ? (
                                    <Text style={styles.error}>{error}</Text>
                                ) : null}
                                {!saved && (
                                    <TouchableOpacity
                                        style={[
                                            styles.button,
                                            { backgroundColor: color },
                                        ]}
                                        disabled={loading}
                                        onPress={handleSend}
                                    >
                                        {loading ? (
                                            <Text style={{ color: "#fff" }}>
                                                Enviando comentário...
                                            </Text>
                                        ) : (
                                            <Text style={styles.buttonText}>
                                                COMENTAR
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
                </View>
            ) : (
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <View style={containerStyle}>
                        <View style={styles.card}>
                            <Text style={styles.title}>Comentário</Text>
                            {loadingComment ? (
                                <ActivityIndicator
                                    style={{ alignSelf: "center" }}
                                />
                            ) : (
                                <>
                                    <TextInput
                                        value={comment}
                                        onChangeText={(t) => {
                                            if (t.length <= MAX_LEN && !saved)
                                                setComment(t);
                                        }}
                                        placeholder="Escreva seu comentário"
                                        style={[
                                            styles.input,
                                            saved ? styles.inputDisabled : null,
                                        ]}
                                        maxLength={MAX_LEN}
                                        editable={!saved}
                                    />
                                    <Text style={styles.counter}>
                                        {String(comment?.length ?? 0)}/{MAX_LEN}
                                    </Text>
                                    {error ? (
                                        <Text style={styles.error}>{error}</Text>
                                    ) : null}
                                    {!saved && (
                                        <TouchableOpacity
                                            style={[
                                                styles.button,
                                                { backgroundColor: color },
                                            ]}
                                            disabled={loading}
                                            onPress={handleSend}
                                        >
                                            {loading ? (
                                                <Text style={{ color: "#fff" }}>
                                                    Enviando comentário...
                                                </Text>
                                            ) : (
                                                <Text
                                                    style={styles.buttonText}
                                                >
                                                    COMENTAR
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 12,
        alignItems: "flex-start",
    },
    title: {
        fontWeight: "bold",
        marginBottom: 8,
        color: "#888",
    },
    input: {
        width: "100%",
        minHeight: 40,
        borderColor: "#ddd",
        borderWidth: 1,
        borderRadius: 8,
        padding: 8,
        marginBottom: 8,
        color: "#888",
    },
    inputDisabled: {
        backgroundColor: "#f6f6f6",
    },
    counter: {
        alignSelf: "flex-end",
        color: "#888",
        marginBottom: 8,
        fontSize: 12,
    },
    error: {
        color: "red",
        marginBottom: 8,
    },
    button: {
        backgroundColor: "transparent",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "stretch",
    },
    buttonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "bold",
    },
});
