// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { Platform } from "react-native";

// Importa o auth do Firebase JS SDK da web
import {
    getAuth,
    getReactNativePersistence,
    initializeAuth,
} from "firebase/auth";

// ignora tipos — força o runtime a usar as exports que existem
const { setPersistence, browserLocalPersistence } =
    require("firebase/auth") as any;

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

let auth: any;
if (Platform.OS === "web") {
    // Navegador
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence);
} else {
    // React Native
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
}
const database = getDatabase(app);

// browserLocalPersistence usa AsyncStorage no React Native (quando disponível), e o firebase web já entende isto automaticamente
// Não precisa instalar @react-native-firebase/app
// setPersistence(auth, browserLocalPersistence).catch(console.error);

export { app, auth, database };

