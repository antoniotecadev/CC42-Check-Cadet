import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const useUserStorage = () => {
    const prefix = "user_";

    async function saveUser(user: any) {
        const data = JSON.stringify(user);

        if (Platform.OS === "web") {
            localStorage.setItem(prefix + "data", data);
        } else {
            await AsyncStorage.setItem(prefix + "data", data);
        }
    }

    async function getUser() {
        if (Platform.OS === "web") {
            const data = localStorage.getItem(prefix + "data");
            return data ? JSON.parse(data) : null;
        } else {
            const data = await AsyncStorage.getItem(prefix + "data");
            return data ? JSON.parse(data) : null;
        }
    }

    async function clearUser() {
        if (Platform.OS === "web") {
            localStorage.removeItem(prefix + "data");
        } else {
            await AsyncStorage.removeItem(prefix + "data");
        }
    }
    return { saveUser, getUser, clearUser };
};
export default useUserStorage;
