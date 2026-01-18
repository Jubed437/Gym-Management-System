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
                
                // Update welcome message
                if (welcomeMsg) welcomeMsg.innerText = `Welcome back, ${memberData.name}!`;
                
                // Update sidebar name
                const memberNameEl = document.getElementById('member-name');
                if (memberNameEl) memberNameEl.innerText = memberData.name;
                
                // Populate overview stats - with safe checks
                const emailEl = document.getElementById('member-email');
                const phoneEl = document.getElementById('member-phone');
                const packageEl = document.getElementById('member-package');
                const sinceEl = document.getElementById('member-since');
                const activeDaysEl = document.getElementById('active-days');
                
                if (emailEl) emailEl.innerText = memberData.email || '-';
                if (phoneEl) phoneEl.innerText = memberData.phone || '-';
                if (packageEl) packageEl.innerText = memberData.package || 'Standard';
                
                if (memberData.joinDate && sinceEl && activeDaysEl) {
                    const joinDate = new Date(memberData.joinDate);
                    sinceEl.innerText = joinDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    const daysSince = Math.floor((Date.now() - joinDate) / (1000 * 60 * 60 * 24));
                    activeDaysEl.innerText = daysSince;
                }
                
                // 2. Load Bills
                loadBills(memberId);

                // 3. Load Notifications
                loadNotifications();
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
    if (!billsList) {
        Logger.error('Bills list element not found');
        return;
    }

    try {
        Logger.info('Loading bills for member', { memberId });
        const q = query(collection(db, "bills"), where("memberId", "==", memberId));
        const querySnapshot = await getDocs(q);

        billsList.innerHTML = '';

        if (querySnapshot.empty) {
            billsList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">₹</div><p>No bills found.</p></div>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const bill = doc.data();
            const date = new Date(bill.date).toLocaleDateString();

            const billEl = document.createElement('div');
            billEl.className = 'bill-card';
            billEl.innerHTML = `
                <div class="bill-header">
                    <h4 style="color: var(--text-color); margin: 0;">${bill.description}</h4>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <span class="${bill.status === 'Paid' ? 'bill-status-paid' : 'bill-status-unpaid'}">
                            ${bill.status}
                        </span>
                        ${bill.status === 'Paid' ? `<button class="download-btn" onclick="downloadBill('${doc.id}', '${bill.description}', '${bill.amount}', '${date}')">Download</button>` : ''}
                    </div>
                </div>
                <div class="bill-amount">₹${bill.amount}</div>
                <div class="bill-details">
                    <div class="bill-detail-item">
                        <span class="bill-detail-label">Date</span>
                        <span class="bill-detail-value">${date}</span>
                    </div>
                    <div class="bill-detail-item">
                        <span class="bill-detail-label">Package</span>
                        <span class="bill-detail-value">${bill.package || 'Standard'}</span>
                    </div>
                </div>
            `;
            billsList.appendChild(billEl);
        });

        // Calculate total paid
        const totalPaid = querySnapshot.docs
            .filter(doc => doc.data().status === 'Paid')
            .reduce((sum, doc) => sum + (parseFloat(doc.data().amount) || 0), 0);
        const totalPaidEl = document.getElementById('total-paid');
        if (totalPaidEl) {
            totalPaidEl.innerText = `₹${totalPaid.toFixed(2)}`;
            Logger.info('Total paid calculated', { totalPaid });
        }

    } catch (error) {
        Logger.error('Error loading bills', error);
        billsList.innerHTML = '<p style="color: var(--error-color);">Error loading bills.</p>';
    }
}

function loadNotifications() {
    const notifList = document.getElementById('notifications-list');
    if (!notifList) return;

    try {
        getDocs(collection(db, "notifications"))
            .then(querySnapshot => {
                notifList.innerHTML = '';

                if (querySnapshot.empty) {
                    notifList.innerHTML = '<div class="empty-state"><div class="empty-state-icon">●</div><p>No new notifications at this time.</p></div>';
                    return;
                }

                querySnapshot.forEach((doc) => {
                    const notif = doc.data();
                    const date = new Date(notif.date).toLocaleDateString();

                    const notifEl = document.createElement('div');
                    notifEl.className = 'notif-card';
                    notifEl.innerHTML = `
                        <div class="notif-header">
                            <div class="notif-title">${notif.title}</div>
                            <div class="notif-date">${date}</div>
                        </div>
                        <div class="notif-message">${notif.message}</div>
                    `;
                    notifList.appendChild(notifEl);
                });

                Logger.info('Notifications loaded', { count: querySnapshot.size });
            })
            .catch(error => {
                Logger.error('Error loading notifications', error);
                notifList.innerHTML = '<p style="color: var(--error-color);">Error loading notifications.</p>';
            });
    } catch (error) {
        Logger.error('Error in loadNotifications', error);
    }
}

window.downloadBill = function(billId, description, amount, date) {
    const memberName = document.getElementById('member-name').innerText;
    const memberEmail = document.getElementById('member-email').innerText;
    
    const receiptContent = `
========================================
         GymRats - RECEIPT
========================================

Member: ${memberName}
Email: ${memberEmail}

Description: ${description}
Amount: ₹${amount}
Date: ${date}
Status: PAID

========================================
        Thank you for your payment!
========================================
    `;
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GymPro_Receipt_${billId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    Logger.info('Bill downloaded', { billId });
};
