import { database } from "@/firebaseConfig";
import { useLocalNotification } from "@/hooks/useLocalNotification";
import {
    limitToLast,
    onChildAdded,
    onValue,
    query,
    ref,
} from "firebase/database";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

type UseFirebaseNotificationListenerProps = {
    campusId: string | number;
    cursusId: string | number;
    enabled?: boolean;
};

/**
 * Hook para ouvir mudanças no Firebase e exibir notificações locais
 * Baseado na lógica do Electron (firebase-listener.js)
 */
export function useFirebaseNotificationListener({
    campusId,
    cursusId,
    enabled = true,
}: UseFirebaseNotificationListenerProps) {
    const { notify, hasPermission, isSupported } = useLocalNotification();
    const mealCallCountRef = useRef(0);
    const messageCallCountRef = useRef(0);
    const secondPortionListenersRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        // Só funciona na web e se estiver habilitado
        if (Platform.OS !== "web" || !enabled || !campusId || !cursusId || !isSupported || !hasPermission) {
            return;
        }

        const initTimestamp = new Date().toISOString();
        console.log(
            "� [INIT]",
            initTimestamp,
            "Iniciando listeners Firebase para notificações web..."
        );
        console.log(`   Campus: ${campusId}, Cursus: ${cursusId}`);

        // ========================================
        // LISTENER DE REFEIÇÕES
        // ========================================
        const mealsPath = `campus/${campusId}/cursus/${cursusId}/meals`;
        const mealsRef = ref(database, mealsPath);
        const recentMealsQuery = query(mealsRef, limitToLast(1));

        const unsubscribeMeals = onChildAdded(recentMealsQuery, (snapshot) => {
            const meal = snapshot.val();
            const mealId = snapshot.key;

            if (!meal) return;

            // Incrementa contador
            mealCallCountRef.current++;

            // Ignora a primeira chamada (última refeição existente)
            if (mealCallCountRef.current === 1) {
                console.log(`⏭️ Primeira refeição ignorada: ${meal.name}`);
                // Configura listener para secondPortion
                setupSecondPortionListener(mealId, meal.name, meal.type);
                return;
            }

            // A partir da segunda chamada, mostra notificação
            console.log("➕ Nova refeição detectada:", meal.name);
            showMealNotification(meal);

            // Configura listener para secondPortion
            setupSecondPortionListener(mealId, meal.name, meal.type);
        });

        // ========================================
        // LISTENER DE MENSAGENS
        // ========================================
        const messagesPath = `campus/${campusId}/cursus/${cursusId}/messages`;
        const messagesRef = ref(database, messagesPath);
        const recentMessagesQuery = query(messagesRef, limitToLast(1));

        const unsubscribeMessages = onChildAdded(
            recentMessagesQuery,
            (snapshot) => {
                const message = snapshot.val();

                if (!message) return;

                // Incrementa contador
                messageCallCountRef.current++;

                const callNumber = messageCallCountRef.current;
                const messageId = snapshot.key;

                console.log(
                    `📨 [MSG-${callNumber}] ID: ${messageId}, Título: ${message.title}`
                );

                // Ignora a primeira chamada (última mensagem existente)
                if (messageCallCountRef.current === 1) {
                    console.log(
                        `⏭️ Primeira mensagem ignorada: ${message.title}`
                    );
                    return;
                }

                // A partir da segunda chamada, mostra notificação
                console.log("💬 Nova mensagem detectada:", message.title);
                showMessageNotification(message);
            }
        );

        // ========================================
        // FUNÇÕES DE NOTIFICAÇÃO
        // ========================================

        function showMealNotification(meal: any) {
            const title = `${meal.name}`;

            const bodyParts = [
                `${meal.type}`,
                meal.description ? `${meal.description}` : "",
                `${meal.createdDate}`,
            ].filter((line) => line);

            const body = bodyParts.join("\n");

            notify({
                title: title,
                body: body,
                icon: "/icon.png",
                tag: `meal-${meal.id || Date.now()}`,
                requireInteraction: true, // Não desaparece automaticamente
            });

            console.log(`✅ Notificação de refeição: ${title}`);
        }

        function showMessageNotification(message: any) {
            const title = `💬 ${message.title}`;
            const body = message.message;

            notify({
                title: title,
                body: body,
                icon: "/icon.png",
                tag: `message-${message.id || Date.now()}`,
                requireInteraction: true,
            });

            console.log(`✅ Notificação de mensagem: ${message.title}`);
        }

        function showSecondPortionNotification(
            mealName: string,
            mealType: string
        ) {
            const title = `🍽️ ${mealType}: Segunda Via`;
            const body = `${mealName}`;

            notify({
                title: title,
                body: body,
                icon: "/icon.png",
                tag: `second-portion-${Date.now()}`,
                requireInteraction: true,
            });

            console.log(`✅ Notificação de segunda via: ${mealName}`);
        }

        // ========================================
        // LISTENER DE SEGUNDA PORÇÃO
        // ========================================
        function setupSecondPortionListener(
            mealId: string | null,
            mealName: string,
            mealType: string
        ) {
            if (!mealId) return;

            // Evita criar múltiplos listeners para a mesma refeição
            if (secondPortionListenersRef.current.has(mealId)) {
                return;
            }

            secondPortionListenersRef.current.add(mealId);

            const secondPortionPath = `campus/${campusId}/cursus/${cursusId}/meals/${mealId}/secondPortion`;
            const secondPortionRef = ref(database, secondPortionPath);

            console.log(
                `👀 Monitorando secondPortion para: ${mealName} (ID: ${mealId})`
            );

            let hasProcessed = false;

            onValue(secondPortionRef, (snapshot) => {
                if (!snapshot.exists()) return;

                const secondPortion = snapshot.val();
                const hasSecondPortion = secondPortion.hasSecondPortion;

                // Se já processamos, ignora
                if (hasProcessed) return;

                // Se hasSecondPortion for true
                if (hasSecondPortion === true) {
                    console.log(`🍽️ Segunda via DISPONÍVEL para: ${mealName}`);
                    showSecondPortionNotification(mealName, mealType);
                    hasProcessed = true;
                }
            });
        }

        // Cleanup
        return () => {
            console.log("🧹 Limpando listeners Firebase...");
            // Os listeners do Firebase SDK v9+ são limpos automaticamente
            // quando o componente desmonta, mas você pode fazer cleanup manual se necessário
            secondPortionListenersRef.current.clear();
            mealCallCountRef.current = 0;
            messageCallCountRef.current = 0;
        };
    }, [campusId, cursusId, enabled]);

    return {
        // Retorna informações úteis se necessário
        isListening: enabled && Platform.OS === "web",
    };
}
