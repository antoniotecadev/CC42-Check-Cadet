import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WebMenuModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (option: number) => void;
}

export default function WebMenuModal({
    visible,
    onClose,
    onSelect,
}: WebMenuModalProps) {
    const options = [
        { label: "QR Code Scanner", value: 1 },
        { label: "Sobre", value: 2 },
        { label: "Sair", value: 3 },
        { label: "Cancelar", value: 0 },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={opt.value}
                            style={styles.option}
                            onPress={() => {
                                onClose();
                                if (opt.value !== 0) onSelect(opt.value);
                            }}
                        >
                            <Text
                                style={[
                                    styles.text,
                                    opt.value === 3 && { color: "#E53935" },
                                ]}
                            >
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
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
        backgroundColor: "#fff",
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
        color: "#222",
    },
});
