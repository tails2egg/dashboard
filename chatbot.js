const chat = {
  drawer: document.querySelector("#chatDrawer"),
  launcher: document.querySelector("#chatLauncher"),
  close: document.querySelector("#closeChat"),
  clear: document.querySelector("#clearChat"),
  form: document.querySelector("#chatForm"),
  input: document.querySelector("#chatInput"),
  messages: document.querySelector("#chatMessages"),
  prompts: document.querySelectorAll(".chat-prompts button"),
  history: [],
  welcome:
    "Hi. Ask me what you need from the dashboard data: projects, people, tasks, blockers, budgets, meetings, or activity.",
};

function openChat() {
  chat.drawer.classList.add("open");
  chat.drawer.setAttribute("aria-hidden", "false");
  chat.input.focus();
}

function closeChat() {
  chat.drawer.classList.remove("open");
  chat.drawer.setAttribute("aria-hidden", "true");
  chat.launcher.focus();
}

function addChatMessage(message, sender = "bot") {
  const article = document.createElement("article");
  article.className = `chat-message ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "chat-avatar";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = sender === "user" ? "U" : "A";

  const bubble = document.createElement("div");
  bubble.className = "chat-bubble";

  const paragraph = document.createElement("p");
  paragraph.textContent = message;
  bubble.append(paragraph);
  article.append(avatar, bubble);
  chat.messages.append(article);
  chat.messages.scrollTop = chat.messages.scrollHeight;
}

function showChatTyping() {
  const article = document.createElement("article");
  article.className = "chat-message bot";
  article.dataset.typing = "true";
  article.innerHTML = `
    <div class="chat-avatar" aria-hidden="true">A</div>
    <div class="chat-bubble">
      <div class="typing" aria-label="Assistant is typing">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  chat.messages.append(article);
  chat.messages.scrollTop = chat.messages.scrollHeight;
}

function removeChatTyping() {
  const typing = chat.messages.querySelector("[data-typing='true']");
  if (typing) typing.remove();
}

function resizeChatInput() {
  chat.input.style.height = "auto";
  chat.input.style.height = `${chat.input.scrollHeight}px`;
}

async function requestChatReply() {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: chat.history }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "The assistant could not respond.");
  }
  return data.reply;
}

async function sendChatMessage(value) {
  const message = value.trim();
  if (!message) return;

  openChat();
  addChatMessage(message, "user");
  chat.history.push({ role: "user", content: message });
  chat.input.value = "";
  resizeChatInput();
  showChatTyping();

  try {
    const reply = await requestChatReply();
    removeChatTyping();
    addChatMessage(reply, "bot");
    chat.history.push({ role: "assistant", content: reply });
  } catch (error) {
    removeChatTyping();
    addChatMessage(error.message, "bot");
  }
}

function clearChatMessages() {
  chat.messages.innerHTML = "";
  chat.history.length = 0;
  addChatMessage(chat.welcome);
  chat.input.focus();
}

function initChatbot() {
  if (!chat.drawer || !chat.launcher || !chat.form || !chat.input || !chat.messages) return;

  chat.launcher.addEventListener("click", openChat);
  chat.close.addEventListener("click", closeChat);
  chat.clear.addEventListener("click", clearChatMessages);
  chat.input.addEventListener("input", resizeChatInput);
  chat.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      chat.form.requestSubmit();
    }
  });
  chat.form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendChatMessage(chat.input.value);
  });
  chat.prompts.forEach((button) => {
    button.addEventListener("click", () => sendChatMessage(button.textContent));
  });
}

initChatbot();
