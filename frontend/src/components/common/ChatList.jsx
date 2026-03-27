import { useState } from 'react';
import { Search, MessageCircle } from 'lucide-react';

const generateAvatar = (name = 'U') => {
  const initials = name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const colors = ['#7C3AED','#EC4899','#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${colors[Math.abs(hash) % colors.length].slice(1)}&color=fff&size=128`;
};

const formatTime = (time) => {
  if (!time) return '';
  if (typeof time === 'string' && time.includes(':')) return time;
  try {
    const d = new Date(time);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'ahora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' });
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  } catch { return time; }
};

export default function ChatList({ chats, selectedChat, onSelectChat }) {
  const [search, setSearch] = useState('');

  const filtered = chats.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="flex flex-col h-full w-full min-w-0 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7C3AED, #EC4899)' }}>
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-white opacity-90" />
          <h2 className="text-lg font-bold text-white tracking-wide">Mensajes</h2>
        </div>
        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
          {chats.length}
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5 transition-all focus-within:ring-2 focus-within:ring-purple-200">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400 min-w-0"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2 px-4 text-center">
            <MessageCircle className="w-12 h-12 text-gray-200" />
            <p className="text-sm font-medium text-gray-400">
              {search ? 'No encontramos esa conversación' : 'No tienes conversaciones aún'}
            </p>
          </div>
        ) : (
          filtered.map(chat => {
            const isSelected = selectedChat?.id === chat.id || selectedChat?._id === chat._id;
            return (
              <div
                key={chat.id || chat._id}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-150 border-b border-gray-50
                  ${isSelected
                    ? 'bg-purple-50 border-l-4 border-l-purple-500'
                    : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }
                `}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={chat.avatar || generateAvatar(chat.name || 'U')}
                    alt={chat.name}
                    className="w-12 h-12 rounded-full object-cover shadow-sm"
                    onError={e => { e.target.src = generateAvatar(chat.name || 'U'); }}
                  />
                  {chat.online && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full shadow-sm" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={`font-semibold text-sm truncate ${isSelected ? 'text-purple-700' : 'text-gray-900'}`}>
                      {chat.name || 'Usuario'}
                    </p>
                    {chat.lastMessageTime && (
                      <span className={`text-[11px] flex-shrink-0 ${chat.unread > 0 ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                        {formatTime(chat.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 truncate flex-1">
                      {chat.lastMessage || (chat.online ? '● En línea' : 'Sin mensajes')}
                    </p>
                    {chat.unread > 0 && (
                      <span className="flex-shrink-0 bg-purple-500 text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-sm">
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