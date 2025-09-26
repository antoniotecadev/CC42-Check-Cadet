import { Picker } from "@react-native-picker/picker";
import React, { useState } from "react";
import {
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useColorCoalition } from "../ColorCoalitionContext";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

interface MealMinimal {
    id: string;
    name: string;
    type: string;
    quantityNotReceived?: number;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    meal: MealMinimal | null;
    onNotify: (option: string) => void;
}

export default function NotifyMealModal({
    visible,
    onClose,
    meal,
    onNotify,
}: Props) {
    const { color } = useColorCoalition();
    const [option, setOption] = useState("Primeira via");

    if (!meal) return null;

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={styles.overlay}>
                <ThemedView style={styles.container}>
                    <ThemedText style={styles.title}>{meal.type}</ThemedText>
                    <Text style={styles.message}>
                        {meal.name}
                        {"\n\n"}
                        Quantidade: {meal.quantityNotReceived ?? 0}
                    </Text>

                    {Platform.OS === "web" ? (
                        <select
                            value={option}
                            onChange={(e) => setOption(e.target.value)}
                            style={{ marginBottom: 12, padding: 8 }}
                        >
                            <option value="Primeira via">Primeira via</option>
                            <option value="Segunda via">Segunda via</option>
                        </select>
                    ) : (
                        <Picker
                            selectedValue={option}
                            onValueChange={(v) => setOption(String(v))}
                            style={styles.picker}
                        >
                            <Picker.Item label="Primeira via" value="Primeira via" />
                            <Picker.Item label="Segunda via" value="Segunda via" />
                        </Picker>
                    )}

                    <View style={styles.rowBtns}>
                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelText}>Não</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: color }]}
                            onPress={() => {
                                onNotify(option);
                                onClose();
                            }}
                        >
                            <Text style={styles.saveText}>Notificar</Text>
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
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: "90%",
        maxWidth: 520,
        padding: 20,
        borderRadius: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
    },
    message: {
        marginBottom: 12,
        color: "#333",
    },
    picker: {
        marginBottom: 12,
    },
    rowBtns: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: "#eee",
        padding: 12,
        borderRadius: 8,
        marginRight: 8,
    },
    saveBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        marginLeft: 8,
    },
    cancelText: {
        textAlign: "center",
        fontWeight: "bold",
        color: "#333",
    },
    saveText: {
        textAlign: "center",
        fontWeight: "bold",
        color: "#fff",
    },
});
