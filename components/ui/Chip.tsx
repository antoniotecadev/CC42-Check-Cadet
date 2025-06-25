import { MaterialIcons } from "@expo/vector-icons"; // ícone do "X"
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Chip({
    label,
    onRemove,
}: {
    label: string;
    onRemove: () => void;
}) {
    return (
        <View style={styles.chip}>
            <Text style={styles.label}>{label}</Text>
            <Pressable onPress={onRemove} style={styles.closeButton}>
                <MaterialIcons name="close" size={16} color="#555" />
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    chip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e0f2f1",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        margin: 4,
        alignSelf: "flex-start",
    },
    label: {
        color: "#00695c",
        fontSize: 14,
        marginRight: 8,
    },
    closeButton: {
        padding: 4,
        borderRadius: 12,
    },
});
