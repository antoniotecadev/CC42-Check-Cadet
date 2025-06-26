import * as SecureStore from "expo-secure-store";
import { KJUR } from "jsrsasign"; // Continua sendo necessário para Signature
import { Platform } from "react-native";

// --- Função auxiliar para configurar o Buffer no Expo ---
// Adicione isso no início do seu App.js ou index.js se estiver tendo problemas com Buffer
// import { Buffer } from 'buffer';
// global.Buffer = Buffer;
// --------------------------------------------------------

const SERVICE_ACCOUNT_JSON = {
    type: "service_account",
    project_id: "cadet-check-cc42",
    private_key_id: "SEU_PRIVATE_KEY_ID",
    private_key:
        "-----BEGIN PRIVATE KEY-----\nSEU_PRIVATE_KEY_AQUI_COM_QUEBRAS_DE_LINHA\n-----END PRIVATE KEY-----\n",
    client_email: "SEU_CLIENT_EMAIL@cadet-check-cc42.iam.gserviceaccount.com",
    client_id: "SEU_CLIENT_ID",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
        "https://www.googleapis.com/robot/v1/metadata/x509/SEU_CLIENT_EMAIL.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
};

const TOKEN_URI = SERVICE_ACCOUNT_JSON.token_uri;
const CLIENT_EMAIL = SERVICE_ACCOUNT_JSON.client_email;
const PRIVATE_KEY = SERVICE_ACCOUNT_JSON.private_key;
const SCOPE = "https://www.googleapis.com/auth/firebase.messaging"; // O mesmo escopo que você usou no Java

// Define uma função assíncrona para obter o access token do Google
export const getGoogleAccessToken = async () => {
    try {
        const now = Math.floor(Date.now() / 1000); // Obtém o timestamp actual em segundos

        const cachedExpiry = await getItem("expires_in_google");
        const cachedAccessToken = await getItem("access_token_google");

        if (
            cachedAccessToken &&
            cachedExpiry &&
            now < Number(cachedExpiry) - 60
        ) {
            // 60 segundos de margem de segurança
            return cachedAccessToken;
        }

        const expiry = now + 60 * 60; // Define o tempo de expiração do token para 1 hora a partir de agora

        // Cabeçalho do JWT especificando algoritmo e tipo
        const header = {
            alg: "RS256", // Algoritmo de assinatura RSA SHA-256
            typ: "JWT", // Tipo JWT
        };

        // Payload do JWT com informações exigidas pelo Google
        const payload = {
            iss: CLIENT_EMAIL, // E-mail do serviço (issuer)
            scope: SCOPE, // Escopos de acesso requisitados
            aud: TOKEN_URI, // Destinatário (endpoint do token)
            exp: expiry, // Expiração do token
            iat: now, // Timestamp de emissão
        };

        // Serializa o cabeçalho e o payload para string JSON
        const sHeader = JSON.stringify(header);
        const sPayload = JSON.stringify(payload);

        // Cria e assina o JWT usando a biblioteca jsrsasign e a chave privada
        const finalJwt = KJUR.jws.JWS.sign(
            "RS256", // Algoritmo de assinatura
            sHeader, // Cabeçalho serializado
            sPayload, // Payload serializado
            PRIVATE_KEY // Chave privada para assinar o JWT
        );

        // Corpo da requisição para o endpoint do token do Google
        const requestBody = new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: finalJwt, // Agora usando o JWT gerado com KJUR
        }).toString();

        // Faz a requisição HTTP POST para o endpoint de token do Google
        const response = await fetch(TOKEN_URI, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: requestBody,
        });

        // Se a resposta não for OK, trata o erro e lança uma exceção
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Error response from Google:", errorData);
            throw new Error(
                `Failed to get access token: ${
                    response.status
                } - ${JSON.stringify(errorData)}`
            );
        }

        const data = await response.json();
        await setItem("access_token_google", `${data.access_token}`);
        await setItem(
            "expires_in_google",
            `${now + (data.expires_in || 3600)}`
        );
        return data.access_token;
    } catch (error) {
        console.error("Error in getGoogleAccessToken:", error);
        throw error;
    }
};

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
    return isWeb() ? localStorage.getItem(key) : SecureStore.getItemAsync(key);
}
