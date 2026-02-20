import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';

const renderMessageText = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="underline break-all" style={{ color: '#1877f2' }}
          onClick={e => e.stopPropagation()}>
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

export default function ChatWindow({ chat, messages, onSendMessage, onBack }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMessageRead = (message) => {
    if (!message) return false;
    return message.status === 'read' || !!message.readAt || message.read === true;
  };

  return (
    /*
      El ChatWindow ocupa todo el espacio disponible del padre.
      El padre (Chat.jsx) ya reserva 64px para la BottomNav con paddingBottom.
      Por eso el footer del input siempre queda visible.
    */
    <div className="flex flex-col h-full bg-white md:rounded-xl overflow-hidden shadow-lg">

      {/* Header del contacto */}
      <header className="bg-[#f0f2f5] px-3 py-2.5 flex items-center gap-3 border-b border-gray-200 flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="md:hidden text-gray-600 -ml-1 p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <img src={chat.avatar} alt={chat.name}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{chat.name}</p>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${chat.online ? 'bg-green-500' : 'bg-gray-400'}`} />
            <p className="text-xs text-gray-500">{chat.online ? 'En línea' : 'Desconectado'}</p>
          </div>
        </div>
      </header>

      {/* Mensajes — flex-1 para ocupar el espacio entre header y footer */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-[#efeae2]">
        <div className="py-2 px-3">
          {messages.map((message) => {
            const isMe = message.sender === 'me';
            const read = isMe ? isMessageRead(message) : false;
            return (
              <div key={message.id} className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`rounded-lg shadow-sm ${isMe ? 'bg-purple-200' : 'bg-white'}`}
                  style={{ maxWidth: 'calc(100% - 24px)', width: 'fit-content', padding: '6px 8px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  <div className="flex items-end gap-2">
                    <p className="text-[14px] leading-[19px] whitespace-pre-wrap break-words m-0">
                      {renderMessageText(message.text)}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] text-gray-500">{message.time}</span>
                      {isMe && (
                        <svg className={`w-4 h-4 ${read ? 'text-purple-800' : 'text-gray-400'}`} viewBox="0 0 16 15" fill="none">
                          <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="currentColor" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input — flex-shrink-0 garantiza que nunca desaparezca */}
      <footer className="bg-[#f0f2f5] px-3 py-2 flex items-center gap-2 flex-shrink-0 border-t border-gray-200">
        <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center min-w-0 shadow-sm">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje"
            className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400 min-w-0"
          />
        </div>
        <button onClick={handleSend} disabled={!newMessage.trim()}
          className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
            newMessage.trim()
              ? 'bg-purple-500 hover:bg-purple-600 text-white shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          <Send className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
}