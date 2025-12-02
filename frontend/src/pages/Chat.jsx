import { useState } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import ChatList from '../components/common/ChatList';
import ChatWindow from '../components/common/ChatWindow';

// Datos dummy de chats
const CHATS_LIST = [
  {
    id: 1,
    name: "Refugio San Luis",
    avatar: "https://i.imgur.com/3G0z6YV.jpeg",
    lastMessage: "Claro, podemos agendar una visita...",
    online: true,
    unread: 2
  },
  {
    id: 2,
    name: "Fundación Huellitas",
    avatar: "https://via.placeholder.com/48",
    lastMessage: "¿Ya viste a los gatitos nuevos?",
    online: false,
    unread: 0
  },
  {
    id: 3,
    name: "Adopta Cali",
    avatar: "https://via.placeholder.com/48",
    lastMessage: "Gracias por tu interés 🐾",
    online: true,
    unread: 1
  }
];

// Mensajes iniciales
const INITIAL_MESSAGES = [
  {
    id: 1,
    text: "Hola 🐾 ¿sigues interesado en adoptar a la perrita?",
    time: "10:02 AM",
    sender: "other"
  },
  {
    id: 2,
    text: "Sí, claro 😄 Me gustaría visitarla.",
    time: "10:03 AM",
    sender: "me"
  },
  {
    id: 3,
    text: "Perfecto, hoy estamos disponibles hasta las 5pm 🐶💕",
    time: "10:06 AM",
    sender: "other"
  }
];

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState(CHATS_LIST[0]);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [showChatList, setShowChatList] = useState(false);

  const handleSendMessage = (text) => {
    const newMessage = {
      id: messages.length + 1,
      text: text,
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      sender: "me"
    };
    setMessages([...messages, newMessage]);
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setShowChatList(false);
  };

  return (
    <div className="min-h-screen bg-[#efeae2] pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          {/* SIDEBAR IZQUIERDO - Navegación principal */}
          <div className="hidden md:block md:col-span-3">
            <Sidebar />
          </div>

          {/* CONTENIDO PRINCIPAL - Chat */}
          <main className="col-span-1 md:col-span-9">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-140px)]">
              
              {/* LISTA DE CHATS */}
              <div className={`
                ${showChatList ? 'block' : 'hidden'} md:block
                md:col-span-4
              `}>
                <ChatList 
                  chats={CHATS_LIST}
                  selectedChat={selectedChat}
                  onSelectChat={handleSelectChat}
                />
              </div>

              {/* VENTANA DE CHAT */}
              <div className={`
                ${showChatList ? 'hidden' : 'block'} md:block
                col-span-1 md:col-span-8
              `}>
                <ChatWindow 
                  chat={selectedChat}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  onBack={() => setShowChatList(true)}
                />
              </div>

            </div>
          </main>
          
        </div>
      </div>

      <BottomNav />
    </div>
  );
}