import { Alert, Platform } from "react-native";

type Callback = () => void;

function isWeb() {
    return Platform.OS === "web";
}

function webAlert(title: string, message?: string) {
    window.alert(`${title}\n\n${message || ""}`);
}

export const showAlert = (title: string, message?: string) => {
    if (isWeb()) {
        webAlert(title, message);
    } else {
        Alert.alert(title, message);
    }
};

function useAlert() {
    const showInfo = (title: string, message?: string) => {
        if (isWeb()) {
            webAlert(title, message);
        } else {
            Alert.alert(title, message);
        }
    };

    const showError = (title: string, message?: string) => {
        showInfo("" + title, message);
    };

    const showSuccess = (title: string, message?: string) => {
        showInfo("" + title, message);
    };

    const showConfirm = (
        title: string,
        message: string,
        onConfirm: Callback,
        onCancel?: Callback
    ) => {
        if (isWeb()) {
            const confirmed = window.confirm(`${title}\n\n${message}`);
            confirmed ? onConfirm() : onCancel?.();
        } else {
            Alert.alert(title, message, [
                { text: "Cancelar", style: "cancel", onPress: onCancel },
                { text: "OK", onPress: onConfirm },
            ]);
        }
    };

    return {
        showInfo,
        showError,
        showSuccess,
        showConfirm,
    };
}

export default useAlert;
