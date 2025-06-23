import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export default function useItemStorage() {
    function isWeb() {
        return Platform.OS === "web";
    }

    async function setItem(key: string, value: string) {
        if (isWeb()) {
            localStorage.setItem(key, value);
        } else {
            await SecureStore.setItemAsync(key, value);
        }
    }

    async function getItem(key: string): Promise<string | null> {
        return isWeb()
            ? localStorage.getItem(key)
            : SecureStore.getItemAsync(key);
    }

    async function removeItem(key: string) {
        if (isWeb()) {
            localStorage.removeItem(key);
        } else {
            await SecureStore.deleteItemAsync(key);
        }
    }
    return {
        setItem,
        getItem,
        removeItem,
        isWeb,
    };
}
