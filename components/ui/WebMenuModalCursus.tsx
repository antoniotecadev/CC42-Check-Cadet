import React from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import { t } from "../../i18n";
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
        { label: t('cursus.42cursus'), value: 0 },
        { label: t('cursus.cpiscine'), value: 1 },
        { label: t('cursus.cpiscineReloaded'), value: 2 },
        { label: t('cursus.discoveryPiscine'), value: 3 },
        { label: t('common.cancel'), value: 4 },
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
