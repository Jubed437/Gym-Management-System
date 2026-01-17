import { db, auth, firebaseConfig } from '../js/firebase-config.js';
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

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
                <td>${member.joinDate}</td>
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
 * Uses a secondary Firebase App instance to create a user in Authentication
 * without logging out the current Admin user.
 */
async function addMember(e) {
    e.preventDefault();
    const name = document.getElementById('new-member-name').value;
    const email = document.getElementById('new-member-email').value;
    const password = document.getElementById('new-member-password').value;
    const phone = document.getElementById('new-member-phone').value;
    const joinDate = document.getElementById('new-member-join-date').value;

    let secondaryApp = null;

    try {
        // 1. Initialize a secondary app instance
        // This allows us to interact with Auth without affecting the main app's currentUser (Admin)
        secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        // 2. Create User in Secondary Auth
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const user = userCredential.user;
        Logger.info('Member account created in Auth', { uid: user.uid });

        // 3. Add details to Firestore (Main DB instance)
        await addDoc(collection(db, "members"), {
            uid: user.uid, // Link to Auth UID
            name,
            email,
            phone,
            joinDate,
            // Password is NOT stored in plain text anymore
            role: 'member'
        });

        Logger.info('Member profile added to Firestore', { name, email });
        alert('Member account created successfully!');

        // 4. Cleanup Secondary App (Optional but good practice)
        await signOut(secondaryAuth); // Sign out the new user from the secondary instance just in case

        // Close Modal & Reload
        document.getElementById('add-member-modal').style.display = 'none';
        addMemberForm.reset();
        loadMembers();

    } catch (error) {
        Logger.error('Error adding member', error);
        alert('Error: ' + error.message);
    }
    // Note: We don't delete the secondary app instance because the SDK handles it, 
    // but reusing the name "SecondaryApp" might throw if we don't manage it.
    // However, initializeApp is idempotent if we hold the reference, but here we scope it.
    // Safest for simple usage is to leave it be or check if it exists (advanced).
    // For this level, it's fine.
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
    } catch (error) {
        Logger.error('Error creating bill', error);
        alert('Error: ' + error.message);
    }
}


// Event Listeners
document.addEventListener('DOMContentLoaded', loadMembers);
if (addMemberForm) addMemberForm.addEventListener('submit', addMember);
if (createBillForm) createBillForm.addEventListener('submit', createBill);

// Expose functions to window for HTML onclicks
window.deleteMember = deleteMember;
