import { TouchableOpacity } from "react-native";
import { IconSymbol } from "./IconSymbol";

type Props = {
    onPress?: () => void;
    right?: number;
    bottom?: number;
    width?: number;
    height?: number;
};

export default function FloatActionButton({
    right,
    bottom,
    width,
    height,
    onPress,
}: Props) {
    return (
        <TouchableOpacity
            style={{
                position: "absolute",
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
            onPress={() => {
                // Adicione aqui a ação do botão
                alert();
            }}
        >
            <IconSymbol
                name="qrcode"
                size={28}
                color="#000"
                style={{ position: "absolute" }}
                weight="bold"
            />
        </TouchableOpacity>
    );
}
