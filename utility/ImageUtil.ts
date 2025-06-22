import { Asset } from 'expo-asset';
import { useImageManipulator } from 'expo-image-manipulator';
import { useEffect, useState } from 'react';

const IMAGE = Asset.fromModule(require('@/assets/images/logo_42_luanda.webp'));

export function useBase64Image() {
    const context = useImageManipulator(IMAGE.uri);
    const [base64Uri, setBase64Uri] = useState<string | null>(null);

    useEffect(() => {
        async function generateBase64() {
            try {
                await IMAGE.downloadAsync();
                const manipulatedImage = await context.renderAsync();
                const result = await manipulatedImage.saveAsync({ base64: true });
                setBase64Uri(`data:image/webp;base64,${result.base64}`);
            } catch (error) {
                console.error('Error:', error);
                setBase64Uri(null);
            }
        }

        generateBase64();
    }, [context]);

    return base64Uri;
}
