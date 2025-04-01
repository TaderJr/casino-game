document.getElementById("spinButton").addEventListener("click", spinWheel);
document.getElementById("backButton").addEventListener("click", () => {
    window.location.href = "home.html"; // Redirect back to homepage
});

let balance = 1000;
const multipliers = [0, 1.5, 2, 5, 50];

function spinWheel() {
    const betAmount = parseInt(document.getElementById("betInput").value, 10);
    if (!betAmount || betAmount <= 0 || betAmount > balance) {
        alert("Invalid bet amount!");
        return;
    }

    balance -= betAmount;
    updateBalance();

    const randomMultiplierIndex = Math.floor(Math.random() * multipliers.length);
    const multiplier = multipliers[randomMultiplierIndex];
    const winnings = betAmount * multiplier;

    balance += winnings;
    updateBalance();

    document.getElementById("resultText").innerText = `You landed on x${multiplier}! You won ${winnings} tokens!`;

    animateSpin(randomMultiplierIndex);
}

function animateSpin(finalIndex) {
    const wheel = document.getElementById("wheel");
    const spinAmount = -(finalIndex * 200);
    let speed = 500; // Starts fast
    let position = 0;

    const spinInterval = setInterval(() => {
        position += speed;
        speed *= 0.85; // Gradually slows down

        if (speed < 3) {
            clearInterval(spinInterval);
            wheel.style.transform = `translateX(${spinAmount}px)`; // Ensures final result is correct
        } else {
            wheel.style.transform = `translateX(${position}px)`;
        }
    }, 50);
}

function updateBalance() {
    document.getElementById("balance").innerText = balance;
}