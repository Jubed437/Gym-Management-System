// auth.js
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

// DOM Elements
const adminForm = document.getElementById('admin-login-form');
const memberForm = document.getElementById('member-login-form');

// Admin Login Handler
if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value;
        const password = document.getElementById('admin-password').value;

        Logger.info('Attempting Admin Login...', { email });

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Check if user is actually an admin (This logic depends on how we store roles)
            // For now, we assume if they login via this form, we check a "roles" collection or user profile
            // Optimistic redirect for now:
            Logger.info('Admin Login Successful', { uid: user.uid });
            window.location.href = 'admin/dashboard.html';
        } catch (error) {
            Logger.error('Admin Login Failed', error);
            alert('Login failed: ' + error.message);
        }
    });
}

// Member Login Handler
if (memberForm) {
    memberForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('member-email').value;
        const password = document.getElementById('member-password').value;

        Logger.info('Attempting Member Login...', { email });

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            Logger.info('Member Login Successful', { uid: userCredential.user.uid });
            window.location.href = 'member/dashboard.html';
        } catch (error) {
            Logger.error('Member Login Failed', error);
            alert('Login failed: ' + error.message);
        }
    });
}

// Logout Function
window.logout = async () => {
    try {
        await signOut(auth);
        Logger.info('User Logged Out');
        window.location.href = '../index.html';
    } catch (error) {
        Logger.error('Logout Failed', error);
    }
};
