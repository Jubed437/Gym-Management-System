import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD_rS84BejBPAfqjZJqIC8IUbkHQ_0rh-4",
    authDomain: "gym-management--system-8d2b7.firebaseapp.com",
    projectId: "gym-management--system-8d2b7",
    storageBucket: "gym-management--system-8d2b7.firebasestorage.app",
    messagingSenderId: "394957842586",
    appId: "1:394957842586:web:0c6891c8f8a23006e8d723",
    measurementId: "G-TMC0G3PWQ4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, analytics, firebaseConfig, app };
