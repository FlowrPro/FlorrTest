export let socket;

export function connectToGame() {
  const token = localStorage.getItem("sessionToken");
  const username = localStorage.getItem("username");

  if (!token || !username) {
    document.getElementById("homescreen").style.display = "block";
    return;
  }

  socket = io("https://florrtest-backend-1.onrender.com");

  socket.on("connect", () => {
    socket.emit("auth", { token, username });
  });

  // all your socket.on handlers (auth_success, auth_failed, disconnect, world_snapshot, etc.)
}

export async function loginAndConnect(username, password) {
  // same as your original login helper
}
