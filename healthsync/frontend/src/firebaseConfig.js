// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyANhOgLzInXhqh_ozk2rV32VGYbEq8ra0A",
  authDomain: "healthsync-670a6.firebaseapp.com",
  projectId: "healthsync-670a6",
  storageBucket: "healthsync-670a6.firebasestorage.app",
  messagingSenderId: "883974170315",
  appId: "1:883974170315:web:ae00b62df9ab44e83d9d4e",
  measurementId: "G-FM49L846Y5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };