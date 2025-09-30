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
    integrated?: boolean;
};

const MAX_LEN = 42;

export default function CommentBox({
    campusId,
    cursusId,
    userId,
    type,
    typeId,
    containerStyle,
    integrated = false,
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
                    <View style={integrated ? styles.cardIntegrated : styles.card}>
                        {!integrated && <Text style={styles.title}>Comentário</Text>}
                        {integrated && <Text style={styles.titleIntegrated}>Deixe seu comentário:</Text>}
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
                                        integrated ? styles.inputIntegrated : styles.input,
                                        saved ? styles.inputDisabled : null,
                                    ]}
                                    maxLength={MAX_LEN}
                                    editable={!saved}
                                    multiline={integrated}
                                    numberOfLines={integrated ? 3 : 1}
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
                                            integrated ? styles.buttonIntegrated : styles.button,
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
                                {saved && (
                                    <View style={styles.savedIndicator}>
                                        <Text style={styles.savedText}>
                                            ✓ Comentário salvo
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            ) : (
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <View style={containerStyle}>
                        <View style={integrated ? styles.cardIntegrated : styles.card}>
                            {!integrated && <Text style={styles.title}>Comentário</Text>}
                            {integrated && <Text style={styles.titleIntegrated}>Deixe seu comentário:</Text>}
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
                                            integrated ? styles.inputIntegrated : styles.input,
                                            saved ? styles.inputDisabled : null,
                                        ]}
                                        maxLength={MAX_LEN}
                                        editable={!saved}
                                        multiline={integrated}
                                        numberOfLines={integrated ? 3 : 1}
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
                                                integrated ? styles.buttonIntegrated : styles.button,
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
                                    {saved && (
                                        <View style={styles.savedIndicator}>
                                            <Text style={styles.savedText}>
                                                ✓ Comentário salvo
                                            </Text>
                                        </View>
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
    cardIntegrated: {
        alignItems: "flex-start",
        paddingTop: 0,
    },
    title: {
        fontWeight: "bold",
        marginBottom: 8,
        color: "#888",
    },
    titleIntegrated: {
        fontWeight: "600",
        marginBottom: 12,
        color: "#666",
        fontSize: 15,
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
    inputIntegrated: {
        width: "100%",
        minHeight: 80,
        borderColor: "#ddd",
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        color: "#666",
        textAlignVertical: "top",
        backgroundColor: "#fafafa",
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
    buttonIntegrated: {
        backgroundColor: "transparent",
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        marginTop: 4,
    },
    buttonText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "bold",
    },
    savedIndicator: {
        alignSelf: "center",
        marginTop: 8,
        padding: 8,
        backgroundColor: "#E8F5E8",
        borderRadius: 8,
    },
    savedText: {
        color: "#4CAF50",
        fontWeight: "600",
        fontSize: 14,
    },
});
