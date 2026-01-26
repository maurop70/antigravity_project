// Initialize: Reset Memory on Load
fetch('/api/reset', { method: 'POST' }).then(() => console.log("Memory Reset"));

const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceToggleBtn = document.getElementById('voice-toggle-btn');
const avatarOverlay = document.getElementById('avatar-overlay');
const avatarFrame = document.querySelector('.avatar-frame');
const voiceStatus = document.querySelector('.voice-status');
const stopSpeakBtn = document.getElementById('stop-speak-btn');

const fileInput = document.getElementById('file-upload');
const filePreview = document.getElementById('file-preview');
const fileNameDisplay = document.getElementById('file-name');
const clearFileBtn = document.getElementById('clear-file');

let isVoiceMode = false;
let currentFile = null;
let isProcessing = false;
let isAlexaSpeaking = false; // Flag to prevent self-hearing

// Audio Setup
const audioPlayer = new Audio();
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
        if (isAlexaSpeaking) {
            recognition.stop(); // SAFETY: Don't listen if speaking
            return;
        }
        voiceStatus.innerText = "Listening...";
        avatarFrame.classList.remove('talking');
    };

    recognition.onend = () => {
        if (isVoiceMode && !isAlexaSpeaking && !isProcessing) {
            try { recognition.start(); } catch (e) { }
        } else if (isProcessing) {
            voiceStatus.innerText = "Thinking...";
        }
    };

    recognition.onresult = (event) => {
        if (isAlexaSpeaking) return; // Ignore input while speaking
        const transcript = event.results[0][0].transcript;

        // Anti-Echo: Ignore if it matches what Alexa just said
        // (Simple heuristic: usually unnecessary if we stop listening/mic)

        userInput.value = transcript;
        sendMessage();
    };
} else {
    console.warn("Speech Recognition not supported.");
    voiceToggleBtn.style.display = 'none';
}

// Event Listeners
voiceToggleBtn.addEventListener('click', toggleVoiceMode);
stopSpeakBtn.addEventListener('click', stopSpeaking);
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// File Upload Logic
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        currentFile = e.target.files[0];
        fileNameDisplay.innerText = `📄 ${currentFile.name}`;
        filePreview.classList.remove('hidden');
    }
});

clearFileBtn.addEventListener('click', () => {
    fileInput.value = '';
    currentFile = null;
    filePreview.classList.add('hidden');
});

function toggleVoiceMode() {
    isVoiceMode = !isVoiceMode;

    if (isVoiceMode) {
        voiceToggleBtn.innerHTML = '<span class="icon">⌨️</span> Switch to Text Mode';
        avatarOverlay.classList.remove('hidden');
        userInput.placeholder = "Listening...";
        startListening();
    } else {
        voiceToggleBtn.innerHTML = '<span class="icon">🎙️</span> Switch to Voice Mode';
        avatarOverlay.classList.add('hidden');
        userInput.placeholder = "Type your message here...";
        stopListening();
        isAlexaSpeaking = false;
        audioPlayer.pause();
    }
}

function startListening() {
    if (recognition && isVoiceMode && !isAlexaSpeaking) {
        try { recognition.start(); } catch (e) { }
    }
}

function stopListening() {
    if (recognition) recognition.stop();
}

function stopSpeaking() {
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        isAlexaSpeaking = false;
        avatarFrame.classList.remove('talking');
    }
    // Only restart listening if we are in voice mode
    if (isVoiceMode) {
        setTimeout(startListening, 500); // Slight delay to let audio fully die
        voiceStatus.innerText = "Listening...";
        stopSpeakBtn.classList.add('hidden');
    }
}

async function sendMessage() {
    console.log("sendMessage called"); // Debug
    const text = userInput.value.trim();
    if (!text && !currentFile) {
        console.log("Empty text and no file. returning.");
        return;
    }

    // UI Updates
    addMessage(text, 'user');
    userInput.value = '';

    // Stop listening while processing
    stopListening();
    isProcessing = true;
    voiceStatus.innerText = "Thinking..."; // Visual feedback

    // Prepare Payload
    const formData = new FormData();
    formData.append('message', text || "[File Upload]");
    if (currentFile) {
        formData.append('file', currentFile);
        // Clear file after send
        fileInput.value = '';
        currentFile = null;
        filePreview.classList.add('hidden');
    }

    try {
        const endpoint = currentFile ? '/api/upload' : '/api/chat';
        let response;

        if (formData.has('file')) {
            response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
        } else {
            response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
        }

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        const reply = data.response;

        isProcessing = false;
        addMessage(reply, 'alexa');

        // Clean text for speech (Remove [IMAGE: ...])
        const speechText = reply.replace(/\[IMAGE:\s*.*?\]/gi, '').trim();

        if (isVoiceMode) {
            speak(speechText);
        }

    } catch (error) {
        isProcessing = false;
        addMessage("Sorry, I'm having trouble connecting.", 'alexa');
        console.error("SendMessage Error:", error);
        if (isVoiceMode) startListening();
    }
}

function addMessage(text, sender) {
    if (!text) return; // Don't add empty messages
    const div = document.createElement('div');
    div.classList.add('message', `${sender}-message`);

    // Regex Definitions
    const imageRegex = /\[IMAGE:\s*(.*?)\]/i;
    const searchRegex = /\[SEARCH:\s*(.*?)\]/i;

    let displayText = text;
    let imageType = null; // 'gen' or 'search'
    let imageQuery = null;

    // Check for Generated Image
    const genMatch = text.match(imageRegex);
    if (genMatch) {
        displayText = text.replace(genMatch[0], '').trim();
        imageQuery = genMatch[1];
        imageType = 'gen';
    }

    // Check for Search Image (Priority if both exist, though unlikely)
    const searchMatch = text.match(searchRegex);
    if (searchMatch) {
        displayText = text.replace(searchMatch[0], '').trim();
        imageQuery = searchMatch[1];
        imageType = 'search';
    }

    div.innerText = displayText;

    if (imageType) {
        const img = document.createElement('img');
        img.alt = "Visual Aid";
        img.style.maxWidth = "100%";
        img.style.borderRadius = "10px";
        img.style.marginTop = "10px";
        img.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";

        // Loader Placeholder
        img.style.minHeight = "200px";
        img.style.backgroundColor = "#f0f0f0";

        // Error Handler: Fallback to AI Generative if Real Image fails (403/404)
        img.onerror = () => {
            console.error("Real Image failed/blocked. Falling back to AI Generation.");

            // Prevent infinite loop if AI image also fails
            if (img.getAttribute('data-retried')) {
                img.style.display = 'none';
                return;
            }

            img.setAttribute('data-retried', 'true');
            const prompt = encodeURIComponent(imageQuery || "placeholder");
            img.src = `https://pollinations.ai/p/${prompt}?width=800&height=600&nologo=true`;
        };

        div.appendChild(img);

        if (imageType === 'gen') {
            // Pollinations (Instant)
            const prompt = encodeURIComponent(imageQuery);
            img.src = `https://pollinations.ai/p/${prompt}?width=800&height=600&nologo=true`;
        } else if (imageType === 'search') {
            // Real Search (Async)
            console.log("Fetching real image for:", imageQuery);
            fetch('/api/search_image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: imageQuery })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.url) {
                        img.src = data.url;
                    } else {
                        img.style.display = 'none'; // Hide if no result
                    }
                })
                .catch(e => {
                    console.error("Search failed:", e);
                    img.style.display = 'none';
                });
        }
    }

    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}



async function speak(text) {
    if (!text) return;

    // Stop any current audio
    stopSpeaking();

    try {
        const response = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) throw new Error("TTS generation failed");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        audioPlayer.src = url;
        isAlexaSpeaking = true; // Block Mic

        audioPlayer.onplay = () => {
            avatarFrame.classList.add('talking');
            voiceStatus.innerText = "Alexa is speaking...";
            stopListening(); // Ensure mic is off
            if (isVoiceMode) stopSpeakBtn.classList.remove('hidden');
        };

        audioPlayer.onended = () => {
            isAlexaSpeaking = false;
            avatarFrame.classList.remove('talking');
            stopSpeakBtn.classList.add('hidden');
            if (isVoiceMode) {
                voiceStatus.innerText = "Listening...";
                setTimeout(startListening, 200); // 200ms delay to avoid self-echo
            }
        };

        await audioPlayer.play();

    } catch (e) {
        console.error(e);
        isAlexaSpeaking = false;
        if (isVoiceMode) startListening();
    }
}



// Window load not strictly needed for this, but keeping clean cleanup if needed

