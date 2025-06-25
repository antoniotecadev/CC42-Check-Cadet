import { database } from "@/firebaseConfig";
import axios from "axios";
import { push, ref, set, update } from "firebase/database";
import { useState } from "react";

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
    oldImageUrl?: string;
}

export function useCreateMeal() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/cc42/image/upload";
    const CLOUDINARY_UPLOAD_PRESET = "ml_default";

    // Extrai o public_id de uma URL do Cloudinary
    function getPublicIdFromUrl(url: string) {
        // Exemplo: https://res.cloudinary.com/cc42/image/upload/v123/campus/1/meals/abc123.jpg
        const match = url.match(/\/upload\/(?:v\\d+\/)?(.+?)\\.[a-z]+$/i);
        return match ? match[1] : undefined;
    }

    async function uploadImageToCloudinary(
        imageUri: string,
        campusId: string,
        oldImageUrl?: string
    ): Promise<string> {
        const formData = new FormData();
        formData.append("file", {
            uri: imageUri,
            type: "image/jpeg",
            name: "meal.jpg",
        } as any);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        formData.append("folder", `campus/${campusId}/meals`);
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
