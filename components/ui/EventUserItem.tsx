import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EventUserItemProps {
    login: string;
    displayName: string;
    imageUrl?: string;
    isPresent?: boolean;
    onPress?: () => void;
    colorscheme: string;
}

const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

export const EventUserItem: React.FC<EventUserItemProps> = ({
    login,
    displayName,
    imageUrl,
    isPresent,
    onPress,
    colorscheme,
}) => {
    return (
        <TouchableOpacity
            style={[styles.container, { backgroundColor: colorscheme }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Image
                source={
                    imageUrl
                        ? { uri: imageUrl }
                        : require("../../assets/images/icon.png")
                }
                placeholder={{ blurhash }}
                transition={1000}
                style={styles.avatar}
            />
            <View style={styles.infoContainer}>
                <View style={styles.row}>
                    <Text style={styles.login}>{login}</Text>
                    <Text
                        style={[
                            styles.present,
                            isPresent === true
                                ? styles.presentYes
                                : isPresent === false
                                ? styles.presentNo
                                : null,
                        ]}
                    >
                        {isPresent === true
                            ? "Presente"
                            : isPresent === false
                            ? "Ausente"
                            : ""}
                    </Text>
                </View>
                <Text style={styles.displayName}>{displayName}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        marginVertical: 6,
        marginHorizontal: 12,
        padding: 10,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 12,
        backgroundColor: "#eee",
    },
    infoContainer: {
        flex: 1,
        justifyContent: "center",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    login: {
        fontWeight: "bold",
        fontSize: 14,
        color: "#999",
    },
    present: {
        fontSize: 12,
        fontWeight: "bold",
        marginLeft: 8,
    },
    presentYes: {
        color: "#2ecc40",
    },
    presentNo: {
        color: "#e74c3c",
    },
    displayName: {
        fontSize: 12,
        color: "#888",
        marginTop: 4,
    },
});

export default EventUserItem;
