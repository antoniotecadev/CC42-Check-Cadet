import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface EventMealUserItemProps {
    login: string;
    displayName: string;
    imageUrl?: string;
    onPress?: () => void;
    colorscheme: string;
    type: string;
    isPresent?: boolean;
    isSusbscribed?: boolean;
    isSecondPortion?: boolean;
    hasCheckin?: boolean;
    hasCheckout?: boolean;
    hasFirstPortion?: boolean;
    hasSecondPortion?: boolean;
}

const blurhash =
    "|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[";

export const EventMealUserItem: React.FC<EventMealUserItemProps> = ({
    login,
    displayName,
    imageUrl,
    onPress,
    colorscheme,
    type,
    isPresent,
    isSusbscribed,
    isSecondPortion,
    hasCheckin,
    hasCheckout,
    hasFirstPortion,
    hasSecondPortion,
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
                    {type !== "events" && type !== "meals" && (
                        <Text
                            style={[
                                styles.present,
                                isPresent || isSusbscribed
                                    ? styles.presentYes
                                    : styles.presentNo,
                            ]}
                        >
                            {isSecondPortion
                                ? "Segunda via"
                                : isSusbscribed
                                ? "Subscrito"
                                : "Não subscrito"}
                        </Text>
                    )}
                </View>
                <Text style={styles.displayName}>{displayName}</Text>
                
                {/* Informações específicas para eventos */}
                {type === "events" && (
                    <View style={styles.eventStatusContainer}>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Check-in:</Text>
                            <Text
                                style={[
                                    styles.statusValue,
                                    hasCheckin ? styles.presentYes : styles.presentNo,
                                ]}
                            >
                                {hasCheckin ? "Presente" : "Ausente"}
                            </Text>
                        </View>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Check-out:</Text>
                            <Text
                                style={[
                                    styles.statusValue,
                                    hasCheckout ? styles.presentYes : styles.presentNo,
                                ]}
                            >
                                {hasCheckout ? "Presente" : "Ausente"}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Informações específicas para refeições */}
                {type === "meals" && (
                    <View style={styles.eventStatusContainer}>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Primeira via:</Text>
                            <Text
                                style={[
                                    styles.statusValue,
                                    hasFirstPortion ? styles.presentYes : styles.presentNo,
                                ]}
                            >
                                {hasFirstPortion ? "Subscrito" : "Não subscrito"}
                            </Text>
                        </View>
                        <View style={styles.statusRow}>
                            <Text style={styles.statusLabel}>Segunda via:</Text>
                            <Text
                                style={[
                                    styles.statusValue,
                                    hasSecondPortion ? styles.presentYes : styles.presentNo,
                                ]}
                            >
                                {hasSecondPortion ? "Subscrito" : "Não subscrito"}
                            </Text>
                        </View>
                    </View>
                )}
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
    eventStatusContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#eee",
    },
    statusRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    statusLabel: {
        fontSize: 12,
        color: "#666",
        fontWeight: "500",
    },
    statusValue: {
        fontSize: 12,
        fontWeight: "bold",
    },
});

export default EventMealUserItem;
