let messages = [];
let aiContext = null;
const badWords = ['fuck', 'shit', 'asshole', 'bitch', 'damn', 'crap', 'idiot', 'stupid', 'hell'];
const allowedTopics = ['os', 'operating system', 'computer', 'math', 'algorithm', 'cpu', 'disk', 'page', 'scheduling', 'process', 'memory'];

function toggleChat() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const chatWidget = document.querySelector('.chat-widget');
    
    if (!isLoggedIn) {
        // Create and show error message
        const errorBox = document.createElement('div');
        errorBox.className = 'error-box';
        errorBox.textContent = 'Please login to use the chat box';
        
        // Position error box relative to chat widget
        errorBox.style.position = 'absolute';
        errorBox.style.bottom = '100%';
        errorBox.style.right = '0';
        errorBox.style.marginBottom = '10px';
        
        chatWidget.appendChild(errorBox);
        
        // Remove error after 3 seconds
        setTimeout(() => {
            if (chatWidget.contains(errorBox)) {
                chatWidget.removeChild(errorBox);
            }
        }, 3000);
        return;
    }
    
    // Toggle expanded state
    chatWidget.classList.toggle('expanded');
    
    // Focus input when expanded
    if (chatWidget.classList.contains('expanded')) {
        setTimeout(() => {
            const input = document.getElementById('chat-input-field');
            if (input) input.focus();
        }, 100);
    }
}

function sendMessage() {
    const input = document.getElementById('chat-input-field');
    if (!input) return;
    
    const message = input.value.trim();
    if (message) {
        addMessage('user', message);
        processUserMessage(message);
        input.value = '';
    }
}

function containsBadWords(message) {
    return badWords.some(word => message.toLowerCase().includes(word));
}

function isAllowedTopic(message) {
    return allowedTopics.some(topic => message.toLowerCase().includes(topic));
}

function processUserMessage(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for bad words first
    if (containsBadWords(lowerMessage)) {
        setTimeout(() => {
            addMessage('bot', 'Please maintain a respectful conversation. I will not respond to inappropriate language.');
        }, 500);
        return;
    }
    
    // Check if the topic is allowed
    if (!isAllowedTopic(lowerMessage) && !lowerMessage.match(/^(hi|hello|hey|greetings|thank|bye)/i)) {
        setTimeout(() => {
            addMessage('bot', "I'm not sure about that. I specialize in Operating Systems, computer concepts, and basic math. I'll learn more in my upcoming updates!");
        }, 500);
        return;
    }
    
    // Handle greetings
    if (lowerMessage.match(/^(hi|hello|hey|greetings)/i)) {
        setTimeout(() => {
            addMessage('bot', 'Hello! I can help you with Operating System concepts, computer fundamentals, and basic math. What would you like to know?');
        }, 500);
        aiContext = 'awaiting_query';
        return;
    }
    
    // Handle thanks/goodbye
    if (lowerMessage.match(/^(thanks|thank you|bye|goodbye)/i)) {
        setTimeout(() => {
            addMessage('bot', 'You\'re welcome! Feel free to ask if you have more questions about OS concepts.');
        }, 500);
        return;
    }
    
    // Handle math questions
    if (lowerMessage.includes('math') || lowerMessage.match(/\d+[\+\-\*\/]\d+/)) {
        setTimeout(() => {
            addMessage('bot', 'I can help with basic math operations. For example: "What is 5 + 7?" or "Calculate 10 * 3".');
        }, 500);
        return;
    }
    
    // Handle specific math calculations
    const mathMatch = lowerMessage.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
    if (mathMatch) {
        const num1 = parseInt(mathMatch[1]);
        const num2 = parseInt(mathMatch[3]);
        const op = mathMatch[2];
        let result;
        
        switch(op) {
            case '+': result = num1 + num2; break;
            case '-': result = num1 - num2; break;
            case '*': result = num1 * num2; break;
            case '/': result = num1 / num2; break;
        }
        
        setTimeout(() => {
            addMessage('bot', `The result of ${num1} ${op} ${num2} is ${result}.`);
        }, 500);
        return;
    }
    
    // Handle OS/computer concepts
    const algorithmMatch = findRelevantAlgorithm(lowerMessage);
    if (algorithmMatch) {
        setTimeout(() => {
            addMessage('bot', generateAlgorithmExplanation(algorithmMatch));
        }, 500);
        return;
    }
    
    // Default response for allowed topics
    setTimeout(() => {
        addMessage('bot', 'I can help you understand CPU scheduling, disk scheduling, page replacement algorithms, and basic computer concepts. What specifically would you like to know?');
    }, 500);
}

function findRelevantAlgorithm(message) {
    const algorithms = {
        'fcfs': ['fcfs', 'first come first serve', 'fifo'],
        'sjf': ['sjf', 'shortest job first', 'shortest'],
        'rr': ['round robin', 'rr', 'time quantum'],
        'priority': ['priority', 'priority scheduling'],
        'scan': ['scan', 'elevator', 'disk scan'],
        'cscan': ['cscan', 'c-scan', 'circular scan'],
        'lru': ['lru', 'least recently used'],
        'optimal': ['optimal', 'optimal page'],
        'process': ['process', 'process management'],
        'memory': ['memory', 'memory management'],
        'scheduling': ['scheduling', 'scheduler'],
        'os': ['os', 'operating system']
    };

    for (const [algo, keywords] of Object.entries(algorithms)) {
        if (keywords.some(keyword => message.includes(keyword))) {
            return algo;
        }
    }
    return null;
}

function generateAlgorithmExplanation(algorithm) {
    const explanations = {
        'fcfs': 'First Come First Serve (FCFS) is the simplest scheduling algorithm. Processes are executed in the order they arrive. While simple to implement, it can lead to the "convoy effect" where short processes wait behind long ones.',
        'sjf': 'Shortest Job First (SJF) prioritizes processes with the shortest burst time. This minimizes average waiting time but can lead to starvation of longer processes.',
        'rr': 'Round Robin assigns a fixed time quantum to each process. It provides fair CPU distribution but requires context switching overhead.',
        'priority': 'Priority Scheduling assigns priorities to processes and executes the highest priority first. It can lead to starvation of low-priority processes.',
        'scan': 'SCAN (Elevator) algorithm moves the disk arm in one direction until the end, serving requests along the way, then reverses direction.',
        'cscan': 'C-SCAN moves in one direction only, returning to the beginning when it reaches the end. This provides more uniform waiting times.',
        'lru': 'Least Recently Used (LRU) replaces the page that hasn\'t been used for the longest time. It\'s based on the principle of locality.',
        'optimal': 'Optimal page replacement algorithm replaces the page that won\'t be used for the longest time in the future. It\'s theoretical and provides a benchmark.',
        'process': 'A process is an instance of a program in execution. Process management involves creating, scheduling, and terminating processes, and handling inter-process communication.',
        'memory': 'Memory management handles allocation and deallocation of memory to processes, virtual memory, paging, and segmentation to optimize memory usage.',
        'scheduling': 'Scheduling is the process of determining which process runs next on the CPU. Different algorithms (FCFS, SJF, RR, etc.) have different performance characteristics.',
        'os': 'An Operating System (OS) manages computer hardware and software resources, providing services for computer programs. Key functions include process management, memory management, file systems, and I/O operations.'
    };

    return explanations[algorithm] || 'I can explain various computer science concepts in detail. Which one would you like to learn about?';
}

function addMessage(type, content) {
    const messagesDiv = document.getElementById('chat-messages');
    if (!messagesDiv) return;

    const messageElement = document.createElement('div');
    messageElement.classList.add('message', type);
    
    const timestamp = new Date().toLocaleTimeString();
    messageElement.innerHTML = `
        <div class="message-content">
            <span class="message-text">${content}</span>
            <span class="message-time">${timestamp}</span>
        </div>
    `;
    
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    messages.push({ type, content, timestamp });
}

document.addEventListener('DOMContentLoaded', () => {
    const chatInput = document.getElementById('chat-input-field');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});