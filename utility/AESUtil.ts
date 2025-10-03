import CryptoJS from "crypto-js";
import AES from "crypto-js/aes";
import Base64 from "crypto-js/enc-base64";
import Utf8 from "crypto-js/enc-utf8";

const ALGORITHM = "AES";

// Simulates the native function that fetches the secret key
function getSecretKeyFromJNI(): string {
    // WARNING: replace with real secure logic
    return "mR7tP3xL9sQ2vY1z"; // deve ter 16, 24 ou 32 bytes
}

export function encrypt(data: string): string | null {
    try {
        const key = CryptoJS.enc.Utf8.parse(getSecretKeyFromJNI());
        const encrypted = AES.encrypt(data, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7,
        });
        return encrypted.ciphertext.toString(Base64);
    } catch (e) {
        return null;
    }
}

export function decrypt(data: string): string | null {
    try {
        const key = CryptoJS.enc.Utf8.parse(getSecretKeyFromJNI());
        const decrypted = AES.decrypt(
            { ciphertext: Base64.parse(data) } as any,
            key,
            {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7,
            }
        );
        return decrypted.toString(Utf8);
    } catch (e) {
        return null;
    }
}
