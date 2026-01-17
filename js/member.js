import { db, auth } from '../js/firebase-config.js';
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

// DOM Elements
const welcomeMsg = document.getElementById('welcome-msg');
const billsList = document.getElementById('bills-list');

// Initialize
onAuthStateChanged(auth, async (user) => {
    if (user) {
        Logger.info('Member authenticated', { email: user.email });

        // 1. Get Member Details (to show Name)
        // We need to match Auth Email to Member Collection if checking details
        // Or assume ID matches if we linked them properly.
        // For this demo, let's query members by email.

        let memberId = null;

        try {
            const membersRef = collection(db, "members");
            const q = query(membersRef, where("email", "==", user.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const memberDoc = querySnapshot.docs[0];
                const memberData = memberDoc.data();
                memberId = memberDoc.id;
                welcomeMsg.innerText = `Welcome back, ${memberData.name}!`;

                // 2. Load Bills
                loadBills(memberId);
            } else {
                welcomeMsg.innerText = `Welcome, ${user.email}`;
                billsList.innerHTML = '<p>Member profile not found. Please contact admin.</p>';
            }

        } catch (error) {
            Logger.error('Error fetching member profile', error);
        }

    } else {
        // Not logged in
        window.location.href = '../index.html';
    }
});

async function loadBills(memberId) {
    try {
        const q = query(collection(db, "bills"), where("memberId", "==", memberId));
        const querySnapshot = await getDocs(q);

        billsList.innerHTML = '';

        if (querySnapshot.empty) {
            billsList.innerHTML = '<p>No bills found.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const bill = doc.data();
            const date = new Date(bill.date).toLocaleDateString();

            const billEl = document.createElement('div');
            billEl.className = 'bill-card';
            billEl.innerHTML = `
                <div>
                    <h4>${bill.description}</h4>
                    <small>${date}</small>
                </div>
                <div style="text-align:right">
                    <div style="font-size:1.2rem; font-weight:bold">$${bill.amount}</div>
                    <div class="${bill.status === 'Paid' ? 'bill-status-paid' : 'bill-status-unpaid'}">
                        ${bill.status}
                    </div>
                </div>
            `;
            billsList.appendChild(billEl);
        });

    } catch (error) {
        Logger.error('Error loading bills', error);
        billsList.innerHTML = '<p>Error loading bills.</p>';
    }
}
