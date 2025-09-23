import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface WebMenuModalProps {
    isStaff: boolean;
    visible: boolean;
    onClose: () => void;
    onSelect: (option: number) => void;
}

export default function WebMenuModal({
    isStaff,
    visible,
    onClose,
    onSelect,
}: WebMenuModalProps) {
    const options = [
        { label: isStaff ? "Enviar Mensagem" : "Menu", value: 0 },
        { label: "Ver Mensagens", value: 1 },
        { label: "QR Code Scanner", value: 2 },
        { label: "Sobre e Suporte", value: 3 },
        { label: "Sair", value: 4 },
        { label: "Cancelar", value: 5 },
    ];

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {options.map((opt) => (
                        <TouchableOpacity
                            disabled={opt.value === 0 && !isStaff}
                            key={opt.value}
                            style={styles.option}
                            onPress={() => {
                                onClose();
                                if (opt.value !== 5) onSelect(opt.value);
                            }}
                        >
                            <Text
                                style={[
                                    styles.text,
                                    opt.value === 4 && { color: "#E53935" },
                                    opt.value === 0 &&
                                        !isStaff && { color: "#ddd" },
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
