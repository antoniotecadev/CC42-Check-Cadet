import { Image } from "react-native";

// Converta o logo para base64 para uso no HTML do PDF
const logoAsset = require("@/assets/images/logo_42_luanda.webp");
export const logoBase64 = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
        const reader = new FileReader();
        reader.onloadend = function () {
            resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = reject;
    xhr.open("GET", Image.resolveAssetSource(logoAsset).uri);
    xhr.responseType = "blob";
    xhr.send();
});
