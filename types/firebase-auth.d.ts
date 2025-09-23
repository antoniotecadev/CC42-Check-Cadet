// Tipagem mínima para suprimir o erro:
// "Module '"firebase/auth"' has no exported member 'getReactNativePersistence'"
// Esta declaração apenas informa ao TypeScript que a função existe — o runtime
// continua a ser o responsável pela resolução via `firebase/auth/react-native`.
declare module "firebase/auth" {
    /**
     * Retorna um provedor de persistência para React Native que usa AsyncStorage.
     * Tipo `any` por compatibilidade; ajuste se desejar tipos mais estritos.
     */
    export function getReactNativePersistence(storage: any): any;
    /**
     * Inicializa o Auth para o app fornecido (React Native support).
     * Tipagem mínima: use `any` para compatibilidade.
     */
    export function initializeAuth(app: any, options?: any): any;
    /**
     * Retorna instância do Auth (compat fallback).
     */
    export function getAuth(app?: any): any;
    /**
     * Faz login no Firebase usando um token customizado (JWT gerado pelo backend).
     * Tipagem mínima: use `any` para compatibilidade.
     */
    export function signInWithCustomToken(auth: any, token: string): Promise<any>;
}
