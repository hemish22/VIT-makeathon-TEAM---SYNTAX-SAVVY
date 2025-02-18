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
async function sendMessage() {
    const userInput = document.getElementById('userInput');
    const messageText = userInput.value.trim();
    
    if (!messageText) return;
    
    const chats = JSON.parse(localStorage.getItem('chats'));
    const chatIndex = chats.findIndex(c => c.id === currentChatId);
    
    // Add user message to UI
    const chatContainer = document.getElementById('chatContainer');
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user-message';
    userMessageDiv.textContent = messageText;
    chatContainer.appendChild(userMessageDiv);
    
    // Save user message to LocalStorage
    chats[chatIndex].messages.push({
        text: messageText,
        sender: 'user-message',
        timestamp: new Date().toISOString()
    });
    localStorage.setItem('chats', JSON.stringify(chats));
    
    // Send message to backend and get bot response
    try {
        const response = await fetch('http://127.0.0.1:5000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: messageText }),
        });
        
        const data = await response.json();
        
        // Add bot response to UI
        const botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'message bot-message';
        botMessageDiv.textContent = data.response;
        chatContainer.appendChild(botMessageDiv);
        
        // Save bot response to LocalStorage
        chats[chatIndex].messages.push({
            text: data.response,
            sender: 'bot-message',
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('chats', JSON.stringify(chats));
    } catch (error) {
        console.error('Error:', error);
        const errorMessageDiv = document.createElement('div');
        errorMessageDiv.className = 'message bot-message';
        errorMessageDiv.textContent = 'Error: Could not get a response from the bot.';
        chatContainer.appendChild(errorMessageDiv);
    }
    
    userInput.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;
    loadChatList();
}

// Event Listeners
document.getElementById('userInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') sendMessage();
});