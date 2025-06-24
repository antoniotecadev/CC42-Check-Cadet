import { database } from "@/firebaseConfig";
import axios from "axios";
import { push, ref, set } from "firebase/database";
import { useState } from "react";

interface CreateMealParams {
    campusId: string;
    cursusId: string;
    userId: string;
    meal: {
        name: string;
        type: string;
        description: string;
        quantity: number;
        pathImage?: string;
    };
    imageUri?: string | null;
}

export function useCreateMeal() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Substitua por suas credenciais Cloudinary
    const CLOUDINARY_URL =
        "https://api.cloudinary.com/v1_1/<SEU_CLOUD_NAME>/image/upload";
    const CLOUDINARY_UPLOAD_PRESET = "<SEU_UPLOAD_PRESET>";

    async function uploadImageToCloudinary(imageUri: string): Promise<string> {
        const formData = new FormData();
        formData.append("file", {
            uri: imageUri,
            type: "image/jpeg",
            name: "meal.jpg",
        } as any);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
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
                imageUrl = await uploadImageToCloudinary(imageUri);
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

    return { createMeal, loading, error };
}
