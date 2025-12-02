import { useState } from 'react';
import { Send } from 'lucide-react';

export default function ChatWindow({ chat, messages, onSendMessage, onBack }) {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="flex flex-col bg-white shadow-lg rounded-xl overflow-hidden h-full max-h-full">
      {/* Header del contacto */}
      <header className="p-4 flex items-center gap-3 border-b bg-white flex-shrink-0">
        {onBack && (
          <button 
            onClick={onBack}
            className="md:hidden text-purple-500 mr-2 text-xl"
          >
            ←
          </button>
        )}
        <img 
          src={chat.avatar} 
          alt={chat.name}
          className="w-12 h-12 rounded-full shadow"
        />
        <div>
          <p className="font-semibold text-gray-800 text-lg">{chat.name}</p>
          <p className={`text-sm ${chat.online ? 'text-green-600' : 'text-gray-400'}`}>
            {chat.online ? 'En línea' : 'Desconectado'}
          </p>
        </div>
      </header>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#efeae2] min-h-0">
        <div className="space-y-3 flex flex-col">
          {messages.map(message => (
            <div
              key={message.id}
              className={`
                max-w-sm rounded-2xl p-3 shadow flex-shrink-0
                ${message.sender === 'me' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white self-end' 
                  : 'bg-white text-gray-800 self-start'
                }
              `}
            >
              <p className="break-words">{message.text}</p>
              <span className={`text-xs block text-right mt-1 ${
                message.sender === 'me' ? 'text-purple-100' : 'text-gray-400'
              }`}>
                {message.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Input de mensaje */}
      <footer className="bg-white p-4 flex items-center gap-3 border-t flex-shrink-0">
        <input 
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe un mensaje..."
          className="flex-1 bg-gray-100 p-3 rounded-full outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button 
          onClick={handleSend}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg text-white p-3 rounded-full transition-all"
        >
          <Send className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
}