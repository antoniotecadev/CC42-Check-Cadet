import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
    ratingContainer: {
        borderRadius: 18,
        padding: 20,
        marginBottom: 6,
        alignItems: "center",
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    ratingLeft: {
        alignItems: "center",
        width: "100%",
    },
    ratingValue: {
        fontSize: 42,
        fontWeight: "bold",
        color: "#3A86FF",
        marginBottom: 8,
    },
    starsRow: {
        flexDirection: "row",
        marginBottom: 8,
        gap: 6,
    },
    ratingCount: {
        color: "#666",
        fontSize: 15,
        fontWeight: "500",
    },
    starsRowSmall: {
        flexDirection: "row",
        gap: 10,
    },
});
