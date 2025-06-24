import { StyleSheet } from "react-native";
export const styles = StyleSheet.create({
    ratingContainer: {
        flexDirection: "row",
        borderRadius: 18,
        marginHorizontal: 18,
        padding: 18,
        marginBottom: 18,
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.07,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    ratingLeft: {
        flex: 1,
        alignItems: "center",
        borderRightWidth: 1,
        borderRightColor: "#F0F0F0",
        paddingRight: 12,
    },
    ratingValue: {
        fontSize: 38,
        fontWeight: "bold",
        color: "#3A86FF",
        marginBottom: 2,
    },
    starsRow: {
        flexDirection: "row",
        marginBottom: 2,
    },
    ratingCount: {
        color: "#888",
        fontSize: 13,
        marginTop: 2,
    },
    ratingRight: {
        flex: 1,
        alignItems: "center",
        paddingLeft: 12,
    },
    tapToRate: {
        fontWeight: "bold",
        fontSize: 15,
        marginBottom: 4,
    },
    starsRowSmall: {
        flexDirection: "row",
    },
});
