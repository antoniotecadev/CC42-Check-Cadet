import { database } from "@/firebaseConfig";
import { getGoogleAccessToken } from "@/services/AccessTokenGeneratorRN";
import { sendNotificationForTopicDirect } from "@/services/FirebaseNotification";
import axios from "axios";
import { push, ref, set, update } from "firebase/database";
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

export function useCreateMeal() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/cc42/image/upload";
    const CLOUDINARY_UPLOAD_PRESET = "ml_default";

    // Extrai o public_id de uma URL do Cloudinary
    function getPublicIdFromUrl(url: string) {
        const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-z]+$/i);
        // const match = url.match(/\/([^\/]+)\.[a-z]+$/i);
        return match ? match[1] : undefined;
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

    async function uploadImageToCloudinary(
        imageUri: string,
        campusId: string,
        oldImageUrl?: string
    ): Promise<string> {
        const file = await prepareFileForUpload(imageUri);
        const formData = new FormData();
        formData.append("file", file as any);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("asset_folder", `campus/${campusId}/meals`);
        if (oldImageUrl) {
            const publicId = getPublicIdFromUrl(oldImageUrl);
            if (publicId) {
                formData.append("public_id", publicId);
                formData.append("overwrite", "true");
            }
        }
        const response = await axios.post(CLOUDINARY_URL, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data.secure_url;
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

            try {
                const accessToken = await getGoogleAccessToken();
                console.log("Obtained Access Token:", accessToken);

                await sendNotificationForTopicDirect(
                    accessToken,
                    mealData,
                    campusId,
                    cursusId,
                    undefined, // O campo 'topic' deve ser null quando se usa 'condition'
                    condition
                );
            } catch (error) {
                Alert.alert(
                    "Erro Geral",
                    "Não foi possível completar o envio da notificação."
                );
            }
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

    return { createMeal, updateMealImage, updateMealData, loading, error };
}
