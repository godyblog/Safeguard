import {
    getAuth,
    signInWithEmailAndPassword,
    fetchSignInMethodsForEmail,
    sendEmailVerification,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";


// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyB2IoBPgUnumshpcdg28AvbRMONdSYMEAU",
    authDomain: "safeguard-76e36.firebaseapp.com",
    projectId: "safeguard-76e36",
    storageBucket: "safeguard-76e36.firebasestorage.app",
    messagingSenderId: "639820898310",
    appId: "1:639820898310:web:58bddb80f77ee9c0b6a387",
    measurementId: "G-03Q9HBBQEF"
};

// Init
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);


document.addEventListener("DOMContentLoaded", () => {
    
    const phase1Form = document.getElementById("phase1Form");
    const phase2Form = document.getElementById("phase2Form");
    
    const passwordInput = document.getElementById("signupPassword");
    const togglePasswordBtn = document.getElementById("togglePassword");
    const passwordResetLink = document.getElementById("passwordResetLink");
    
    let createdUser = null; // store user after signup
    
    
    /* ------------------------------------------
       Password Visibility Toggle
    ------------------------------------------- */
    togglePasswordBtn.addEventListener("click", () => {
        passwordInput.type =
            passwordInput.type === "password" ? "text" : "password";
    });
    
    
    
    /* ------------------------------------------
       PHASE 1 — Check email → Create user
    ------------------------------------------- */
    phase1Form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const email = document.getElementById("signupEmail").value.trim();
        const password = passwordInput.value.trim();
        
        if (!email || !password) {
            alert("Please fill in all fields.");
            return;
        }
        
        try {
            // check if email already exists
            const methods = await fetchSignInMethodsForEmail(auth, email);
            
            if (methods.length > 0) {
                const answer = confirm(
                    "An account already exists for this email. Do you want to log in instead?"
                );
                if (answer) {
                    window.location.href = "/pages/login.html";
                }
                return;
            }
            
            // create account
            const result = await signInWithEmailAndPassword(auth, email, password);
            createdUser = result.user;
            
            // send verification email
            if (!createdUser.emailVerified) {
                await sendEmailVerification(createdUser);
                alert("Verification email sent. Please check your inbox.");
            }
            
            // move to phase 2
            phase1Form.classList.add("hidden");
            phase2Form.classList.remove("hidden");
            
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });
    
    
    
    /* ------------------------------------------
       PHASE 2 — Save extra info
    ------------------------------------------- */
    phase2Form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        if (!createdUser) {
            alert("Error: User not found. Restart signup.");
            return;
        }
        
        const fullName = document.getElementById("fullName").value.trim();
        const phone = document.getElementById("phone").value.trim();
        
        if (!fullName || !phone) {
            alert("Please fill in all fields.");
            return;
        }
        
        try {
            // Save to Firestore
            await setDoc(doc(db, "users", createdUser.uid), {
                fullName,
                phone,
                email: createdUser.email,
                createdAt: serverTimestamp()
            });
            
            // store extra info in session
            sessionStorage.setItem(
                "userExtra",
                JSON.stringify({ fullName, phone })
            );
            
            alert("Signup complete! Redirecting...");
            window.location.href = "/pages/dashboard.html";
            
        } catch (err) {
            console.error(err);
            alert("Error saving information.");
        }
    });
    
    
    
    /* ------------------------------------------
       PASSWORD RESET
    ------------------------------------------- */
    passwordResetLink.addEventListener("click", async (e) => {
        e.preventDefault();
        const email = prompt("Enter your email to reset password:");
        if (!email) return;
        
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Password reset email sent!");
        } catch (err) {
            console.error(err);
            alert(err.message);
        }
    });
    
});