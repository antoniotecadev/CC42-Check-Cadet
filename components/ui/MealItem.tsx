import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { IconSymbol } from "./IconSymbol";

interface MealItemProps {
    item: {
        pathImage?: string;
        name: string;
        type: string;
        description: string;
        quantity: number;
        numberSubscribed: number;
        createdDate: string;
        isSubscribed: boolean;
    };
    color: string;
}

const MealItem: React.FC<MealItemProps> = ({ item, color }) => {
    return (
        <View style={styles.itemRow}>
            {item.pathImage ? (
                <Image
                    source={{ uri: item.pathImage }}
                    style={styles.mealImage}
                    contentFit="cover"
                />
            ) : (
                <IconSymbol size={60} name="fork.knife" color={color} />
            )}
            <View style={styles.infoCol}>
                <Text style={styles.type}>{item.type}</Text>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.desc}>{item.description}</Text>
                <Text style={styles.qty}>
                    Qtd: {item.quantity} / {item.numberSubscribed}
                </Text>
                <Text style={styles.date}>{item.createdDate}</Text>
                <Text
                    style={[
                        styles.sub,
                        { color: item.isSubscribed ? "green" : "red" },
                    ]}
                >
                    {item.isSubscribed ? "Assinado" : "Não assinado"}
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
        borderColor: "#eee",
    },
    mealImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 16,
    },
    infoCol: { flex: 1 },
    name: { fontWeight: "bold", fontSize: 16 },
    type: { fontSize: 12, color: "#888" },
    desc: { fontSize: 12 },
    qty: { fontSize: 12, color: "#007AFF" },
    date: { fontSize: 10, color: "#888" },
    sub: { fontSize: 12, fontWeight: "normal" },
});

export default MealItem;
