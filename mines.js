import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-auth.js";
import { getBalance, updateBalance } from "./auth.js";

const auth = getAuth();
let balance = 0;
let betAmount = 10;
let multiplier = 1.0;
let gameActive = false;
let bombs = 5;
let gridArray = [];

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
    bombs = parseInt(document.getElementById("bombs").value);

    if (balance < betAmount) {
        alert("❌ Insufficient balance!");
        return;
    }

    gameActive = true;
    multiplier = 1.0;
    gridArray = generateGrid();
    renderGrid();
    updateCashoutDisplay();

    document.getElementById("cashoutButton").disabled = false;
}

function generateGrid() {
    let grid = new Array(25).fill("safe");
    let bombPositions = new Set();

    while (bombPositions.size < bombs) {
        bombPositions.add(Math.floor(Math.random() * 25));
    }

    bombPositions.forEach(index => grid[index] = "bomb");
    return grid;
}

function renderGrid() {
    const gridElement = document.getElementById("grid");
    gridElement.innerHTML = "";

    gridArray.forEach((type, index) => {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = index;
        cell.addEventListener("click", revealCell);

        gridElement.appendChild(cell);
    });
}

function revealCell(event) {
    if (!gameActive) return;

    const index = event.target.dataset.index;
    if (gridArray[index] === "bomb") {
        event.target.classList.add("bomb");
        alert("💥 You hit a bomb! Game over.");
        gameOver();
    } else {
        event.target.classList.add("safe");
        multiplier += 0.2;
        updateCashoutDisplay();
    }
}

function updateCashoutDisplay() {
    const cashoutAmount = (betAmount * multiplier).toFixed(2);
    document.getElementById("multiplier").innerText = `${multiplier.toFixed(1)}x`;
    document.getElementById("cashoutButton").innerText = `Cashout (${cashoutAmount} credits)`;
}

async function cashout() {
    if (!gameActive) return;

    const user = auth.currentUser;
    if (user) {
        const winnings = betAmount * multiplier;
        balance = await updateBalance(user.uid, winnings);
        document.getElementById("balance").innerText = balance;
        alert(`✅ You cashed out at ${multiplier.toFixed(1)}x and won ${winnings.toFixed(2)} credits!`);
    }

    gameOver();
}

// 🔹 Reveal All Bombs & Safe Positions When Round Ends
function gameOver() {
    gameActive = false;
    document.getElementById("cashoutButton").disabled = true;

    document.querySelectorAll(".cell").forEach((cell, index) => {
        if (gridArray[index] === "bomb") {
            cell.classList.add("bomb");
        } else {
            cell.classList.add("safe");
        }
    });
}