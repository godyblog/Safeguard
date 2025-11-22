import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth, applyActionCode, checkActionCode } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyB2IoBPgUnumshpcdg28AvbRMONdSYMEAU",
    authDomain: "safeguard-76e36.firebaseapp.com",
    projectId: "safeguard-76e36",
    storageBucket: "safeguard-76e36.firebasestorage.app",
    messagingSenderId: "639820898310",
    appId: "1:639820898310:web:58bddb80f77ee9c0b6a387",
    measurementId: "G-03Q9HBBQEF"
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);

const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get('oobCode');

const messageDiv = document.getElementById('messageDiv');
const loginBtn = document.getElementById('loginBtn');

async function verifyEmail() {
    if (!oobCode) {
        messageDiv.textContent = "Invalid verification link.";
        messageDiv.style.borderColor = "var(--danger)";
        messageDiv.style.color = "var(--danger)";
        return;
    }

    try {
        // Check if code is valid
        const info = await checkActionCode(auth, oobCode);

        // Apply the email verification
        await applyActionCode(auth, oobCode);

        messageDiv.textContent = `Email successfully verified for ${info.data.email}! You can now log in.`;
        messageDiv.style.borderColor = "var(--accent-2)";
        messageDiv.style.color = "var(--accent-2)";

        loginBtn.hidden = false;

    } catch (err) {
        messageDiv.textContent = `Verification failed: ${err.message}`;
        messageDiv.style.borderColor = "var(--danger)";
        messageDiv.style.color = "var(--danger)";
    }
}

loginBtn.addEventListener('click', () => {
    window.location.href = '/login.html';
});

// Run verification on page load
verifyEmail();