import { Platform } from "react-native";

export type LocalNotificationOptions = {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    requireInteraction?: boolean;
    silent?: boolean;
};

/**
 * Detecta qual navegador está sendo usado
 */
function detectBrowser(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('edg/')) return 'edge';
    if (userAgent.includes('chrome/') && !userAgent.includes('edg/')) return 'chrome';
    if (userAgent.includes('firefox/')) return 'firefox';
    if (userAgent.includes('safari/') && !userAgent.includes('chrome/')) return 'safari';
    
    return 'unknown';
}

/**
 * Detecta se está em modo privado/anônimo
 */
async function isPrivateMode(): Promise<boolean> {
    try {
        // Tenta detectar modo privado usando diferentes métodos
        
        // Método 1: Service Worker (não disponível em modo privado em alguns navegadores)
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.register('/test-sw.js').catch(() => {});
            } catch (e) {
                return true;
            }
        }
        
        // Método 2: IndexedDB (limitado em modo privado)
        if ('indexedDB' in window) {
            try {
                const db = indexedDB.open('test');
                return new Promise((resolve) => {
                    db.onsuccess = () => resolve(false);
                    db.onerror = () => resolve(true);
                });
            } catch (e) {
                return true;
            }
        }
        
        return false;
    } catch (e) {
        return false;
    }
}

/**
 * Exibe uma notificação local no navegador
 * (Somente Web - não funciona no React Native mobile)
 */
export async function showLocalNotification(
    options: LocalNotificationOptions
): Promise<boolean> {
    // Só funciona na web
    if (Platform.OS !== "web") {
        console.warn("Notificações locais só funcionam na web");
        return false;
    }

    // Verifica se o navegador suporta
    if (!("Notification" in window)) {
        console.error("❌ Este navegador não suporta notificações");
        return false;
    }

    // Detecta modo privado
    const privateMode = await isPrivateMode();
    const browser = detectBrowser();
    
    if (privateMode) {
        console.warn("⚠️ Modo privado detectado no", browser);
        console.warn("   Notificações podem não funcionar dependendo do navegador");
        
        // Mensagens específicas por navegador
        if (browser === 'firefox') {
            console.info("💡 Firefox: Se notificações não funcionarem, habilite em about:config");
        } else if (browser === 'safari') {
            console.warn("🚫 Safari: Notificações NÃO funcionam em modo privado");
            return false; // Safari privado não funciona mesmo
        } else if (browser === 'chrome' || browser === 'edge') {
            console.info("✅ Chrome/Edge: Notificações devem funcionar (permissão temporária)");
        }
    }

    // Verifica/solicita permissão
    let permission = Notification.permission;
    
    console.log("🔐 Status da permissão:", permission);

    if (permission === "default") {
        console.log("❓ Solicitando permissão...");
        permission = await Notification.requestPermission();
        console.log("📝 Resposta da permissão:", permission);
    }

    if (permission !== "granted") {
        console.error("❌ Permissão de notificação negada:", permission);
        return false;
    }

    // Cria a notificação
    try {
        console.log("🔔 Criando notificação:", {
            title: options.title,
            body: options.body,
            icon: options.icon || "/icon.png",
            tag: options.tag,
        });

        const notification = new Notification(options.title, {
            body: options.body,
            icon: options.icon || "/icon.png",
            badge: options.badge || "/favicon-32x32.png",
            tag: options.tag || "default",
            data: options.data,
            requireInteraction: options.requireInteraction || false,
            silent: options.silent || false,
        });

        // Evento de clique (opcional)
        notification.onclick = function (event) {
            event.preventDefault();
            window.focus();
            notification.close();

            // Se você passou dados personalizados
            if (options.data?.url) {
                window.location.href = options.data.url;
            }
        };

        console.log("✅ Notificação exibida com sucesso:", options.title);
        return true;
    } catch (error) {
        console.error("❌ Erro ao exibir notificação:", error);
        console.error("   Detalhes do erro:", {
            name: (error as Error).name,
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
        return false;
    }
}

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (Platform.OS !== "web") return false;
    if (!("Notification" in window)) return false;

    const permission = await Notification.requestPermission();
    return permission === "granted";
}

/**
 * Verifica se há permissão para notificações
 */
export function hasNotificationPermission(): boolean {
    if (Platform.OS !== "web") return false;
    if (!("Notification" in window)) return false;
    return Notification.permission === "granted";
}
