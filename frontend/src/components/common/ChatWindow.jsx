import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';

export default function ChatWindow({ chat, messages, onSendMessage, onBack }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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

  // ✅ helper: determinar si un mensaje fue leído
  const isMessageRead = (message) => {
    // soporta varias formas: status, readAt, read boolean
    if (!message) return false;
    if (message.status === 'read') return true;
    if (message.readAt) return true;
    if (message.read === true) return true;
    return false;
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white shadow-lg rounded-xl overflow-hidden">
      {/* Header */}
      <header className="bg-[#f0f2f5] px-4 py-3 flex items-center gap-3 border-b border-gray-200 flex-shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden text-gray-600 hover:text-gray-800 -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}

        <img
          src={chat.avatar}
          alt={chat.name}
          className="w-10 h-10 rounded-full object-cover"
        />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-[15px] truncate">{chat.name}</p>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${chat.online ? 'bg-green-500' : 'bg-gray-400'}`} />
            <p className="text-xs text-gray-500">
              {chat.online ? 'En línea' : 'Desconectado'}
            </p>
          </div>
        </div>
      </header>

      {/* Mensajes (scroll aquí) */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-[#efeae2]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'%23efeae2\'/%3E%3C/svg%3E")'
        }}
      >
        <div className="py-2 px-4">
          {messages.map((message) => {
            const isMe = message.sender === 'me';
            const read = isMe ? isMessageRead(message) : false;

            return (
              <div
                key={message.id}
                className={`flex mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {/* ✅ Bubble */}
                <div
                  className={`rounded-lg shadow-sm ${isMe ? 'bg-purple-200' : 'bg-white'}`}
                  style={{
                    maxWidth: 'calc(100% - 32px)',
                    width: 'fit-content',
                    padding: '6px 8px',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    boxSizing: 'border-box'
                  }}
                >
                  <div className="flex items-end gap-2">
                    <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words m-0">
                      {message.text}
                    </p>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] text-gray-500">
                        {message.time}
                      </span>

                      {/* ✅ Checks con "visto" púrpura */}
                      {isMe && (
                        <svg
                          className={`w-4 h-4 ${read ? 'text-purple-800' : 'text-gray-500'}`}
                          viewBox="0 0 16 15"
                          fill="none"
                          aria-label={read ? 'Leído' : 'Enviado'}
                        >
                          <path
                            d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                            fill="currentColor"
                          />
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

      {/* Input fijo abajo */}
      <footer className="bg-[#f0f2f5] px-3 py-2 flex items-end gap-2 flex-shrink-0">
        <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center min-w-0">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje"
            className="flex-1 outline-none text-[15px] bg-transparent placeholder-gray-500 min-w-0"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className={`
            p-3 rounded-full transition-all duration-200 flex-shrink-0
            ${newMessage.trim()
              ? 'bg-blue-400 hover:bg-blue-500 text-white shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <Send className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
}
