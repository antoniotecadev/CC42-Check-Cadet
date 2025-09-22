import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ThemedText } from "../ThemedText";

interface MealItemProps {
    item: {
        pathImage?: string;
        name: string;
        type: string;
        description: string;
        quantity: number;
        quantityReceived: number;
        quantityNotReceived: number;
        createdDate: string;
        isSubscribed: boolean;
    };
    color: string;
    borderColor: string;
}

const MealItem: React.FC<MealItemProps> = ({ item, color, borderColor }) => {
    return (
        <View style={[styles.itemRow, { borderColor }]}>
            {item.pathImage ? (
                <Image
                    source={{ uri: item.pathImage }}
                    style={styles.mealImage}
                    contentFit="cover"
                />
            ) : (
                <MaterialIcons
                    size={60}
                    style={{ marginRight: 16 }}
                    name="restaurant"
                    color={color}
                />
            )}
            <View style={styles.infoCol}>
                <ThemedText style={styles.name}>{item.name}</ThemedText>
                <ThemedText style={styles.desc}>{item.description}</ThemedText>

                <Text style={styles.type}>
                    {item.type} {item.createdDate} {item.quantityNotReceived}/
                    {item.quantityReceived}{" "}
                </Text>
                <Text
                    style={[
                        styles.sub,
                        { color: item.isSubscribed ? "green" : "red" },
                    ]}
                >
                    {item.isSubscribed ? "Subscrito" : ""}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    itemRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
    },
    mealImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 16,
    },
    infoCol: { flex: 1 },
    name: { fontWeight: "bold", fontSize: 14 },
    type: { fontSize: 12, color: "#888" },
    desc: { fontSize: 12 },
    sub: { fontSize: 12 },
});

export default MealItem;
