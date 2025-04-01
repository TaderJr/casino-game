import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, orderBy, query, getDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.9.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

const chatContainer = document.getElementById("chatContainer");
const chatToggle = document.getElementById("chatToggle");
const closeChat = document.getElementById("closeChat");
const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");

let currentUser = null;
let rainActive = false;
let rainAmount = 0;
let rainParticipants = [];
let rainInitiator = null;
let rainTimerInterval = null;
let timeLeft = 15; // Rain countdown timer (seconds)
let rainMessageId = null;

// 🔹 Toggle Chat Open/Close
chatToggle.addEventListener("click", () => {
    chatContainer.classList.toggle("open");
    chatToggle.innerText = chatContainer.classList.contains("open") ? "✖ Close" : "➤ Chat";
});

closeChat.addEventListener("click", () => {
    chatContainer.classList.remove("open");
    chatToggle.innerText = "➤ Chat";
});

// 🔹 Get Logged-In User Info
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        currentUser = user;
        listenForMessages();
    }
});

// 🔹 Function to Send Message
async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    // 🔹 Check for `.rain` command
    if (messageText.startsWith(".rain")) {
        const amount = parseInt(messageText.split(" ")[1], 10);
        if (!isNaN(amount) && amount > 0) {
            await startRain(amount);
        } else {
            alert("Invalid rain amount!");
        }
    } else {
        await addDoc(collection(db, "chatMessages"), {
            text: messageText,
            userName: currentUser.displayName,
            userPhoto: currentUser.photoURL,
            timestamp: Date.now()
        });
    }

    messageInput.value = "";
}

// 🔹 Start Rain Event
async function startRain(amount) {
    if (rainActive) {
        alert("A rain event is already active!");
        return;
    }

    // 🔹 Deduct Rain Amount from User's Balance
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists() || userSnap.data().balance < amount) {
        alert("Insufficient balance to rain!");
        return;
    }
    await updateDoc(userRef, { balance: userSnap.data().balance - amount });

    rainActive = true;
    rainAmount = amount;
    rainParticipants = [];
    rainInitiator = currentUser;
    timeLeft = 15;

    // 🔹 Display Rain Announcement in Chat (Single Message)
    const rainMessageRef = await addDoc(collection(db, "chatMessages"), {
        text: `${currentUser.displayName} is raining ${amount} tokens! Rain ends in ${timeLeft} seconds. Click "Join" to participate.`,
        userName: "System",
        timestamp: Date.now(),
        type: "rain"
    });

    rainMessageId = rainMessageRef.id;

    // 🔹 Start Rain Countdown Timer (Update Single Message)
    rainTimerInterval = setInterval(async () => {
        if (timeLeft > 0) {
            timeLeft--;
            await updateDoc(doc(db, "chatMessages", rainMessageId), {
                text: `${rainInitiator.displayName} is raining ${rainAmount} tokens! Rain ends in ${timeLeft} seconds. ${rainParticipants.length} people joined.`,
                timestamp: Date.now()
            });
        } else {
            clearInterval(rainTimerInterval);
            distributeRain();
        }
    }, 1000);
}

// 🔹 Function to Join Rain
async function joinRain(userId) {
    if (!rainActive) {
        alert("There's no active rain event!");
        return;
    }

    if (!rainParticipants.includes(userId)) {
        rainParticipants.push(userId);

        // 🔹 Update the rain event message to reflect participant count
        await updateDoc(doc(db, "chatMessages", rainMessageId), {
            text: `${rainInitiator.displayName} is raining ${rainAmount} tokens! Rain ends in ${timeLeft} seconds. ${rainParticipants.length} people joined.`,
            timestamp: Date.now()
        });

        alert(`You have joined the rain!`);
    }
}

// 🔹 Distribute Rain Among Participants
async function distributeRain() {
    if (rainParticipants.length === 0) {
        await updateDoc(doc(db, "chatMessages", rainMessageId), {
            text: `No one joined the rain! The tokens remain unspent.`,
            timestamp: Date.now()
        });

        rainActive = false;
        return;
    }

    const share = rainAmount / rainParticipants.length;

    for (const userId of rainParticipants) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const newBalance = userSnap.data().balance + share;
            await updateDoc(userRef, { balance: newBalance });
        }
    }

    await updateDoc(doc(db, "chatMessages", rainMessageId), {
        text: `Rain completed! ${share.toFixed(2)} tokens sent to each participant.`,
        timestamp: Date.now()
    });

    rainActive = false;
}

// 🔹 Listen for New Messages
function listenForMessages() {
    const q = query(collection(db, "chatMessages"), orderBy("timestamp"));

    onSnapshot(q, (snapshot) => {
        messagesContainer.innerHTML = "";
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");

            if (data.type === "rain") {
                messageElement.innerHTML = `<strong>${data.text}</strong> <button class="joinButton">Join</button>`;
            } else {
                messageElement.innerHTML = `<img class="avatar" src="${data.userPhoto}" alt="${data.userName}"><strong>${data.userName}:</strong> ${data.text}`;
            }

            messagesContainer.appendChild(messageElement);
        });

        // 🔹 Fix "Join" Button to Work for All Users
        document.querySelectorAll(".joinButton").forEach(button => {
            button.addEventListener("click", () => {
                joinRain(auth.currentUser.uid); // Calls function using the correct user
            });
        });
    });
}

// 🔹 Attach Send Button to Function
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") sendMessage();
});