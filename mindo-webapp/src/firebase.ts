import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAVwraS_StUBgUMcwTvn9gA9S1W0qzYy3s",
    authDomain: "mindo-edu.firebaseapp.com",
    projectId: "mindo-edu",
    storageBucket: "mindo-edu.firebasestorage.app",
    messagingSenderId: "266877444338",
    appId: "1:266877444338:web:a45cd77ac964678340306b",
    measurementId: "G-NYH21KRYSN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();