import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";

interface WebMenuModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (option: number) => void;
}

export default function WebMenuModalCursus({
    visible,
    onClose,
    onSelect,
}: WebMenuModalProps) {
    const options = [
        { label: "42 Cursus", value: 0 },
        { label: "C Piscine", value: 1 },
        { label: "C-Piscine-Reloaded", value: 2 },
        { label: "Cancelar", value: 3 },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <ThemedView style={styles.modal}>
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={styles.option}
                            onPress={() => {
                                onClose();
                                if (opt.value !== 3) onSelect(opt.value);
                            }}
                        >
                            <ThemedText
                                style={[
                                    styles.text,
                                    opt.value === 3 && { color: "#E53935" },
                                ]}
                            >
                                {opt.label}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </ThemedView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(30,30,30,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    modal: {
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
        minWidth: 260,
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    option: {
        paddingVertical: 12,
        alignItems: "center",
    },
    text: {
        fontSize: 17,
    },
});
