import { Asset } from "expo-asset";
import { ImageManipulator, manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { useEffect, useState } from "react";

export function useBase64Image() {
    const [base64Uri, setBase64Uri] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function generateBase64() {
            try {
                const IMAGE = Asset.fromModule(
                    require("@/assets/images/logo_42_luanda.png")
                );
                // Ensure the asset is downloaded to a local file URI
                await IMAGE.downloadAsync();
                const localUri = IMAGE.localUri ?? IMAGE.uri;

                // Use manipulateAsync directly; no actions needed to get base64
                const result = await manipulateAsync(localUri, [], {
                    base64: true,
                    format: SaveFormat.PNG,
                });

                if (mounted) {
                    setBase64Uri(result.base64 ? `data:image/png;base64,${result.base64}` : null);
                }
            } catch (error) {
                console.error("Error generating base64 image:", error);
                if (mounted) setBase64Uri(null);
            }
        }

        generateBase64();

        return () => {
            mounted = false;
        };
    }, []);

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
