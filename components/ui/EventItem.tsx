import { t } from "@/i18n";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface EventItemProps {
    name: string;
    location: string;
    begin_at: string;
    end_at: string;
}

const EventItem: React.FC<{ item: EventItemProps; color: string }> = ({
    item,
    color,
}) => {
    return (
        <LinearGradient
            colors={[color, "#444"]}
            start={{ x: 1, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={styles.card}
        >
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.row}>
                <MaterialIcons
                    name="location-on"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 4 }}
                />
                <Text style={styles.location}>{item.location}</Text>
            </View>
            <View style={styles.row}>
                <MaterialIcons
                    name="access-time"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 4 }}
                />
                <Text style={styles.timeLabel}>{t('events.start')}:</Text>
                <Text style={styles.time}>
                    {new Date(item.begin_at).toLocaleString()}
                </Text>
            </View>
            <View style={styles.row}>
                <MaterialIcons
                    name="event"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 4 }}
                />
                <Text style={styles.timeLabel}>{t('events.end')}:</Text>
                <Text style={styles.time}>
                    {new Date(item.end_at).toLocaleString()}
                </Text>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        padding: 18,
        marginVertical: 4,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    title: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    location: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "500",
    },
    timeLabel: {
        color: "#e3f2fd",
        fontSize: 13,
        marginRight: 2,
        fontWeight: "600",
    },
    time: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "400",
        marginLeft: 2,
    },
});

export default EventItem;
