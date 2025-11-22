async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("http://localhost:8080/register", {
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
}

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch("http://localhost:8080/login", {
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
    // Redirect to your game page
    window.location.href = "/game.html";
  } else {
    alert("Error: " + data.error);
  }
}
