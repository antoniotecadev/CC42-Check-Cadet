// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import { initializeAuth as _initializeAuth, getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD8O9wZW4gL6pxWeZ5SLWNtOCSDGiuzZ2E",
    authDomain: "cadet-check-cc42.firebaseapp.com",
    databaseURL: "https://cadet-check-cc42-default-rtdb.firebaseio.com",
    projectId: "cadet-check-cc42",
    storageBucket: "cadet-check-cc42.firebasestorage.app",
    messagingSenderId: "740652323764",
    appId: "1:740652323764:web:254704d43849227e4858e1",
    measurementId: "G-NDMN2ZRHHT",
};

// Initialize Firebase
const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
// initializeAuth + getReactNativePersistence are the supported way to
// initialize auth persistence on React Native environments.
// Guard usage in environments where initializeAuth may not be available.
let auth;

// Resolve getReactNativePersistence at runtime to avoid TypeScript/module
// resolution issues across bundlers. Try the dedicated react-native entry
// first, then the auth package itself. Fall back to no persistence.
let getReactNativePersistenceFn: any = undefined;
try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: require used for dynamic resolution
    const rn = require("firebase/auth/react-native");
    getReactNativePersistenceFn = rn && rn.getReactNativePersistence;
} catch (err) {
    try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: require used for dynamic resolution
        const authMod = require("firebase/auth");
        getReactNativePersistenceFn =
            authMod && authMod.getReactNativePersistence;
    } catch (err2) {
        getReactNativePersistenceFn = undefined;
    }
}

try {
    // If auth provider is already initialized, use existing instance
    // (this avoids auth/already-initialized errors)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { _getProvider } = require("@firebase/app"); // not required, keep simple below

    // Use getAuth to detect initialized provider, but it's safe to call getAuth even if not initialized.
    const maybeAuth = getAuth(app);
    // If provider already initialized, getAuth will return the provider's instance
    if (maybeAuth && maybeAuth.app) {
        auth = maybeAuth;
    } else if (typeof getReactNativePersistenceFn === "function") {
        auth = _initializeAuth(app, {
            persistence: getReactNativePersistenceFn(ReactNativeAsyncStorage),
        });
    } else {
        auth = _initializeAuth(app);
    }
} catch (e: any) {
    // If it's the already-initialized error, use getAuth()
    if (e?.code === "auth/already-initialized") {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { getAuth } = require("firebase/auth");
        auth = getAuth(app);
    } else {
        console.warn(
            "Firebase initializeAuth failed or not supported in this env:",
            e
        );
    }
}
const database = getDatabase(app);

// browserLocalPersistence usa AsyncStorage no React Native (quando disponível), e o firebase web já entende isto automaticamente
// Não precisa instalar @react-native-firebase/app
// setPersistence(auth, browserLocalPersistence).catch(console.error);

export { app, auth, database };

