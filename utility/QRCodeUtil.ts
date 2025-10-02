import { markAttendance } from "@/repository/eventRepository";
import { subscription } from "@/repository/mealRepository";
import { decrypt } from "./AESUtil";

export interface BarcodeResultParams {
    mealQuantity?: number;
    mealPortion?: "first" | "second";
    eventAction?: "checkin" | "checkout";
    barcodeResult?: string;
    eventId?: string;
    mealId?: string;
    userStaffId?: string;
    registeredBy?: string;
    userId: string;
    displayName: string;
    cursusId: string;
    campusId: string;
    imageSource: string;
    listMealQrCode?: { id: string }[];
    setLoading: (loading: boolean) => void;
    showModal: (options: {
        title: string;
        message: string;
        color: string;
        imageSource?: { uri: string };
        onClose: () => void;
    }) => void;
    onResumeCamera: () => void;
}

export async function handleQrCode({
    mealQuantity,
    mealPortion,
    eventAction,
    barcodeResult,
    eventId,
    mealId,
    userId,
    displayName,
    cursusId,
    campusId,
    imageSource,
    setLoading,
    showModal,
    onResumeCamera,
}: BarcodeResultParams) {
    const result = barcodeResult ? decrypt(barcodeResult) : null;
    if (!eventId && result && result.startsWith("cc42event")) {
        const resultQrCode = result.replace("cc42event", "");
        const partsQrCode = resultQrCode.split("#", 2);
        if (partsQrCode.length === 2) {
            const eventId = partsQrCode[0];
            const userStaffId = partsQrCode[1];
            markAttendance({
                eventId,
                userStaffId,
                registeredBy: userStaffId,
                userId,
                displayName,
                cursusId,
                campusId,
                imageSource,
                eventAction: "checkin",
                setLoading,
                showModal,
                onResumeCamera,
            });
        } else {
            showModal({
                title: "Aviso!",
                message: "QR code inválido",
                color: "#FDD835",
                onClose: onResumeCamera,
            });
        }
    } else if (eventId && result && result.startsWith("cc42user")) {
        const resultQrCode = result.replace("cc42user", "");
        const partsQrCode = resultQrCode.split("#", 6);
        if (partsQrCode.length === 6) {
            const userStaffId = userId;
            const userStudentId = partsQrCode[0];
            const userLogin = partsQrCode[1];
            const userDisplayName = partsQrCode[2];
            const userCursusId = partsQrCode[3];
            const userCampusId = partsQrCode[4];
            const userImageUrl = partsQrCode[5];
            markAttendance({
                eventId,
                userStaffId: undefined, // Não é necessário para na lista de presença
                registeredBy: userStaffId,
                userId: userStudentId,
                displayName: userDisplayName,
                cursusId: userCursusId,
                campusId: userCampusId,
                imageSource: userImageUrl,
                eventAction: eventAction,
                setLoading,
                showModal,
                onResumeCamera,
            });
        } else {
            showModal({
                title: "Aviso!",
                message: "QR code inválido",
                color: "#FDD835",
                onClose: onResumeCamera,
            });
        }
    } else if (!mealId && result && result.startsWith("cc42meal")) {
        const resultQrCode = result.replace("cc42meal", "");
        const partsQrCode = resultQrCode.split("#", 2);
        if (partsQrCode.length === 2) {
            const mealId = partsQrCode[0];
            const userStaffId = partsQrCode[1];
            subscription({
                mealQuantity: 1,
                mealPortion: "first",
                mealId,
                userStaffId,
                registeredBy: userStaffId,
                userId,
                displayName,
                cursusId,
                campusId,
                imageSource,
                setLoading,
                showModal,
                onResumeCamera,
            });
        } else {
            showModal({
                title: "Aviso!",
                message: "QR code inválido",
                color: "#FDD835",
                onClose: onResumeCamera,
            });
        }
    } else if (mealId && result && result.startsWith("cc42user")) {
        const resultQrCode = result.replace("cc42user", "");
        const partsQrCode = resultQrCode.split("#", 6);
        if (partsQrCode.length === 6) {
            const userStaffId = userId;
            const userStudentId = partsQrCode[0];
            const userLogin = partsQrCode[1];
            const userDisplayName = partsQrCode[2];
            const userCursusId = partsQrCode[3];
            const userCampusId = partsQrCode[4];
            const userImageUrl = partsQrCode[5];
            subscription({
                mealQuantity,
                mealPortion,
                mealId,
                userStaffId: undefined, // Não é necessário na lista de assinaturas
                registeredBy: userStaffId,
                userId: userStudentId,
                displayName: userDisplayName,
                cursusId: userCursusId,
                campusId: userCampusId,
                imageSource: userImageUrl,
                setLoading,
                showModal,
                onResumeCamera,
            });
        } else {
            showModal({
                title: "Aviso!",
                message: "QR code inválido",
                color: "#FDD835",
                onClose: onResumeCamera,
            });
        }
    } else if (
        userId &&
        !eventId &&
        !mealId &&
        result &&
        result.startsWith("cc42user")
    ) {
        const resultQrCode = result.replace("cc42user", "");
        const partsQrCode = resultQrCode.split("#", 6);
        if (partsQrCode.length === 6) {
            const userLogin = partsQrCode[1];
            const userDisplayName = partsQrCode[2];
            const userImageUrl = partsQrCode[5];
            showModal({
                title: userLogin,
                message: userDisplayName,
                color: "#4CAF50",
                imageSource: { uri: userImageUrl },
                onClose: onResumeCamera,
            });
        } else {
            showModal({
                title: "Aviso!",
                message: "QR code inválido",
                color: "#FDD835",
                onClose: onResumeCamera,
            });
        }
    } else {
        showModal({
            title: "Aviso!",
            message: "QR code inválido",
            color: "#FDD835",
            onClose: onResumeCamera,
        });
    }
}
