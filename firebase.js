// Firebase setup for StudyFlow / DoListic.
// This one config works for web AND the Expo mobile app — no separate
// Android/iOS registration needed since we use the Firebase JS SDK.
import { Platform } from "react-native";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCq2mr2k6Gs3ZUSK2IMkn6kn2blRHQN3hY",
  authDomain: "dolistic.firebaseapp.com",
  projectId: "dolistic",
  storageBucket: "dolistic.firebasestorage.app",
  messagingSenderId: "1062337269011",
  appId: "1:1062337269011:web:f9e6854273070b0f1adee6",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth persistence differs by platform: web handles it automatically,
// native (Expo Go on phone) needs AsyncStorage wired in explicitly so
// the person stays logged in between app opens.
let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

const db = getFirestore(app);

export { app, auth, db };
