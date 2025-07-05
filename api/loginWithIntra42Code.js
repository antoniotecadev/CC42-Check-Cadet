// api/loginWithIntra42Code.js

import admin from "firebase-admin";

// Inicializa o Firebase Admin SDK apenas uma vez.
// Isso é crucial para evitar erros em ambientes serverless como o Vercel.
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        );
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL, // Opcional, mas boa prática
        });
    } catch (error) {
        console.error("Erro ao inicializar o Firebase Admin SDK:", error);
        // Em produção, você pode querer lançar um erro ou registrar isso de forma mais robusta.
    }
}

// AUTENTICAÇÃO CUSTOMIZADA NO FIREBASE
// export default async function handler(req, res) {
//     if (req.method !== "POST") {
//         return res.status(405).send("Method Not Allowed");
//     }

//     // Esperamos receber um identificador único do usuário da Intra 42.
//     // Pode ser o 'id', 'login', ou outro que você já esteja usando.
//     const { intra42Id, intra42Staff } = req.body;

//     if (!intra42Id) {
//         return res.status(400).json({ error: "ID da Intra 42 não fornecido." });
//     }

//     // O UID (User ID) do Firebase precisa ser único para cada usuário.
//     // É uma boa prática prefixar para evitar colisões e identificar a fonte da autenticação.
//     const uid = `intra42:${intra42Id}`;

//     try {
//         // 1. Opcional: Salvar ou atualizar informações adicionais do usuário no Realtime Database ou Firestore.
//         // Isso é útil para manter um perfil de usuário associado ao UID do Firebase.
//         // Só faça isso se precisar desses dados no banco de dados.
//         // if (admin.apps.length > 0 && admin.database()) {
//         //     // Verifica se o DB está disponível
//         //     await admin.database().ref(`users/${uid}`).set({
//         //         intra42Id: intra42Id,
//         //         login: intra42Login,
//         //         email: intra42Email,
//         //         lastLogin: admin.database.ServerValue.TIMESTAMP,
//         //     });
//         // }

//         // 2. Gerar o token de autenticação customizado do Firebase.
//         // Você pode adicionar "claims" personalizados aqui.
//         // Claims são informações adicionais sobre o usuário que serão incluídas no token
//         // e podem ser usadas nas regras de segurança do Firebase (ex: admin, premium user).
//         const firebaseToken = await admin.auth().createCustomToken(uid, {
//             role: intra42Staff ? "admin" : "normal",
//             // Adicione outros claims que você possa precisar para suas regras de segurança
//         });

//         // 3. Enviar o token customizado de volta para o cliente (app Expo).
//         res.status(200).json({ firebaseToken });
//     } catch (error) {
//         // console.error(
//         //     "Erro ao gerar o token customizado do Firebase:",
//         //     error.message
//         // );
//         res.status(500).json({
//             error: "Falha ao gerar o token de autenticação customizado.",
//             details: error.message,
//         });
//     }
// }

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
    }

    const { code, redirectUri } = req.body;

    if (!code) {
        return res
            .status(400)
            .json({ error: "Código de autorização não fornecido." });
    }

    try {
        // 1. Trocar code por access_token
        const tokenResponse = await fetch(
            "https://api.intra.42.fr/oauth/token",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "authorization_code",
                    client_id: process.env.INTRA_CLIENT_ID,
                    client_secret: process.env.INTRA_CLIENT_SECRET,
                    code,
                    redirect_uri: redirectUri,
                }),
            }
        );

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error("Erro ao trocar token:", errorData);
            return res
                .status(400)
                .json({ error: "Erro ao obter Access token." });
        }

        const tokenData = await tokenResponse.json();
        const access_token = tokenData.access_token;

        // 2. Buscar os dados do usuário com o token
        const userResponse = await fetch("https://api.intra.42.fr/v2/me", {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        });

        if (!userResponse.ok) {
            return res.status(400).json({ error: "Erro ao buscar usuário." });
        }

        const userData = await userResponse.json();

        // 3. Buscar coalizão
        const coalitionResponse = await fetch(
            `https://api.intra.42.fr/v2/users/${userData.id}/coalitions`,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        const coalitions = await coalitionResponse.json();
        const coalition =
            coalitions && coalitions.length > 0 ? coalitions[0] : null;

        // 3. Juntar os dados
        const userWithCoalition = {
            ...userData,
            coalition,
        };

        // O UID (User ID) do Firebase precisa ser único para cada usuário.
        // É uma boa prática prefixar para evitar colisões e identificar a fonte da autenticação.
        const uid = `intra42:${userData.id}`;
        const isStaff = userData["staff?"] === true;

        // 3. Gerar o token de autenticação customizado do Firebase.
        // Você pode adicionar "claims" personalizados aqui.
        // Claims são informações adicionais sobre o usuário que serão incluídas no token
        // e podem ser usadas nas regras de segurança do Firebase (ex: admin, premium user).
        const firebaseToken = await admin.auth().createCustomToken(uid, {
            role: isStaff ? "admin" : "normal",
            // Adicione outros claims que você possa precisar para suas regras de segurança
        });

        return res.status(200).json({
            message: "Usuário autenticado com sucesso.",
            tokenResponse: tokenData,
            userWithCoalition,
            firebaseToken,
        });
    } catch (error) {
        console.error("Erro ao processar autenticação:", error);
        return res.status(500).json({
            error: "Erro ao processar autenticação.",
            details: error,
        });
    }
}
