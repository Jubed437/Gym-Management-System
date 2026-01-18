import { db, auth, firebaseConfig, app } from '../js/firebase-config.js';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

// DOM Elements
const membersTableBody = document.getElementById('members-list-body');
const addMemberForm = document.getElementById('add-member-form');
const createBillForm = document.getElementById('create-bill-form');
const memberSelect = document.getElementById('bill-member-select');

// === Member Management ===

/**
 * Fetch and Display Members
 */
async function loadMembers() {
    try {
        const querySnapshot = await getDocs(collection(db, "members"));
        membersTableBody.innerHTML = ''; // Clear loading
        memberSelect.innerHTML = '<option value="">Select a member...</option>'; // Reset select

        querySnapshot.forEach((doc) => {
            const member = doc.data();
            const memberId = doc.id;

            // Add to Table
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${member.name}</td>
                <td>${member.email}<br><small>${member.phone}</small></td>
                <td>${member.package || 'Monthly'}<br><small>Since: ${member.joinDate}</small></td>
                <td><span style="color:var(--success-color)">Active</span></td>
                <td>
                    <button class="btn-secondary action-btn" onclick="deleteMember('${memberId}')">Delete</button>
                    <!-- <button class="btn-secondary action-btn">Edit</button> -->
                </td>
            `;
            membersTableBody.appendChild(row);

            // Add to Select Dropdown
            const option = document.createElement('option');
            option.value = memberId;
            option.textContent = `${member.name} (${member.email})`;
            memberSelect.appendChild(option);
        });

        if (querySnapshot.empty) {
            membersTableBody.innerHTML = '<tr><td colspan="5">No members found.</td></tr>';
        }
    } catch (error) {
        Logger.error('Error loading members', error);
        membersTableBody.innerHTML = '<tr><td colspan="5">Error loading members.</td></tr>';
    }
}

/**
 * Add New Member
 * Simplified approach: Only store member data in Firestore.
 * Members can be given login credentials later if needed.
 */
async function addMember(e) {
    e.preventDefault();
    const name = document.getElementById('new-member-name').value;
    const email = document.getElementById('new-member-email').value;
    const password = document.getElementById('new-member-password').value;
    const phone = document.getElementById('new-member-phone').value;
    const joinDate = document.getElementById('new-member-join-date').value;
    const membershipPackage = document.getElementById('new-member-package').value;

    try {
        Logger.info('Adding new member to Firestore...', { email });

        // Show loading state
        const submitBtn = addMemberForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Creating...';
        submitBtn.disabled = true;

        // Add member details to Firestore
        await addDoc(collection(db, "members"), {
            name,
            email,
            phone,
            joinDate,
            package: membershipPackage,
            role: 'member',
            status: 'Active',
            createdAt: new Date().toISOString()
        });

        Logger.info('Member added successfully');
        alert('Member added successfully!');

        // Close Modal & Reload
        document.getElementById('add-member-modal').style.display = 'none';
        addMemberForm.reset();
        loadMembers();

    } catch (error) {
        Logger.error('Error adding member', error);
        alert('Error: ' + error.message);
    } finally {
        // Reset button
        const submitBtn = addMemberForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerText = 'Create Member';
            submitBtn.disabled = false;
        }
    }
}

async function deleteMember(id) {
    if (confirm('Are you sure you want to delete this member?')) {
        try {
            await deleteDoc(doc(db, "members", id));
            loadMembers();
        } catch (error) {
            Logger.error('Error deleting member', error);
        }
    }
}

// === Bill Management ===
// === Bill Management ===
async function createBill(e) {
    e.preventDefault();
    const memberId = memberSelect.value;
    const amount = document.getElementById('bill-amount').value;
    const description = document.getElementById('bill-desc').value;

    try {
        await addDoc(collection(db, "bills"), {
            memberId,
            amount: parseFloat(amount),
            description,
            date: new Date().toISOString(),
            status: 'Unpaid'
        });
        alert('Bill generated successfully!');
        createBillForm.reset();
        loadAllBills(); // Refresh list
    } catch (error) {
        Logger.error('Error creating bill', error);
        alert('Error: ' + error.message);
    }
}

async function loadAllBills() {
    const billsContainer = document.getElementById('bills-list-container');
    if (!billsContainer) return;

    try {
        const querySnapshot = await getDocs(collection(db, "bills"));
        let html = `
        <table style="width:100%; margin-top:20px;">
            <thead>
                <tr>
                    <th>Member ID</th> <!-- Ideally Name, but doing join client side is expensive, show ID for now or fetch map -->
                    <th>Desc</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>`;

        querySnapshot.forEach((doc) => {
            const bill = doc.data();
            html += `
                <tr>
                    <td><small>${bill.memberId}</small></td>
                    <td>${bill.description}<br><small>${new Date(bill.date).toLocaleDateString()}</small></td>
                    <td>₹${bill.amount}</td>
                    <td>
                        <span style="color:${bill.status === 'Paid' ? 'var(--success-color)' : 'var(--error-color)'}">
                            ${bill.status}
                        </span>
                    </td>
                    <td>
                        ${bill.status === 'Unpaid' ? `<button class="btn action-btn" onclick="markBillPaid('${doc.id}')">Mark Paid</button>` : '-'}
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        billsContainer.innerHTML = html;
    } catch (error) {
        Logger.error('Error loading bills', error);
        billsContainer.innerHTML = '<p>Error loading bills.</p>';
    }
}

// Function to update bill payment status
async function markBillPaid(billId) {
    try {
        await updateDoc(doc(db, "bills", billId), {
            status: 'Paid',
            paidDate: new Date().toISOString()
        });
        alert('Bill marked as Paid');
        loadAllBills(); // Refresh UI
    } catch (error) {
        Logger.error('Error updating bill', error);
        alert('Error: ' + error.message);
    }
}
window.markBillPaid = markBillPaid;


// === Notifications Management ===
async function sendBroadcastNotification(e) {
    e.preventDefault();
    const title = document.getElementById('notif-title').value;
    const message = document.getElementById('notif-message').value;

    try {
        await addDoc(collection(db, "notifications"), {
            title,
            message,
            date: new Date().toISOString(),
            type: 'broadcast'
        });
        alert('Notification sent to all members!');
        document.getElementById('send-notification-form').reset();
    } catch (error) {
        Logger.error('Error sending notification', error);
        alert('Error: ' + error.message);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadMembers();
    loadAllBills();
    loadReports();
});
if (addMemberForm) addMemberForm.addEventListener('submit', addMember);
if (createBillForm) createBillForm.addEventListener('submit', createBill);
const notifForm = document.getElementById('send-notification-form');
if (notifForm) notifForm.addEventListener('submit', sendBroadcastNotification);

// === Reports Management ===
async function loadReports() {
    // Only run if report section is active or on load
    const revenueEl = document.getElementById('report-total-revenue');
    const membersEl = document.getElementById('report-total-members');
    const pendingEl = document.getElementById('report-pending-bills');

    if (!revenueEl) return; // UI not ready

    try {
        // 1. Total Members
        const membersSnapshot = await getDocs(collection(db, "members"));
        membersEl.innerText = membersSnapshot.size;

        // 2. Revenue & Pending
        const billsSnapshot = await getDocs(collection(db, "bills"));
        let totalRevenue = 0;
        let pendingBills = 0;

        billsSnapshot.forEach(doc => {
            const bill = doc.data();
            if (bill.status === 'Paid') {
                totalRevenue += (bill.amount || 0);
            } else {
                pendingBills++;
            }
        });

        revenueEl.innerText = `₹${totalRevenue}`;
        pendingEl.innerText = pendingBills;

    } catch (error) {
        Logger.error('Error loading reports', error);
        revenueEl.innerText = 'Error';
    }
}
// Hook into showSection to refresh reports when tab is clicked
/* Modified showSection in logic below or just call on load */

// Expose functions to window for HTML onclicks
// Search Filter
function filterMembers() {
    const input = document.getElementById('member-search');
    const filter = input.value.toUpperCase();
    const table = document.getElementById('members-table');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const tdName = tr[i].getElementsByTagName('td')[0];
        const tdContact = tr[i].getElementsByTagName('td')[1];
        if (tdName || tdContact) {
            const txtValueName = tdName.textContent || tdName.innerText;
            const txtValueContact = tdContact.textContent || tdContact.innerText;
            if (txtValueName.toUpperCase().indexOf(filter) > -1 || txtValueContact.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = "";
            } else {
                tr[i].style.display = "none";
            }
        }
    }
}
window.filterMembers = filterMembers;

window.deleteMember = deleteMember;
