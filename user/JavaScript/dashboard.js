import { getAuth, signOut, fetchSignInMethodsForEmail, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

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
    const auth = getAuth(app);
    const db = getFirestore(app);



document.addEventListener('DOMContentLoaded', async () => {

    const displayContainer = document.getElementById('displayContainer');
    const displayBlockBtn = document.getElementById('displayBlock');
    const displayGridBtn = document.getElementById('displayGrid');
    const searchInput = document.getElementById('search');
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const logoutBtn = document.getElementById('logoutBtn');

    let notes = [];
    let currentUser;

    // Menu toggle
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
    });

    // Auto-close sidebar on click outside
    document.addEventListener('click', (e) => {
        if(!sidebar.contains(e.target) && !menuToggle.contains(e.target)){
            sidebar.classList.remove('show');
        }
    });

    // Logout
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await signOut(auth);
        sessionStorage.clear();
        window.location.href = '/pages/login.html';
    });

    // View toggle
    displayBlockBtn.addEventListener('click', () => {
        displayBlockBtn.style.display ='none';
        displayGridBtn.style.display ='inline-block';
        displayContainer.classList.replace('grid', 'block');
    });

    displayGridBtn.addEventListener('click', () => {
        displayGridBtn.style.display ='none';
        displayBlockBtn.style.display ='inline-block';
        displayContainer.classList.replace('block', 'grid');
    });

    // Monitor auth state
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
        } else {
            // Redirect to login if not logged in
            window.location.href = '/login.html';
        }
    });
    

    try {
        const notesRef = collection(db, "users", currentUser.uid, "notes");
        const q = query(notesRef, orderBy("date", "desc"));
        const notesSnapshot = await getDocs(q);
        notes = notesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if(notes.length){
            displayContainer.innerHTML = '';
            notes.forEach(note => {
                const divElement = document.createElement('div');
                divElement.classList.add('note');
                divElement.innerHTML = `
                    <h3 class="title">${note.title}</h3>
                    <p class="content">${note.content}</p>
                    <p class="date">${formatDate(note.date)}</p>
                `;
                divElement.addEventListener('click', () => {
                    window.location.href = `/pages/note.html?i=${notes.indexOf(note)}`;
                });
                displayContainer.appendChild(divElement);
            });
            displayContainer.classList.replace('default', 'grid');
        }

    } catch(err){
        console.error(err);
        displayContainer.innerHTML = `<p class="fallback">Error fetching notes. Please refresh the page.</p>`;
    }

    // Search
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const results = notes.filter(n => n.title.toLowerCase().includes(searchTerm));
        displayContainer.innerHTML = '';
        if(results.length){
            results.forEach(note => {
                const div = document.createElement('div');
                div.classList.add('note');
                div.innerHTML = `
                    <h3 class="title">${note.title}</h3>
                    <p class="content">${note.content}</p>
                    <p class="date">${formatDate(note.date)}</p>
                `;
                div.addEventListener('click', () => {
                    window.location.href = `/pages/note.html?i=${notes.indexOf(note)}`;
                });
                displayContainer.appendChild(div);
            });
        } else {
            displayContainer.innerHTML = `<p class="fallback">No results found</p>`;
        }
    });

    // Date formatting
    function formatDate(timestamp){
        const dateObj = new Date(timestamp.seconds ? timestamp.seconds*1000 : timestamp);
        const hours = dateObj.getHours() % 12 || 12;
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const ampm = dateObj.getHours() < 12 ? 'am' : 'pm';
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth()+1).padStart(2,'0');
        const year = dateObj.getFullYear();
        return `${day}/${month}/${year} ${hours}:${minutes}${ampm}`;
    }

});
