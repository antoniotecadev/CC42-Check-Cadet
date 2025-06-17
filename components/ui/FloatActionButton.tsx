import { Ionicons } from "@expo/vector-icons";
import { Platform, TouchableOpacity } from "react-native";
import { IconSymbol } from "./IconSymbol";

type Props = {
    nameIcon: any;
    onPress?: () => void;
    right?: number;
    left?: number;
    bottom?: number;
    width?: number;
    height?: number;
};

export default function FloatActionButton({
    nameIcon,
    right,
    left,
    bottom,
    width,
    height,
    onPress,
}: Props) {
    return (
        <TouchableOpacity
            style={{
                position: "absolute",
                left: left,
                right: right,
                bottom: bottom,
                zIndex: 10,
                backgroundColor: "#fff",
                borderRadius: 28,
                elevation: 6,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                width: width || 56,
                height: height || 56,
                justifyContent: "center",
                alignItems: "center",
            }}
            onPress={() => onPress?.()}
        >
            {Platform.OS === "web" ? (
                <Ionicons
                    name={nameIcon}
                    size={28}
                    color="#000"
                    style={{ position: "absolute" }}
                />
            ) : (
                <IconSymbol
                    name={nameIcon}
                    size={28}
                    color="#000"
                    style={{ position: "absolute" }}
                    weight="bold"
                />
            )}
        </TouchableOpacity>
    );
}
