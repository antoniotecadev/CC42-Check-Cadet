import { database } from "@/firebaseConfig";
import { fetchApiKeyFromDatabase } from "@/services/firebaseApiKey";
import { sendNotificationForBackEnd } from "@/services/FirebaseNotification";
import axios from "axios";
import * as Crypto from "expo-crypto";
import { push, ref, remove, set, update } from "firebase/database";
import { useState } from "react";
import { Platform } from "react-native";
import { t } from "../i18n";
import { showAlert } from "./useAlert";

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
 * Generates Cloudinary signature on the client.
 * WARNING: NEVER DO THIS IN PRODUCTION!
 * @param params The upload parameters to be signed.
 * @returns The generated signature.
 */
async function generateCloudinarySignature(
    params: Record<string, any>,
    api_secret: string | null
): Promise<string> {
    // 1. Sort parameters alphabetically by key
    const sortedKeys = Object.keys(params).sort();
    let stringToSign = "";

    // 2. Concatenate key=value pairs
    sortedKeys.forEach((key) => {
        const value = params[key];
        // Cloudinary espera valores booleanos como "true" ou "false" strings
        const formattedValue =
            typeof value === "boolean" ? String(value) : value;
        stringToSign += `${key}=${formattedValue}&`;
    });

    // Remove last '&' and add API Secret
    stringToSign = stringToSign.slice(0, -1) + api_secret;

    console.log("String to be signed:", stringToSign);

    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA1,
        stringToSign
    );

    // 3. Apply SHA-1 hash
    return digest;
}

// Extracts public_id from a Cloudinary URL
function getPublicIdFromUrl(url: string) {
    const match = url.match(/\/([^\/]+)\.[a-z]+$/i);
    const publicId = match ? match[1] : undefined;

    console.log("Original URL:", url);
    console.log("Extracted publicId:", publicId);
    return publicId;
}

/*
        URL: blob:http://localhost:19006/a1b2c3d4...

        It's just a pointer to a Blob object in browser memory.

        It's not a physical file, and cannot be sent directly via FormData.

        So you need to:

            fetch(blobUrl) → to read the bytes

            .blob() → to convert to a real Blob

            new File([blob], ...) → create a File object that FormData understands.
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

// Formats a Date to format: "September 27, 2025 at 07:31 AM"
function formatDateTime(date: Date) {
    try {
        const datePart = date.toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
        });
        const timePart = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
        return `${datePart} at ${timePart}`;
    } catch (e) {
        // Fallback to ISO if something fails
        return date.toISOString();
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

        const timestamp = Math.round(new Date().getTime() / 1000); // Timestamp in seconds

        let publicIdToUse: string | undefined;
        let shouldOverwrite = false;

        if (oldImageUrl) {
            const extractedPublicId = getPublicIdFromUrl(oldImageUrl);
            if (extractedPublicId) {
                publicIdToUse = extractedPublicId;
                shouldOverwrite = true;
                console.log(
                    `Trying to overwrite with public_id: ${publicIdToUse}`
                );
            } else {
                console.warn(
                    `Could not extract public_id from URL: ${oldImageUrl}.`
                );
                throw new Error(
                    t('meals.couldNotExtractPublicId', { url: oldImageUrl })
                );
            }
        } else {
            console.log(
                "No old image URL provided. Performing a new upload."
            );
        }

        // Parameters to be signed
        const paramsToSign: Record<string, any> = {
            timestamp: timestamp,
            folder: `campus/${campusId}/meals`, // Use 'folder' for signed uploads
        };

        if (publicIdToUse) {
            paramsToSign.public_id = publicIdToUse;
        }
        if (shouldOverwrite) {
            paramsToSign.overwrite = true; // Use boolean 'true' for signature
        }
        const CLOUDINARY_API_SECRET = await fetchApiKeyFromDatabase(
            "cloudinary"
        );
        const signature = await generateCloudinarySignature(
            paramsToSign,
            CLOUDINARY_API_SECRET
        );

        // Add all parameters to FormData
        formData.append("file", file as any);
        formData.append("api_key", CLOUDINARY_API_KEY);
        formData.append("timestamp", timestamp.toString()); // Send as string
        formData.append("signature", signature);

        if (publicIdToUse) {
            formData.append("public_id", publicIdToUse);
        }
        if (shouldOverwrite) {
            formData.append("overwrite", "true"); // Send as string "true" for Cloudinary
        }
        formData.append("folder", `campus/${campusId}/meals`); // Send folder

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
            const createdDate = formatDateTime(new Date());
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
            //     showAlert(
            //         "General Error",
            //         "Could not complete notification sending."
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

    // Actualiza apenas a imagem da refeição
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

    // Actualiza todos os dados da refeição (incluindo imagem, se fornecida)
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
            const updatedDate = formatDateTime(new Date());
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
            // Success: notify, delete Cloudinary image, show alert
            if (meal.pathImage) {
                const success = await deleteImageFromCloudinary(meal.pathImage);
                if (!success) {
                    showAlert(t('common.error'), t('meals.imageNotDeleted'));
                }
            }
            showAlert(t('common.success'), t('meals.mealDeletedSuccessfully'));
            onRefresh(false);
        } catch (e: any) {
            showAlert(t('common.error'), t('meals.errorDeletingMeal') + e.message);
        }
    }

    async function deleteImageFromCloudinary(
        imageUrl: string
    ): Promise<boolean> {
        const publicId = getPublicIdFromUrl(imageUrl);

        if (!publicId) {
            console.error(
                "Could not extract public_id from URL:",
                imageUrl
            );
            return false;
        }

        const timestamp = Math.round(new Date().getTime() / 1000); // Timestamp in seconds

        // Parameters to be signed for deletion
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
            console.log(`Trying to delete public_id: ${publicId}`);
            const response = await axios.post(
                CLOUDINARY_DESTROY_URL,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            if (response.data.result === "ok") {
                console.log(
                    `Image with public_id ${publicId} deleted successfully.`
                );
                return true;
            } else {
                console.error(
                    `Failed to delete image ${publicId}:`,
                    response.data
                );
                return false;
            }
        } catch (e: any) {
            console.error(
                "Cloudinary deletion error:",
                e.response ? e.response.data : e.message
            );
            throw e;
        }
    }

    async function onNotifyMeal(
        meal: any,
        campusId: string,
        cursusId: string,
        option: string
    ): Promise<void> {
        const originalType = meal.type;
        const optionLabel = option;

        try {
            if (option === t('meals.secondPortion')) {
                const mealsRef = ref(
                    database,
                    `campus/${campusId}/cursus/${cursusId}/meals/${meal.id}/secondPortion`
                );
                const map = {
                    hasSecondPortion: true,
                    quantitySecondPortion: meal.quantityNotReceived || 0,
                };
                await set(mealsRef, map).then(() => {
                    showAlert(
                        t('common.success'),
                        t('meals.secondPortionAvailable', { name: meal.name })
                    );
                });
            }

            try {
                meal.type = `${originalType}: ${optionLabel}`;
                const topicStudent = `meals_${campusId}_${cursusId}`;
                await sendNotificationForBackEnd(
                    meal,
                    campusId,
                    cursusId,
                    topicStudent,
                    undefined
                );
            } finally {
                meal.type = originalType;
            }
        } catch (e: any) {
            console.error("Error notifying meal:", e);
            showAlert(t('common.error'), e?.message || t('meals.errorSendingNotification'));
            throw e;
        }
    }

    return {
        createMeal,
        updateMealImage,
        updateMealData,
        deleteMealFromFirebase,
        onNotifyMeal,
        loading,
        error,
    };
}
