import { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { chatService } from '../services/chatService';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import ChatList from '../components/common/ChatList';
import ChatWindow from '../components/common/ChatWindow';

export default function Chat() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showChatList, setShowChatList] = useState(false);
  const socket = useSocket();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = user.id;

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (!socket || !selectedChat) return;

    socket.emit('join_chat', selectedChat.id);

    const handleNewMessage = (message) => {
      const formattedMessage = {
        ...message,
        sender: message.senderId === currentUserId ? 'me' : 'other'
      };

      setMessages(prev => [...prev, formattedMessage]);

      setChats(prev => prev.map(chat =>
        chat.id === selectedChat.id
          ? { ...chat, lastMessage: message.text }
          : chat
      ));
    };

    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('receive_message', handleNewMessage);
    };
  }, [socket, selectedChat, currentUserId]);

  const loadChats = async () => {
    try {
      const data = await chatService.getChats();
      setChats(data);

      if (data.length > 0) {
        setSelectedChat(data[0]);
        loadMessages(data[0].id);
      }
    } catch (error) {
      console.error('❌ Error al cargar chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId) => {
    try {
      const data = await chatService.getMessages(chatId);

      // OJO: Asegura formato sender si backend no lo trae igual
      const formatted = data.map(m => ({
        ...m,
        sender: m.senderId === currentUserId ? 'me' : (m.sender ?? 'other')
      }));

      setMessages(formatted);
    } catch (error) {
      console.error('❌ Error al cargar mensajes:', error);
    }
  };

  const handleSendMessage = (text) => {
    if (!socket || !selectedChat || !text.trim()) return;

    socket.emit('send_message', {
      chatId: selectedChat.id,
      senderId: currentUserId,
      text: text.trim()
    });
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setShowChatList(false);
    loadMessages(chat.id);
  };

  // ✅ Loading screen sin scroll global
  if (loading) {
    return (
      <div className="h-screen bg-[#efeae2] overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando chats...</p>
        </div>
      </div>
    );
  }

  // ✅ Empty screen sin scroll global
  if (chats.length === 0) {
    return (
      <div className="h-screen bg-[#efeae2] overflow-hidden flex flex-col">
        <Header />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
              <div className="hidden md:block md:col-span-3">
                <Sidebar />
              </div>
              <main className="col-span-1 md:col-span-9">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h2 className="text-2xl font-bold text-gray-700 mb-2">
                    No tienes conversaciones
                  </h2>
                  <p className="text-gray-500">
                    Cuando contactes a alguien sobre una mascota, tus chats aparecerán aquí
                  </p>
                </div>
              </main>
            </div>
          </div>
        </div>
        <div className="shrink-0">
          <BottomNav />
        </div>
      </div>
    );
  }

  // ✅ Pantalla de chat: h-screen + overflow-hidden + flex-col
  return (
    <div className="h-screen bg-[#efeae2] overflow-hidden flex flex-col">
      <Header />

      {/* Contenido */}
      <div className="flex-1 min-h-0">
        <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6 h-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-full min-h-0">

            <div className="hidden md:block md:col-span-3 h-full min-h-0">
              <Sidebar />
            </div>

            <main className="col-span-1 md:col-span-9 h-full min-h-0">
              {/* ✅ NO calc(100vh-140px), usamos h-full */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full min-h-0">

                <div
                  className={`
                    ${showChatList ? 'block' : 'hidden'} md:block
                    md:col-span-4
                    h-full min-h-0
                  `}
                >
                  <ChatList
                    chats={chats}
                    selectedChat={selectedChat}
                    onSelectChat={handleSelectChat}
                  />
                </div>

                <div
                  className={`
                    ${showChatList ? 'hidden' : 'block'} md:block
                    col-span-1 md:col-span-8
                    h-full min-h-0
                  `}
                >
                  {selectedChat ? (
                    <ChatWindow
                      chat={selectedChat}
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      onBack={() => setShowChatList(true)}
                    />
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg h-full flex items-center justify-center">
                      <p className="text-gray-400">Selecciona un chat para comenzar</p>
                    </div>
                  )}
                </div>

              </div>
            </main>

          </div>
        </div>
      </div>

      <div className="shrink-0">
        <BottomNav />
      </div>
    </div>
  );
}
