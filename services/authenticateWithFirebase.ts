import { auth } from "@/firebaseConfig";
import { showAlert } from "@/hooks/useAlert";
import { t } from "@/i18n";

// CASO PRECISE SE AUTENTICAR PARCIALMENTE AO FIREBASE NO BACK-END
// import { signInWithCustomToken } from "firebase/auth";

// // A URL da sua nova Vercel Function
// const GENERATE_FIREBASE_TOKEN_URL =
//     "https://check-cadet.vercel.app/api/generateFirebaseToken";

// export async function authenticateWithFirebase(
//     intra42UserData: any
// ): Promise<boolean> {
//     try {
//         // 1. Envie os dados do usuário Intra 42 para sua Vercel Function
//         const response = await fetch(GENERATE_FIREBASE_TOKEN_URL, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 intra42Id: intra42UserData.id,
//                 intra42Staff: intra42UserData["staff?"] as boolean,
//             }),
//         });

//         const data = await response.json();

//         if (response.ok) {
//             const { firebaseToken } = data;
//             // console.log(
//             //     "Token customizado do Firebase recebido:",
//             //     firebaseToken
//             // );

//             // 2. Use o token customizado para autenticar no Firebase
//             await signInWithCustomToken(auth, firebaseToken);
//             console.log("Autenticado no Firebase com sucesso!");
//             // showAlert("Erro", "Autenticado com sucesso no Firebase!");
//             return true;
//         } else {
//             console.error(
//                 "Erro da Vercel Function ao gerar token Firebase:",
//                 data.error
//             );
//             showAlert(
//                 "Erro",
//                 `Falha ao autenticar no Firebase: ${
//                     data.error || "Erro desconhecido"
//                 }`
//             );
//             return false;
//         }
//     } catch (error) {
//         console.error(
//             "Erro ao chamar a Vercel Function ou autenticar no Firebase:",
//             error
//         );
//         showAlert(
//             "Erro",
//             "Ocorreu um erro inesperado durante a autenticação no Firebase."
//         );
//         return false;
//     }
// }

export const handleLogoutFirebase = async () => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Error signing out:", error);
        showAlert("Sign Out", t('auth.errorSigningOut'));
    }
};
