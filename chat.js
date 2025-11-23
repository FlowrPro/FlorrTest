export function setupChat(socket) {
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");
  let chatOpen = false;

  chatInput.addEventListener("keydown", e => {
    if (e.key === "Enter" && chatInput.value.trim() !== "") {
      const text = chatInput.value.trim();
      if (socket) socket.emit("chat_message", { text });
      chatInput.value = "";
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!chatOpen) {
        chatInput.classList.remove("hidden");
        chatInput.focus();
        chatOpen = true;
      } else {
        const text = chatInput.value.trim();
        if (text !== "" && socket) {
          socket.emit("chat_message", { text });
          chatInput.value = "";
        }
        chatInput.blur();
        chatInput.classList.add("hidden");
        chatOpen = false;
      }
    }
  });

  socket.on("chat_message", ({ username, text }) => {
    const msg = document.createElement("div");
    msg.className = "chat-msg";
    msg.innerHTML = `<span class="chat-user">${username}:</span> ${text}`;
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    while (chatMessages.children.length > 6) {
      chatMessages.removeChild(chatMessages.firstChild);
    }
  });
}
