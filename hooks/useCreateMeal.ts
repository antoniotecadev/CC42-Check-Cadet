import { database } from "@/firebaseConfig";
import { fetchApiKeyFromDatabase } from "@/services/firebaseApiKey";
import { sendNotificationForBackEnd } from "@/services/FirebaseNotification";
import axios from "axios";
import * as Crypto from "expo-crypto";
import { push, ref, remove, set, update } from "firebase/database";
import { useState } from "react";
import { Alert, Platform } from "react-native";

interface MealData {
    name: string;
    type: string;
    description: string;
    quantity: number;
    pathImage?: string;
}

interface CreateMealParams {
    campusId: string;
    cursusId: string;
    campusName: string;
    userId: string;
    meal: MealData;
    imageUri?: string | null;
}

interface UpdateMealParams {
    campusId: string;
    cursusId: string;
    mealId: string;
    meal: MealData;
    imageUri?: string | null;
    oldImageUrl?: string;
}

interface UpdateMealImageParams {
    campusId: string;
    cursusId: string;
    mealId: string;
    imageUri: string;
    oldImageUrl: string;
}

/**
 * Gera a assinatura do Cloudinary no cliente.
 * ATENÇÃO: NUNCA FAÇA ISSO EM PRODUÇÃO!
 * @param params Os parâmetros do upload a serem assinados.
 * @returns A assinatura gerada.
 */
async function generateCloudinarySignature(
    params: Record<string, any>,
    api_secret: string | null
): Promise<string> {
    // 1. Ordene os parâmetros alfabeticamente por chave
    const sortedKeys = Object.keys(params).sort();
    let stringToSign = "";

    // 2. Concatene os pares chave=valor
    sortedKeys.forEach((key) => {
        const value = params[key];
        // Cloudinary espera valores booleanos como "true" ou "false" strings
        const formattedValue =
            typeof value === "boolean" ? String(value) : value;
        stringToSign += `${key}=${formattedValue}&`;
    });

    // Remova o último '&' e adicione o API Secret
    stringToSign = stringToSign.slice(0, -1) + api_secret;

    console.log("String a ser assinada:", stringToSign);

    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA1,
        stringToSign
    );

    // 3. Aplique o hash SHA-1
    return digest;
}

// Extrai o public_id de uma URL do Cloudinary
function getPublicIdFromUrl(url: string) {
    const match = url.match(/\/([^\/]+)\.[a-z]+$/i);
    const publicId = match ? match[1] : undefined;

    console.log("Original URL:", url);
    console.log("Extracted publicId:", publicId);
    return publicId;
}

/*
        URL: blob:http://localhost:19006/a1b2c3d4...

        É apenas um ponteiro para um objeto Blob na memória do navegador.

        Não é um arquivo físico, e não pode ser enviado diretamente por FormData.

        Então, você precisa:

            fetch(blobUrl) → para ler os bytes

            .blob() → para converter em um Blob real

            new File([blob], ...) → criar um objeto File, que o FormData entende.
     */

async function prepareFileForUpload(uri: string) {
    if (Platform.OS === "web") {
        const blob = await fetch(uri).then((res) => res.blob());
        return new File([blob], "meal.jpg", { type: "image/jpeg" });
    } else {
        return {
            uri,
            type: "image/jpeg",
            name: "meal.jpg",
        };
    }
}

export function useCreateMeal() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const CLOUDINARY_API_KEY = "926854887914134";
    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/cc42/image/upload";
    const CLOUDINARY_DESTROY_URL = `https://api.cloudinary.com/v1_1/cc42/image/destroy`;

    async function uploadImageToCloudinary(
        imageUri: string,
        campusId: string,
        oldImageUrl?: string
    ): Promise<string> {
        const file = await prepareFileForUpload(imageUri);
        const formData = new FormData();

        const timestamp = Math.round(new Date().getTime() / 1000); // Carimbo de data/hora em segundos

        let publicIdToUse: string | undefined;
        let shouldOverwrite = false;

        if (oldImageUrl) {
            const extractedPublicId = getPublicIdFromUrl(oldImageUrl);
            if (extractedPublicId) {
                publicIdToUse = extractedPublicId;
                shouldOverwrite = true;
                console.log(
                    `Tentando sobrescrever com public_id: ${publicIdToUse}`
                );
            } else {
                console.warn(
                    `Não foi possível extrair o public_id da URL: ${oldImageUrl}.`
                );
                throw new Error(
                    `Não foi possível extrair o public_id da URL: ${oldImageUrl}.`
                );
            }
        } else {
            console.log(
                "Nenhuma URL de imagem antiga fornecida. Realizando um novo upload."
            );
        }

        // Parâmetros que serão assinados
        const paramsToSign: Record<string, any> = {
            timestamp: timestamp,
            folder: `campus/${campusId}/meals`, // Use 'folder' para uploads assinados
        };

        if (publicIdToUse) {
            paramsToSign.public_id = publicIdToUse;
        }
        if (shouldOverwrite) {
            paramsToSign.overwrite = true; // Use o booleano 'true' para a assinatura
        }
        const CLOUDINARY_API_SECRET = await fetchApiKeyFromDatabase(
            "cloudinary"
        );
        const signature = await generateCloudinarySignature(
            paramsToSign,
            CLOUDINARY_API_SECRET
        );

        // Adicione todos os parâmetros ao FormData
        formData.append("file", file as any);
        formData.append("api_key", CLOUDINARY_API_KEY);
        formData.append("timestamp", timestamp.toString()); // Envie como string
        formData.append("signature", signature);

        if (publicIdToUse) {
            formData.append("public_id", publicIdToUse);
        }
        if (shouldOverwrite) {
            formData.append("overwrite", "true"); // Envie como string "true" para o Cloudinary
        }
        formData.append("folder", `campus/${campusId}/meals`); // Envie a pasta

        try {
            const response = await axios.post(CLOUDINARY_URL, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data.secure_url;
        } catch (e: any) {
            console.error(
                "Cloudinary upload/update failed:",
                e.response ? e.response.data : e.message
            );
            throw e;
        }
    }

    async function createMeal({
        campusId,
        cursusId,
        campusName,
        userId,
        meal,
        imageUri,
    }: CreateMealParams) {
        setLoading(true);
        setError(null);
        try {
            let imageUrl = "";
            if (imageUri) {
                imageUrl = await uploadImageToCloudinary(imageUri, campusId);
            }
            const mealsRef = ref(
                database,
                `campus/${campusId}/cursus/${cursusId}/meals`
            );
            const mealId = push(mealsRef).key;
            const createdDate = new Date().toISOString();
            const mealData = {
                id: mealId,
                name: meal.name,
                type: meal.type,
                description: meal.description,
                quantity: meal.quantity,
                pathImage: imageUrl,
                createdDate,
                numberSubscribed: 0,
                isSubscribed: false,
                createdBy: userId,
            };
            await set(
                ref(
                    database,
                    `campus/${campusId}/cursus/${cursusId}/meals/${mealId}`
                ),
                mealData
            );

            const topicStudent = `meals_${campusId}_${cursusId}`;
            const topicStaff = `meals_${campusId}_${campusName}`;
            const topics = [topicStudent, topicStaff];
            const condition = topics
                .map((topic) => `'${topic}' in topics`)
                .join(" || ");

            await sendNotificationForBackEnd(
                mealData,
                campusId,
                cursusId,
                undefined, // O campo 'topic' deve ser null quando se usa 'condition'
                condition
            );

            // try {
            // ENVIA NOTIFICAÇÃO SOLICITANDO TOKEN DE ACESSO AO GOOGLE NO CLIENT
            // const accessToken = await getGoogleAccessToken();
            // console.log("Obtained Access Token:", accessToken);

            // await sendNotificationForTopicDirect(
            //     accessToken,
            //     mealData,
            //     campusId,
            //     cursusId,
            //     undefined, // O campo 'topic' deve ser null quando se usa 'condition'
            //     condition
            // );
            // } catch (error) {
            //     Alert.alert(
            //         "Erro Geral",
            //         "Não foi possível completar o envio da notificação."
            //     );
            // }
            setLoading(false);
            return mealData;
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
            throw e;
        }
    }

    // Atualiza apenas a imagem da refeição
    async function updateMealImage({
        campusId,
        cursusId,
        mealId,
        imageUri,
        oldImageUrl,
    }: UpdateMealImageParams) {
        setLoading(true);
        setError(null);
        try {
            const imageUrl = await uploadImageToCloudinary(
                imageUri,
                campusId,
                oldImageUrl
            );
            await update(
                ref(
                    database,
                    `campus/${campusId}/cursus/${cursusId}/meals/${mealId}`
                ),
                { pathImage: imageUrl }
            );
            setLoading(false);
            return imageUrl;
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
            throw e;
        }
    }

    // Atualiza todos os dados da refeição (incluindo imagem, se fornecida)
    async function updateMealData({
        campusId,
        cursusId,
        mealId,
        meal,
        imageUri,
        oldImageUrl,
    }: UpdateMealParams) {
        setLoading(true);
        setError(null);
        try {
            let imageUrl = oldImageUrl || "";
            if (imageUri && imageUri !== oldImageUrl) {
                imageUrl = await uploadImageToCloudinary(
                    imageUri,
                    campusId,
                    oldImageUrl
                );
            }
            const updatedDate = new Date().toISOString();
            const updates: any = {
                name: meal.name,
                type: meal.type,
                description: meal.description,
                quantity: meal.quantity,
                updatedDate,
            };
            if (imageUrl) updates.pathImage = imageUrl;
            await update(
                ref(
                    database,
                    `campus/${campusId}/cursus/${cursusId}/meals/${mealId}`
                ),
                updates
            );
            setLoading(false);
            return updates;
        } catch (e: any) {
            setError(e.message);
            setLoading(false);
            throw e;
        }
    }

    async function deleteMealFromFirebase(
        campusId: string,
        cursusId: string,
        meal: { id: string; pathImage?: string },
        onRefresh: (doRefresh: boolean) => void
    ) {
        const mealRef = ref(
            database,
            `campus/${campusId}/cursus/${cursusId}/meals/${meal.id}`
        );

        try {
            await remove(mealRef);
            // Sucesso: notifique, delete imagem do Cloudinary, mostre alerta
            if (meal.pathImage) {
                const success = await deleteImageFromCloudinary(meal.pathImage);
                if (!success) {
                    Alert.alert("Erro", "Imagem não eliminada", [
                        { text: "OK" },
                    ]);
                }
            }
            Alert.alert("Sucesso", "Refeição eliminada com sucesso!", [
                { text: "OK" },
            ]);
            onRefresh(false);
        } catch (e: any) {
            Alert.alert("Erro", "Erro ao eliminar refeição: " + e.message, [
                { text: "OK" },
            ]);
        }
    }

    async function deleteImageFromCloudinary(
        imageUrl: string
    ): Promise<boolean> {
        const publicId = getPublicIdFromUrl(imageUrl);

        if (!publicId) {
            console.error(
                "Não foi possível extrair o public_id da URL:",
                imageUrl
            );
            return false;
        }

        const timestamp = Math.round(new Date().getTime() / 1000); // Carimbo de data/hora em segundos

        // Parâmetros que serão assinados para a deleção
        const paramsToSign: Record<string, any> = {
            public_id: publicId,
            timestamp: timestamp,
        };
        const CLOUDINARY_API_SECRET = await fetchApiKeyFromDatabase(
            "cloudinary"
        );
        const signature = await generateCloudinarySignature(
            paramsToSign,
            CLOUDINARY_API_SECRET
        );

        const formData = new FormData();
        formData.append("public_id", publicId);
        formData.append("api_key", CLOUDINARY_API_KEY);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);

        try {
            console.log(`Tentando excluir public_id: ${publicId}`);
            const response = await axios.post(
                CLOUDINARY_DESTROY_URL,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            if (response.data.result === "ok") {
                console.log(
                    `Imagem com public_id ${publicId} excluída com sucesso.`
                );
                return true;
            } else {
                console.error(
                    `Falha ao excluir imagem ${publicId}:`,
                    response.data
                );
                return false;
            }
        } catch (e: any) {
            console.error(
                "Erro na deleção do Cloudinary:",
                e.response ? e.response.data : e.message
            );
            throw e;
        }
    }

    return {
        createMeal,
        updateMealImage,
        updateMealData,
        deleteMealFromFirebase,
        loading,
        error,
    };
}
