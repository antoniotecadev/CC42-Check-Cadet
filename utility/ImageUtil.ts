import { Asset } from "expo-asset";
import {
    ImageManipulator,
    SaveFormat,
    useImageManipulator,
} from "expo-image-manipulator";
import { useEffect, useState } from "react";


export function useBase64Image() {
    const IMAGE = Asset.fromModule(require("@/assets/images/logo_42_luanda.png"));
    const context = useImageManipulator(IMAGE.uri);
    const [base64Uri, setBase64Uri] = useState<string | null>(null);

    useEffect(() => {
        async function generateBase64() {
            try {
                await IMAGE.downloadAsync();
                const manipulatedImage = await context.renderAsync();
                const result = await manipulatedImage.saveAsync({
                    base64: true,
                });
                setBase64Uri(`data:image/png;base64,${result.base64}`);
            } catch (error) {
                console.error("Error:", error);
                setBase64Uri(null);
            }
        }

        generateBase64();
    }, [context]);

    return base64Uri;
}

export async function optimizeImage(imageUri: string) {
    const context = ImageManipulator.manipulate(imageUri);
    context.resize({
        width: 400,
        height: 300,
    });
    const image = await context.renderAsync();
    const result = await image.saveAsync({
        format: SaveFormat.WEBP,
        compress: 0.5,
    });
    return result.uri;
}
