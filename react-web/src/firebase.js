// Firebase setup for StudyFlow / DoListic (React web version).
// Same project config as the Expo app — on the web, Firebase Auth
// persists the session in the browser automatically.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCq2mr2k6Gs3ZUSK2IMkn6kn2blRHQN3hY",
  authDomain: "dolistic.firebaseapp.com",
  projectId: "dolistic",
  storageBucket: "dolistic.firebasestorage.app",
  messagingSenderId: "1062337269011",
  appId: "1:1062337269011:web:f9e6854273070b0f1adee6",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
