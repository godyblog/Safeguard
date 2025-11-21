import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
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

    const newNoteForm = document.getElementById('newNoteForm');
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');

    let currentUserUid;

    // Check auth state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUserUid = user.uid;
        } else {
            // redirect to login if not logged in
            window.location.href = '/pages/login.html';
        }
    });

    // Handle new note submission
    newNoteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();

        if (!title || !content) return;

        try {
            await addDoc(collection(db, 'users', currentUserUid, 'notes'), {
                title,
                content,
                date: serverTimestamp()
            });

            alert('Note saved successfully!');
            newNoteForm.reset();
        } catch (err) {
            console.error(err);
            alert('Error saving note. Try again.');
        }
    });
});