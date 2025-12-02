export default function ChatList({ chats, selectedChat, onSelectChat }) {
  return (
    <aside className="bg-white rounded-xl shadow-lg overflow-hidden h-full">
      <div className="p-4 border-b bg-gradient-to-r from-purple-500 to-pink-500">
        <h2 className="text-lg font-semibold text-white">Mensajes</h2>
      </div>
      
      <div className="overflow-y-auto h-[calc(100%-65px)]">
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className={`
              flex items-center gap-3 p-4 cursor-pointer transition-all
              hover:bg-purple-50 border-b border-gray-100
              ${selectedChat?.id === chat.id ? 'bg-purple-50' : ''}
            `}
          >
            <div className="relative">
              <img 
                src={chat.avatar} 
                alt={chat.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {chat.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800 truncate">{chat.name}</p>
                {chat.unread > 0 && (
                  <span className="bg-purple-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {chat.unread}
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm truncate">{chat.lastMessage}</p>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}