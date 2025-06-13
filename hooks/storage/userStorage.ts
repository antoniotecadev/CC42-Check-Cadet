import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const prefix = "user_";

export async function saveUser(user: any) {
    const data = JSON.stringify(user);

    if (Platform.OS === "web") {
        localStorage.setItem(prefix + "data", data);
    } else {
        await SecureStore.setItemAsync(prefix + "data", data);
    }
}

export async function getUser() {
    if (Platform.OS === "web") {
        const data = localStorage.getItem(prefix + "data");
        return data ? JSON.parse(data) : null;
    } else {
        const data = await SecureStore.getItemAsync(prefix + "data");
        return data ? JSON.parse(data) : null;
    }
}

export async function clearUser() {
    if (Platform.OS === "web") {
        localStorage.removeItem(prefix + "data");
    } else {
        await SecureStore.deleteItemAsync(prefix + "data");
    }
}
