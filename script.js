import React, { useState } from 'react';
import './App.css';

const HUGGING_FACE_API_KEY = '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'; // Добавьте свой ключ
const API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";
const TRANSLATE_API_URL = "https://api-inference.huggingface.co/models/Helsinki-NLP/opus-mt-en-ru";

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsLoading(true);
    setMessages([...messages, { role: 'user', content: input }]);

    try {
      // Проверяем наличие API ключа
      if (!HUGGING_FACE_API_KEY || HUGGING_FACE_API_KEY === 'ваш_ключ_hugging_face') {
        throw new Error('API ключ не установлен');
      }

      // Получаем ответ от модели
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: input
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data || !data[0] || !data[0].generated_text) {
        throw new Error('Некорректный ответ от API');
      }

      let message = data[0].generated_text;

      // Переводим ответ на русский
      if (!/[а-яА-Я]/.test(message)) {
        const translateResponse = await fetch(TRANSLATE_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: message,
          }),
        });

        if (!translateResponse.ok) {
          throw new Error(`Ошибка перевода! status: ${translateResponse.status}`);
        }

        const translateData = await translateResponse.json();
        
        if (!translateData || !translateData[0] || !translateData[0].translation_text) {
          throw new Error('Ошибка при переводе ответа');
        }

        message = translateData[0].translation_text;
      }

      setMessages(messages => [...messages, { role: 'assistant', content: message }]);
    } catch (error) {
      console.error('Подробная ошибка:', error);
      let errorMessage = 'Извините, произошла ошибка. ';
      
      if (error.message.includes('API ключ')) {
        errorMessage += 'Пожалуйста, установите правильный API ключ Hugging Face.';
      } else if (error.message.includes('HTTP error')) {
        errorMessage += 'Проблема с подключением к серверу. Попробуйте позже.';
      } else if (error.message.includes('перевода')) {
        errorMessage += 'Проблема с переводом ответа.';
      } else {
        errorMessage += 'Попробуйте еще раз через несколько минут.';
      }

      setMessages(messages => [...messages, { 
        role: 'assistant', 
        content: errorMessage
      }]);
    }

    setIsLoading(false);
    setInput('');
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              {message.content}
            </div>
          ))}
          {isLoading && <div className="loading">Думаю...</div>}
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Введите ваше сообщение..."
          />
          <button type="submit" disabled={isLoading}>Отправить</button>
        </form>
      </div>
    </div>
  );
}

export default App; 
