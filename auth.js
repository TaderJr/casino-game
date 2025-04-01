import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-firestore.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-auth.js";

// 🔹 Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD2bwHaju4muyDzajhGYui-UYQ0JkOayeI",
    authDomain: "gogamble-222fc.firebaseapp.com",
    projectId: "gogamble-222fc",
    storageBucket: "gogamble-222fc.firebasestorage.app",
    messagingSenderId: "649835988705",
    appId: "1:649835988705:web:be070bace7b684214d99a0",
    measurementId: "G-4V6WYEVDT5"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 🔹 Function to Set Initial Balance
export async function setInitialBalance(userId) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await setDoc(userRef, { balance: 1000 });  // Default balance
    }
}

// 🔹 Function to Get User Balance
export async function getBalance(userId) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data().balance : 0;
}

// 🔹 Function to Update Balance (Deposits & Bets)
export async function updateBalance(userId, amount) {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const newBalance = userSnap.data().balance + amount;
        await updateDoc(userRef, { balance: newBalance });
        return newBalance;
    }
    return null;
}

// 🔹 Google Sign-In Function (Fixed Redirect Issue)
export function googleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then(async (result) => {
            console.log("User logged in:", result.user);

            // Ensure balance is set for new users
            await setInitialBalance(result.user.uid);

            // Redirect after login
            window.location.href = "home.html";
        })
        .catch((error) => {
            console.error("Login error:", error);
        });
}

// 🔹 Email Sign-Up Function
export function emailSignUp() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
            console.log("Account created:", userCredential.user);

            // Ensure balance is set for new users
            await setInitialBalance(userCredential.user.uid);

            alert(`Account created for: ${userCredential.user.email}`);
            window.location.href = "home.html";
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

// 🔹 Email Login Function
export function emailLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Logged in:", userCredential.user);
            alert(`Logged in as: ${userCredential.user.email}`);
            window.location.href = "home.html";
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

// 🔹 Logout Function
export function logoutUser() {
    signOut(auth).then(() => {
        alert("Logged out successfully!");
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Logout Error:", error);
    });
}

// 🔹 Fixed Authentication Persistence (Prevents Infinite Redirect Loop)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("User detected:", user.uid);

        // Ensure balance is set for new users
        await setInitialBalance(user.uid);

        // 🔹 Redirect only if user is still on login page
        if (window.location.pathname.includes("login.html")) {
            console.log("Redirecting to home...");
            window.location.href = "home.html";
        }
    } else {
        console.log("No user detected.");

        // 🔹 Redirect only if user is NOT already on the login page
        if (!window.location.pathname.includes("login.html")) {
            console.log("Redirecting to login...");
            window.location.href = "login.html";
        }
    }
});