import { getAuth, onAuthStateChanged, updatePassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
    import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
    const analyticts = getAnalytics(app);
    
document.addEventListener('DOMContentLoaded', () => {
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    const emailDisplay = document.getElementById('emailDisplay');
    const nameDisplay = document.getElementById('nameDisplay');
    const phoneDisplay = document.getElementById('phoneDisplay');
    
    const editProfileForm = document.getElementById('editProfileForm');
    const updatePasswordForm = document.getElementById('updatePasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const toggleNewPasswordBtn = document.getElementById('toggleNewPassword');
    const logoutBtn = document.getElementById('logoutBtn');
    
    let currentUser, userDocRef;
    
    // Toggle password visibility
    toggleNewPasswordBtn.addEventListener('click', () => {
        if (newPasswordInput.type === 'password') {
            newPasswordInput.type = 'text';
        } else {
            newPasswordInput.type = 'password';
        }
    });
    
    // Monitor auth state
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            emailDisplay.textContent = user.email;
            
            userDocRef = doc(db, 'users', user.uid);
            
            try {
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    nameDisplay.textContent = data.fullName || '';
                    phoneDisplay.textContent = data.phone || '';
                    document.getElementById('editFullName').value = data.fullName || '';
                    document.getElementById('editPhone').value = data.phone || '';
                }
            } catch (err) {
                console.error(err);
            }
            
        } else {
            // Redirect to login if not logged in
            window.location.href = '/login.html';
        }
    });
    
    // Update profile info
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('editFullName').value.trim();
        const phone = document.getElementById('editPhone').value.trim();
        
        try {
            await setDoc(userDocRef, { fullName, phone }, { merge: true });
            alert('Profile updated successfully!');
            nameDisplay.textContent = fullName;
            phoneDisplay.textContent = phone;
        } catch (err) {
            console.error(err);
            alert('Error updating profile info.');
        }
    });
    
    // Update password
    updatePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = newPasswordInput.value.trim();
        if (!newPass) return;
        
        try {
            await updatePassword(currentUser, newPass);
            alert('Password updated successfully!');
            newPasswordInput.value = '';
        } catch (err) {
            console.error(err);
            alert('Error updating password. You may need to re-login.');
        }
    });
    
    // Logout
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            sessionStorage.clear();
            window.location.href = '/pages/login.html';
        });
    });
});