// login.js

// Register a new account
async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("https://florrtest-backend-1.onrender.com/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (data.success) {
      alert("Registered successfully!");
    } else {
      alert("Error: " + data.error);
    }
  } catch (err) {
    alert("Network error: " + err.message);
  }
}

// Login to existing account
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("https://florrtest-backend-1.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (data.token) {
      // Save token + username for later use
      localStorage.setItem("sessionToken", data.token);
      localStorage.setItem("username", username);

      alert("Login successful!");
      // Redirect to your game page (index.html in your case)
      window.location.href = "/index.html";
    } else {
      alert("Error: " + data.error);
    }
  } catch (err) {
    alert("Network error: " + err.message);
  }
}

// When game loads, authenticate with the server
function connectToGame() {
  const token = localStorage.getItem("sessionToken");
  const username = localStorage.getItem("username");

  if (!token || !username) {
    alert("You must log in first!");
    window.location.href = "/login.html";
    return;
  }

  // Connect to Socket.IO server hosted on Render
  const socket = io("https://florrtest-backend-1.onrender.com");

  // Send token to backend for authentication
  socket.emit("auth", { token });

  socket.on("auth_success", (data) => {
    console.log("Authenticated as:", data.username);
    // Now you can safely call set_username or other game events
    socket.emit("set_username", { username: data.username });
  });

  socket.on("auth_failed", () => {
    alert("Authentication failed. Please log in again.");
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("username");
    window.location.href = "/login.html";
  });
}
