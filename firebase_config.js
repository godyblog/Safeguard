<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
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

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>