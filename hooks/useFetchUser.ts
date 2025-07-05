// import { useColorCoalition } from "@/components/ColorCoalitionContext";
// import { Colors } from "@/constants/Colors";
// import { authenticateWithFirebase } from "@/services/authenticateWithFirebase";
// import { registerPushToken } from "@/services/ExpoNotificationService";
// import axios from "axios";
// import { Platform } from "react-native";
// import useItemStorage from "./storage/useItemStorage";
// import useTokenStorage from "./storage/useTokenStorage";
// import useUserStorage from "./storage/useUserStorage";
// import useAlert from "./useAlert";
// QUANDO FOR PARA FAZER LOGIN NO CLIENTE
// const useFetchUser = () => {
//     const { showError } = useAlert();
//     const { setItem } = useItemStorage();
//     const { setColor } = useColorCoalition();
//     const { saveUser } = useUserStorage();
//     const { getAccessToken } = useTokenStorage();

//     const fetchUser = async (): Promise<boolean> => {
//         try {
//             const accessToken = await getAccessToken();

//             if (!accessToken) {
//                 showError("Erro", "Token não encontrado");
//                 return false;
//             }

//             // 1. Buscar usuário
//             const userResponse = await axios.get(
//                 "https://api.intra.42.fr/v2/me",
//                 {
//                     headers: {
//                         Authorization: `Bearer ${accessToken}`,
//                     },
//                 }
//             );

//             const userData = userResponse.data;

//             // 2. Buscar coalizão
//             const coalitionResponse = await axios.get(
//                 `https://api.intra.42.fr/v2/users/${userData.id}/coalitions`,
//                 {
//                     headers: {
//                         Authorization: `Bearer ${accessToken}`,
//                     },
//                 }
//             );

//             const coalitions = coalitionResponse.data;
//             const coalition =
//                 coalitions && coalitions.length > 0 ? coalitions[0] : null;

//             // 3. Juntar os dados
//             const staff = userData["staff?"];
//             const userWithCoalition = {
//                 ...userData,
//                 coalition,
//             };

//             if (!authenticateWithFirebase(userData)) return false;

//             setColor(coalition?.color?.trim() || Colors.light_blue_900.default);
//             // 4. Salvar localmente
//             await saveUser(userWithCoalition);
//             if (staff as boolean) await setItem("staff", `${staff}`);
//             await setItem("user_id", `${userWithCoalition.id}`);
//             await setItem(
//                 "campus_id",
//                 `${userWithCoalition?.campus?.[0]?.id ?? 0}`
//             );
//             await setItem(
//                 "campus_name",
//                 `${userWithCoalition.campus?.[0]?.name?.trim()}`
//             );
//             if (Platform.OS === "ios") {
//                 registerPushToken(
//                     userWithCoalition.id,
//                     userWithCoalition["staff?"] as boolean,
//                     userWithCoalition?.campus?.[0]?.id,
//                     userWithCoalition?.projects_users?.[0]?.cursus_ids?.[0]
//                 );
//             }
//             return true;
//         } catch (e: any) {
//             showError("Erro", "Erro ao buscar dados do usuário: " + e.message);
//             console.error(e);
//             return false;
//         }
//     };
//     return { fetchUser };
// };
// export default useFetchUser;
