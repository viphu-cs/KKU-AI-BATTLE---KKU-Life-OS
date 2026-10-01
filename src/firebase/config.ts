import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCShCNuD3Z5i3pwBrYDljJLV_kMXc259EY",
  authDomain: "gen-lang-client-0091458005.firebaseapp.com",
  projectId: "gen-lang-client-0091458005",
  storageBucket: "gen-lang-client-0091458005.firebasestorage.app",
  messagingSenderId: "425391494451",
  appId: "1:425391494451:web:53375d57f617e76922da46"
};

const app = initializeApp(firebaseConfig);

// Get Firestore with the custom database ID from firebase-applet-config.json
export const db = getFirestore(app, "ai-studio-46d454fd-cea3-43ae-a2f4-d09758b3694c");
export const auth = getAuth(app);

