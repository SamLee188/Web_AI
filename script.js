const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    const iconSpan = document.createElement('span');
    iconSpan.className = 'icon';
    iconSpan.textContent = sender === 'user' ? '🧑' : '🤖';
    msgDiv.appendChild(iconSpan);
    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    msgDiv.appendChild(textSpan);
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;
    appendMessage('user', message);
    userInput.value = '';
    appendMessage('bot', '...');
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await res.json();
        // Replace last bot message with icon and response
        const lastBotMsg = chatWindow.querySelectorAll('.message.bot');
        if (lastBotMsg.length) {
            lastBotMsg[lastBotMsg.length - 1].querySelector('span:last-child').textContent = data.response;
        }
    } catch (err) {
        const lastBotMsg = chatWindow.querySelectorAll('.message.bot');
        if (lastBotMsg.length) {
            lastBotMsg[lastBotMsg.length - 1].querySelector('span:last-child').textContent = 'Error: Could not get response.';
        }
    }
}); 