# Gym Management System

A comprehensive web-based Gym Management System built with HTML, CSS, JavaScript, and Firebase. This application manages members, gym trainers, bills, and notifications.

## Live Demo -  https://gym-management-system-smoky-two.vercel.app

## Features

### Admin
- **Login**: Secure access for gym administrators.
- **Member Management**: Add, update, delete, and list gym members.
- **Billing**: Create bills and assign fee packages.
- **Notifications**: Send monthly fee notifications.
- **Reports**: Export data (Future Scope).

### Member
- **Login**: Secure access for members.
- **Dashboard**: View bill receipts and notifications.

## Technologies Used
- HTML5
- CSS3 (Variables, Flexbox)
- Vanilla JavaScript
- Firebase (Authentication, Firestore)

## Setup Instructions

1. **Clone/Download the repository**.
2. **Configure Firebase**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Create a new project.
   - Enable **Authentication** (Email/Password).
   - Enable **Firestore Database** (Start in Test Mode).
   - Copy your web app's configuration (API Key, etc.).
   - Update `js/firebase-config.js` with your specific configuration.
3. **Run Locally**:
   - Open `index.html` in your browser.
   - For better experience, use a local server (e.g., VS Code Live Server).

## Folder Structure
```
/
├── index.html          # Login Page
├── style.css           # Global Styles
├── js/
│   ├── firebase-config.js  # Firebase Setup
│   ├── auth.js             # Authentication Logic
│   ├── admin.js            # Admin Functionality
│   ├── member.js           # Member Functionality
│   └── utils.js            # Helpers & Logging
├── admin/
│   └── dashboard.html      # Admin Dashboard (TBD)
└── member/
│   └── dashboard.html      # Member Dashboard (TBD)
```

## Licensing
Unified Mentor Project.
