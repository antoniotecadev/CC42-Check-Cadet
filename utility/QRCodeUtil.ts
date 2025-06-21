import { markAttendance } from "@/repository/eventRepository";
import { decrypt } from "./AESUtil";

export interface BarcodeResultParams {
    barcodeResult?: string;
    eventId?: string;
    userStaffId?: string;
    registeredBy?: string;
    userId: string;
    displayName: string;
    cursusId: string;
    campusId: string;
    imageSource: string;
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
    barcodeResult,
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
    if (result && result.startsWith("cc42event")) {
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
                setLoading,
                showModal,
                onResumeCamera,
            });
        } else {
            showModal({
                title: "Erro",
                message: "QR code inválido",
                color: "#E53935",
                onClose: onResumeCamera,
            });
        }
    } else {
        showModal({
            title: "Erro",
            message: "QR code inválido",
            color: "#E53935",
            onClose: onResumeCamera,
        });
    }
}
