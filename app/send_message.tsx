import { useColorCoalition } from "@/components/ColorCoalitionContext";
import { cursusType } from "@/constants/cursusOptions";
import { t } from "@/i18n";
import messageService from "@/services/messageService";
import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
} from "react-native";

export default function SendMessage() {
    const params = useLocalSearchParams() as {
        userId?: string;
        campusId?: string;
        campusName?: string;
    };
    const userId = Number(params.userId);
    const campusId = params.campusId ?? "";
    const campusName = params.campusName ?? "";

    const isWeb = Platform.OS === "web";

    const { color: colorCoalition } = useColorCoalition();

    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [cursus, setCursus] = useState(cursusType[0]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const onSend = async () => {
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            await messageService.sendMessage(campusId, campusName, cursus, {
                title,
                message,
                createdBy: userId,
            });
            setTitle("");
            setMessage("");
            setSuccess(t('messages.sendSuccess'));
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={[styles.container, isWeb ? styles.inner : {}]}
        >
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                {isWeb ? (
                    <select
                        value={cursus}
                        onChange={(e) => setCursus(e.target.value)}
                        style={{
                            padding: "12px 16px",
                            fontSize: 16,
                            borderRadius: 8,
                            border: `1px solid #ddd`,
                            background: "#fafafa",
                            color: "#333",
                            marginBottom: 10,
                            outline: "none",
                            width: "100%",
                            appearance: "none",
                            WebkitAppearance: "none",
                            MozAppearance: "none",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                            cursor: "pointer",
                        }}
                    >
                        {cursusType.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                ) : (
                    <Picker
                        itemStyle={{ height: 50, marginBottom: 12 }}
                        selectedValue={cursus}
                        onValueChange={setCursus}
                        style={{ color: "#333" }} // ou ajuste conforme seu tema
                    >
                        {cursusType.map((item) => (
                            <Picker.Item key={item} label={item} value={item} />
                        ))}
                    </Picker>
                )}

                <TextInput
                    style={styles.input}
                    placeholder={t('messages.messageTitle')}
                    placeholderTextColor="#666"
                    value={title}
                    onChangeText={(t) => setTitle(t)}
                    editable={!loading}
                    returnKeyType="next"
                />

                <TextInput
                    style={[styles.input, styles.textarea]}
                    placeholder={t('messages.messageContent')}
                    placeholderTextColor="#666"
                    value={message}
                    onChangeText={(t) => setMessage(t)}
                    editable={!loading}
                    multiline
                    textAlignVertical="top"
                />

                {error ? <Text style={styles.error}>{error}</Text> : null}
                {success ? <Text style={styles.success}>{success}</Text> : null}

                <TouchableOpacity
                    style={[
                        styles.button,
                        loading ? styles.buttonDisabled : null,
                        { backgroundColor: colorCoalition },
                    ]}
                    onPress={onSend}
                    disabled={loading}
                    accessibilityRole="button"
                >
                    {loading ? (
                        <ActivityIndicator color={colorCoalition} />
                    ) : (
                        <Text style={styles.buttonText}>{t('messages.sendMessage').toUpperCase()}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        padding: 20,
    },
    heading: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        marginBottom: 6,
        color: "#333",
    },
    input: {
        borderWidth: 1,
        borderColor: "#DDD",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 12,
        backgroundColor: "#FFF",
    },
    textarea: {
        minHeight: 120,
    },
    button: {
        backgroundColor: "#1976D2",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: "#FFF",
        fontWeight: "600",
    },
    error: {
        color: "#D32F2F",
        marginBottom: 8,
    },
    success: {
        color: "#2E7D32",
        marginBottom: 8,
    },
    inner: {
        width: "100%",
        maxWidth: 600, // limite superior
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
});
