// Import the functions you need from the SDKs you need
import { getApps, initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { Platform } from 'react-native';

// Importa o auth do Firebase JS SDK para a web
import { getAuth as getWebAuth } from 'firebase/auth';

// Importa o auth do @react-native-firebase para mobile
import getNativeAuth from '@react-native-firebase/auth';

// Com @react-native-firebase/auth, você simplesmente importa e usa a instância padrão.
// A persistência é gerenciada automaticamente para plataformas nativas.
// Se você precisar de autenticação web no mesmo código, precisaria de uma lógica condicional
// para importar o SDK JS para web.

// ---

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

// Declaração da variável 'auth' com um tipo flexível para acomodar ambos
let auth: any; // Usamos 'any' aqui para flexibilidade entre os tipos de auth

if (Platform.OS === "web") {
  // Para a web, usamos o Firebase JS SDK
  auth = getWebAuth(app);
} else {
  // Para React Native (iOS/Android), usamos @react-native-firebase/auth
  auth = getNativeAuth();
  // Não precisamos configurar persistência com getReactNativePersistence aqui,
  // pois @react-native-firebase já lida com isso nativamente.
}

export { app, auth, database };

