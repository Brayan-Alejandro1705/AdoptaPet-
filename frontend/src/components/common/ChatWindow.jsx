import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Smile } from 'lucide-react';

const generateAvatar = (name = 'U') =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7C3AED&color=fff&size=128`;

const renderMessageText = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="underline break-all text-blue-500"
          onClick={e => e.stopPropagation()}
        >{part}</a>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

export default function ChatWindow({ chat, messages, onSendMessage, onBack }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { inputRef.current?.focus(); }, [chat]);

  const handleSend = () => {
    const text = newMessage.trim();
    if (!text) return;
    onSendMessage(text);
    setNewMessage('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isRead = (msg) => msg.status === 'read' || !!msg.readAt || msg.read === true;

  const chatName = chat?.name || 'Usuario';
  const chatAvatar = chat?.avatar || generateAvatar(chatName);

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = msg.createdAt
      ? new Date(msg.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
      : 'Hoy';
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-white"
      style={{ borderRadius: '0.75rem', boxShadow: '0 4px 24px rgba(124,58,237,0.08)' }}
    >
      {/* ─── Header ─── */}
      <header
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}
      >
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden -ml-1 mr-1 w-9 h-9 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <div className="relative flex-shrink-0">
          <img
            src={chatAvatar}
            alt={chatName}
            className="w-10 h-10 rounded-full object-cover border-2 border-white/30 shadow-sm"
            onError={e => { e.target.src = generateAvatar(chatName); }}
          />
          {chat?.online && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-[15px] truncate leading-tight">{chatName}</p>
          <p className="text-xs text-white/75 mt-0.5">
            {chat?.online ? '● En línea' : 'Desconectado'}
          </p>
        </div>
      </header>

      {/* ─── Messages Area ─── */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
        style={{
          background: 'linear-gradient(180deg, #f3f0ff 0%, #fdf2f8 50%, #f0f7ff 100%)',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="py-3 px-4 space-y-0.5">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7C3AED22, #EC489922)' }}
              >
                <span className="text-3xl">💬</span>
              </div>
              <p className="text-sm text-gray-400 font-medium text-center">
                Di hola a {chatName} 👋
              </p>
            </div>
          )}

          {messages.map((message, idx) => {
            const isMe = message.sender === 'me';
            const read = isMe ? isRead(message) : false;
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.sender !== 'other');

            return (
              <div key={message.id || message._id || idx}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
              >
                {/* Avatar for other person */}
                {!isMe && (
                  <div className="w-7 flex-shrink-0 mr-1.5 self-end">
                    {showAvatar ? (
                      <img
                        src={chatAvatar}
                        alt={chatName}
                        className="w-7 h-7 rounded-full object-cover border border-white shadow-sm"
                        onError={e => { e.target.src = generateAvatar(chatName); }}
                      />
                    ) : null}
                  </div>
                )}

                <div
                  className={`relative rounded-2xl shadow-sm ${
                    isMe
                      ? 'rounded-br-sm text-gray-800'
                      : 'rounded-bl-sm text-gray-800'
                  }`}
                  style={{
                    maxWidth: 'min(75%, 360px)',
                    padding: '8px 12px 6px',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    background: isMe
                      ? 'linear-gradient(135deg, #ede9fe, #fce7f3)'
                      : 'white',
                    border: isMe ? '1px solid #ddd6fe' : '1px solid #f3f4f6'
                  }}
                >
                  <p className="text-[14px] leading-[20px] whitespace-pre-wrap break-words m-0 text-gray-800">
                    {renderMessageText(message.text)}
                  </p>
                  <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[11px] text-gray-400">{message.time}</span>
                    {isMe && (
                      <svg className={`w-4 h-4 ${read ? 'text-purple-500' : 'text-gray-400'}`}
                        viewBox="0 0 16 15" fill="none" aria-label={read ? 'Leído' : 'Enviado'}
                      >
                        <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"
                          fill="currentColor" />
                      </svg>
                    )}
                  </div>
                  {/* Bubble tail */}
                  <div
                    className={`absolute bottom-0 ${isMe ? 'right-[-7px]' : 'left-[-7px]'} w-4 h-4 overflow-hidden`}
                    style={{ pointerEvents: 'none' }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        background: isMe ? '#ede9fe' : 'white',
                        transform: isMe ? 'translateX(-6px) translateY(-6px)' : 'translateX(6px) translateY(-6px)',
                        boxShadow: isMe ? '-2px 2px 0 #ddd6fe' : '2px 2px 0 #f3f4f6'
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ─── Input Footer ─── */}
      <footer className="bg-white px-3 py-2.5 flex items-end gap-2 flex-shrink-0 border-t border-gray-100">
        <div
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 flex items-center min-w-0 transition-all focus-within:ring-2 focus-within:ring-purple-300 focus-within:bg-white focus-within:border focus-within:border-purple-200"
        >
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje..."
            className="flex-1 outline-none text-[15px] bg-transparent placeholder-gray-400 min-w-0 text-gray-800"
          />
          <Smile className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2 cursor-pointer hover:text-yellow-400 transition" />
        </div>

        <button
          onClick={handleSend}
          disabled={!newMessage.trim()}
          className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 shadow-md ${
            newMessage.trim()
              ? 'text-white hover:scale-105 active:scale-95'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
          style={newMessage.trim() ? { background: 'linear-gradient(135deg, #7C3AED, #EC4899)' } : {}}
        >
          <Send className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
}