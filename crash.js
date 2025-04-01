import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-auth.js";
import { getBalance, updateBalance } from "./auth.js";

const auth = getAuth();
let balance = 0;
let betAmount = 10;
let multiplier = 1.00;
let gameActive = false;
let crashPoint = 0;
let interval;
let crashHistory = []; // Stores last 5 crashes

document.getElementById("startGame").addEventListener("click", startGame);
document.getElementById("cashoutButton").addEventListener("click", cashout);
document.getElementById("backButton").addEventListener("click", () => {
    window.location.href = "home.html"; // Go back to the casino lobby
});

async function loadBalance() {
    const user = auth.currentUser;
    if (user) {
        balance = await getBalance(user.uid);
        document.getElementById("balance").innerText = balance;
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadBalance();
    } else {
        window.location.href = "login.html";
    }
});

function startGame() {
    betAmount = parseInt(document.getElementById("betAmount").value);

    if (balance < betAmount) {
        alert("❌ Insufficient balance!");
        return;
    }

    gameActive = true;
    multiplier = 1.00;
    crashPoint = (Math.random() * 19 + 1).toFixed(2); // Random crash between x1.00 - x20.00
    document.getElementById("cashoutButton").disabled = false;

    console.log("Crash point set at:", crashPoint); // Debugging

    interval = setInterval(updateMultiplier, 100);
}

function updateMultiplier() {
    if (!gameActive) return;

    multiplier += 0.05; // Increase multiplier gradually
    document.getElementById("multiplier").innerText = `x${multiplier.toFixed(2)}`;
    updateCashoutDisplay();

    if (multiplier >= crashPoint) {
        crash();
    }
}

function crash() {
    gameActive = false;
    clearInterval(interval);
    document.getElementById("cashoutButton").disabled = true;

    // 🔹 Save crash result
    addCrashToHistory(crashPoint);

    alert(`💥 Crash at x${crashPoint}! You lost your bet.`);
}

function updateCashoutDisplay() {
    const cashoutAmount = (betAmount * multiplier).toFixed(2);
    document.getElementById("cashoutButton").innerText = `Cashout (${cashoutAmount} credits)`;
}

async function cashout() {
    if (!gameActive) return;

    const user = auth.currentUser;
    if (user) {
        const winnings = betAmount * multiplier;
        balance = await updateBalance(user.uid, winnings);
        document.getElementById("balance").innerText = balance;
        alert(`✅ You cashed out at x${multiplier.toFixed(2)} and won ${winnings.toFixed(2)} credits!`);
    }

    gameActive = false;
    clearInterval(interval);
    document.getElementById("cashoutButton").disabled = true;

    // 🔹 Save the crash result (it didn't crash, so just store final multiplier)
    addCrashToHistory(multiplier.toFixed(2));
}

// 🔹 Function to Store Last 5 Crash Results
function addCrashToHistory(crashValue) {
    crashHistory.unshift(`x${crashValue}`); // Add new crash at the beginning
    if (crashHistory.length > 5) crashHistory.pop(); // Keep only last 5 crashes

    updateCrashHistoryDisplay();
}

// 🔹 Function to Update Crash History UI
function updateCrashHistoryDisplay() {
    const historyElement = document.getElementById("crashHistory");
    historyElement.innerHTML = crashHistory.map(crash => `<li>${crash}</li>`).join("");
}