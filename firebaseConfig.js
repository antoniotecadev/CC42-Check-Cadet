// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

// Configurar a persistência do Firebase Authentication
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

export { app, auth, database };

