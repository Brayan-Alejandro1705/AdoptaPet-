import { useState } from 'react';
import { Search } from 'lucide-react';

export default function ChatList({ chats, selectedChat, onSelectChat }) {
  const [search, setSearch] = useState('');

  const filtered = chats.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (time) => {
    if (!time) return '';
    return time;
  };

  return (
    <aside className="flex flex-col h-full w-full min-w-0 bg-white">

      {/* Header estilo WhatsApp */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 flex-shrink-0">
        <h2 className="text-lg font-bold text-white tracking-wide">Mensajes</h2>
      </div>

      {/* Buscador */}
      <div className="px-3 py-2 bg-white flex-shrink-0">
        <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-full px-3 py-2">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar o empezar un chat"
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 min-w-0"
          />
        </div>
      </div>

      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm">
            <span className="text-3xl mb-2">💬</span>
            No hay conversaciones
          </div>
        ) : (
          filtered.map(chat => {
            const isSelected = selectedChat?.id === chat.id || selectedChat?._id === chat._id;
            return (
              <div
                key={chat.id || chat._id}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center gap-3 px-3 py-3 cursor-pointer transition-colors border-b border-gray-100
                  ${isSelected ? 'bg-[#f0f2f5]' : 'hover:bg-[#f5f5f5]'}
                `}
              >
                {/* Avatar con indicador online */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={e => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name || 'U')}&background=7C3AED&color=fff`;
                    }}
                  />
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-semibold text-[15px] text-gray-900 truncate">{chat.name}</p>
                    {chat.lastMessageTime && (
                      <span className={`text-xs flex-shrink-0 ${chat.unread > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-500 truncate flex-1">
                      {chat.lastMessage || 'Sin mensajes'}
                    </p>
                    {chat.unread > 0 && (
                      <span className="flex-shrink-0 bg-green-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                        {chat.unread > 99 ? '99+' : chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}