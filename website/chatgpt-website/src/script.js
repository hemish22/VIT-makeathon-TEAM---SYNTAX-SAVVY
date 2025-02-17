let currentChatId = null;
let renameChatId = null;
let deleteChatId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    if (chats.length === 0) {
        createNewChat();
    } else {
        loadChatList();
        loadChatMessages(chats[chats.length - 1].id);
    }
});

// Chat List
function loadChatList() {
    const chatList = document.getElementById('chatList');
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    
    chatList.innerHTML = '';
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
        chatItem.innerHTML = `
            <span>${chat.title}</span>
            <div class="chat-actions">
                <button onclick="event.stopPropagation(); openRenameModal('${chat.id}')">✏️</button>
                <button onclick="event.stopPropagation(); deleteChat('${chat.id}')">🗑️</button>
            </div>
            <small>${chat.messages.length} messages</small>
        `;
        chatItem.addEventListener('click', () => switchChat(chat.id));
        chatList.appendChild(chatItem);
    });
}

// Chat Management
function createNewChat() {
    const chatId = Date.now().toString();
    const chats = JSON.parse(localStorage.getItem('chats')) || [];
    
    const newChat = {
        id: chatId,
        title: `Untitled -${chats.length + 1}`,
        messages: [],
        created: new Date().toISOString()
    };
    
    chats.push(newChat);
    localStorage.setItem('chats', JSON.stringify(chats));
    switchChat(chatId);
    loadChatList();
}

function switchChat(chatId) {
    currentChatId = chatId;
    loadChatList();
    loadChatMessages(chatId);
}

function loadChatMessages(chatId) {
    const chats = JSON.parse(localStorage.getItem('chats'));
    const chat = chats.find(c => c.id === chatId);
    const chatContainer = document.getElementById('chatContainer');
    
    chatContainer.innerHTML = '';
    chat.messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender}`;
        messageDiv.textContent = message.text;
        chatContainer.appendChild(messageDiv);
    });
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Rename Functions
function openRenameModal(chatId) {
    renameChatId = chatId;
    const chat = JSON.parse(localStorage.getItem('chats')).find(c => c.id === chatId);
    document.getElementById('renameInput').value = chat.title;
    document.getElementById('renameModal').style.display = 'flex';
    document.getElementById('renameInput').focus();
}

function closeRenameModal() {
    document.getElementById('renameModal').style.display = 'none';
    renameChatId = null;
}

function saveChatName() {
    const newName = document.getElementById('renameInput').value.trim();
    if (newName && renameChatId) {
        let chats = JSON.parse(localStorage.getItem('chats'));
        const chatIndex = chats.findIndex(c => c.id === renameChatId);
        if (chatIndex > -1) {
            chats[chatIndex].title = newName;
            localStorage.setItem('chats', JSON.stringify(chats));
            loadChatList();
        }
    }
    closeRenameModal();
}

// Delete Functions
function deleteChat(chatId) {
    deleteChatId = chatId;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    deleteChatId = null;
}

function confirmDelete() {
    if (!deleteChatId) return;

    let chats = JSON.parse(localStorage.getItem('chats'));
    chats = chats.filter(chat => chat.id !== deleteChatId);
    localStorage.setItem('chats', JSON.stringify(chats));

    if (currentChatId === deleteChatId) {
        if (chats.length > 0) {
            switchChat(chats[0].id);
        } else {
            createNewChat();
        }
    }
    loadChatList();
    closeDeleteModal();
}

// Message Handling
function sendMessage() {
    const userInput = document.getElementById('userInput');
    const messageText = userInput.value.trim();
    
    if (!messageText) return;
    
    const chats = JSON.parse(localStorage.getItem('chats'));
    const chatIndex = chats.findIndex(c => c.id === currentChatId);
    
    // User message
    chats[chatIndex].messages.push({
        text: messageText,
        sender: 'user-message',
        timestamp: new Date().toISOString()
    });
    
    // Bot response
    chats[chatIndex].messages.push({
        text: 'This is a dummy bot response',
        sender: 'bot-message',
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('chats', JSON.stringify(chats));
    
    // Update UI
    const chatContainer = document.getElementById('chatContainer');
    
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user-message';
    userMessageDiv.textContent = messageText;
    chatContainer.appendChild(userMessageDiv);
    
    const botMessageDiv = document.createElement('div');
    botMessageDiv.className = 'message bot-message';
    botMessageDiv.textContent = 'This is a dummy bot response';
    chatContainer.appendChild(botMessageDiv);
    
    userInput.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;
    loadChatList();
}

// Event Listeners
document.getElementById('userInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') sendMessage();
});