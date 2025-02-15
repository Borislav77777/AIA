const HUGGING_FACE_API_KEY = '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'; // Замените на ваш ключ
const API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";
const TRANSLATE_API_URL = "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-ru";

const messagesDiv = document.getElementById('messages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');

let isLoading = false;

function addMessage(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.textContent = content;
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function setLoading(loading) {
    isLoading = loading;
    const loadingDiv = document.querySelector('.loading');
    if (loading) {
        if (!loadingDiv) {
            const div = document.createElement('div');
            div.className = 'loading';
            div.textContent = 'Думаю...';
            messagesDiv.appendChild(div);
        }
    } else {
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message || isLoading) return;

    addMessage(message, 'user');
    userInput.value = '';
    setLoading(true);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: {
                    text: message
                }
            }),
        });

        const data = await response.json();
        let aiMessage = data[0].generated_text;

        if (!/[а-яА-Я]/.test(aiMessage)) {
            const translateResponse = await fetch(TRANSLATE_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs: aiMessage,
                }),
            });
            const translateData = await translateResponse.json();
            aiMessage = translateData[0].translation_text;
        }

        addMessage(aiMessage, 'assistant');
    } catch (error) {
        console.error('Error:', error);
        addMessage('Извините, произошла ошибка. Попробуйте еще раз.', 'assistant');
    }

    setLoading(false);
});
