import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, AlertCircle, MessageCircle } from 'lucide-react';

const AnimalAdvisorBot = ({ petType = null }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: '¡Hola! 🐾 Soy tu asistente de cuidado animal. Puedo ayudarte con consejos sobre alimentación, comportamiento, salud y más. ¿Qué quieres saber?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/chatbot`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: input,
            petType: petType,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || 'Error al obtener respuesta del asistente'
        );
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: data.reply,
        timestamp: new Date(),
        tokens: data.tokens,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);

      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        text: `❌ ${err.message}. Intenta de nuevo.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white flex items-center gap-2">
        <MessageCircle className="w-6 h-6" />
        <div>
          <h3 className="font-bold">Asesor de Cuidado Animal</h3>
          <p className="text-xs opacity-90">Respuestas sobre adopción y mascotas</p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-purple-500 text-white rounded-br-none'
                  : message.type === 'error'
                  ? 'bg-red-100 text-red-800 rounded-bl-none'
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.text}
              </p>
              <span
                className={`text-xs ${
                  message.type === 'user'
                    ? 'text-purple-100'
                    : 'text-gray-500'
                } mt-1 block`}
              >
                {message.timestamp.toLocaleTimeString('es-CO', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'America/Bogota'
                })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-lg px-4 py-3 rounded-bl-none border border-gray-200 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">Pensando...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !loading) {
                handleSendMessage();
              }
            }}
            placeholder="Pregunta sobre cuidado de mascotas..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Sugerencias */}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setInput('¿Qué debo saber antes de adoptar un perro?')}
            className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition"
          >
            Consejos adopción
          </button>
          <button
            onClick={() => setInput('¿Cuál es la mejor alimentación para gatos?')}
            className="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full hover:bg-pink-200 transition"
          >
            Alimentación
          </button>
          <button
            onClick={() => setInput('¿Cómo entreno a mi mascota?')}
            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200 transition"
          >
            Adiestramiento
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimalAdvisorBot;