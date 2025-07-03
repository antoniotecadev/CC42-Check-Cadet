// api/notifications.js

import { KJUR } from "jsrsasign";

const SERVICE_ACCOUNT_JSON = {
    type: "service_account",
    project_id: "cadet-check-cc42",
    private_key_id: "e9bf5bc43c0b4f78c519e7abb276e94503e36327",
    client_email: "firebase-messaging@cadet-check-cc42.iam.gserviceaccount.com",
    client_id: "108330644593536930546",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
        "https://www.googleapis.com/robot/v1/metadata/x509/firebase-messaging%40cadet-check-cc42.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
};

const TOKEN_URI = SERVICE_ACCOUNT_JSON.token_uri;
const CLIENT_EMAIL = SERVICE_ACCOUNT_JSON.client_email;
const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";

let cachedAccessToken = null;
let tokenExpirationTime = 0; // Timestamp em milissegundos

// Função para obter o access token do Google
const getGoogleAccessToken = async () => {
    try {
        const now = Math.floor(Date.now() / 1000);

        if (
            cachedAccessToken &&
            tokenExpirationTime &&
            now < tokenExpirationTime - 60
        ) {
            // 60 segundos de margem de segurança
            return cachedAccessToken;
        }

        const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY.replace(
            /\\n/g,
            "\n"
        );

        if (!PRIVATE_KEY) {
            throw new Error("PRIVATE_KEY is not available. Cannot sign JWT.");
        }

        // Cabeçalho e payload para JWT
        const header = { alg: "RS256", typ: "JWT" };
        const payload = {
            iss: CLIENT_EMAIL, // E-mail do serviço (issuer)
            scope: SCOPE, // Escopos de acesso requisitados
            aud: TOKEN_URI, // Destinatário (endpoint do token)
            exp: now + 3600, // Expira em 1 hora
            iat: now, // Timestamp de emissão
        };

        const sHeader = JSON.stringify(header);
        const sPayload = JSON.stringify(payload);

        // Criação do JWT com a chave privada
        const finalJwt = KJUR.jws.JWS.sign(
            "RS256",
            sHeader,
            sPayload,
            PRIVATE_KEY
        );

        const requestBody = new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: finalJwt,
        }).toString();

        const response = await fetch(TOKEN_URI, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: requestBody,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Failed to get access token: ${
                    response.status
                } - ${JSON.stringify(errorData)}`
            );
        }

        const data = await response.json();
        cachedAccessToken = data.access_token;
        tokenExpirationTime = now + (data.expires_in || 3600); // Expira 1 minuto antes
        return data.access_token;
    } catch (error) {
        console.error("Error in getGoogleAccessToken:", error);
        throw error;
    }
};

// Função principal para enviar a notificação
export default async function handler(req, res) {
    if (req.method === "POST") {
        try {
            // Obter dados da mensagem enviada apartir do cliente
            const fcmMessage = req.body;

            // Obtenha o token de acesso do Google
            const accessToken = await getGoogleAccessToken();

            const PROJECT_ID = "cadet-check-cc42";
            const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

            const response = await fetch(FCM_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(fcmMessage),
            });

            if (response.ok) {
                res.status(200).json({
                    message: "Notification sent successfully!",
                });
            } else {
                const errorData = await response.json();
                res.status(response.status).json({ error: errorData });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(405).json({ error: "Method Not Allowed" });
    }
}
