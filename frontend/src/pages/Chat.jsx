import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import { chatService } from '../services/chatService';
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
  const currentUserId = String(user?.id || user?._id || '');

  const getId = (x) => {
    if (!x) return null;
    if (typeof x === 'string') return String(x);
    if (x.id) return String(x.id);
    if (x._id) return String(x._id);
    return null;
  };

  const getChatId = (c) => String(c?.id || c?._id || '');

  const getOtherUserId = (chat) => {
    if (!chat) return null;
    if (chat.__otherUserId) return String(chat.__otherUserId);
    const arrays = [chat.participants, chat.users, chat.members];
    for (const arr of arrays) {
      if (Array.isArray(arr)) {
        const ids = arr.map(getId).filter(Boolean);
        const other = ids.find((id) => id !== currentUserId);
        if (other) return other;
      }
    }
    const direct = getId(chat.otherUserId || chat.userId || chat.receiverId || chat.toUserId);
    if (direct && direct !== currentUserId) return direct;
    return null;
  };

  const applyOnlineToChat = (chat, onlineSet) => {
    const otherId = getOtherUserId(chat);
    return { ...chat, online: otherId ? onlineSet.has(otherId) : false };
  };

  const markChatAsRead = useCallback((chatId) => {
    if (!socket || !chatId || !currentUserId) return;
    socket.emit('mark_read', { chatId: String(chatId), readerId: String(currentUserId) });
  }, [socket, currentUserId]);

  const markIncomingAsReadLocally = useCallback(() => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.sender === 'other' && m.status !== 'read' && !m.readAt)
          return { ...m, status: 'read', readAt: new Date().toISOString() };
        return m;
      })
    );
  }, []);

  useEffect(() => { loadChats(); }, []);

  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail || {};
      const chatId = String(payload.chatId || '');
      if (!chatId || !selectedChat || getChatId(selectedChat) !== chatId) return;
      setMessages((prev) =>
        prev.map((m) => m.sender === 'me'
          ? { ...m, status: 'read', readAt: payload.readAt || new Date().toISOString() }
          : m)
      );
    };
    window.addEventListener('chat_messages_read', handler);
    return () => window.removeEventListener('chat_messages_read', handler);
  }, [selectedChat]);

  useEffect(() => {
    if (!socket || !selectedChat) return;
    const chatId = getChatId(selectedChat);
    socket.emit('join_chat', chatId);
    markChatAsRead(chatId);
    markIncomingAsReadLocally();

    const handleNewMessage = (message) => {
      const senderId = String(message.senderId || message.sender?._id || message.sender?.id || '');
      const formattedMessage = { ...message, senderId, sender: senderId === currentUserId ? 'me' : 'other' };
      setMessages((prev) => [...prev, formattedMessage]);
      if (senderId && senderId !== currentUserId) {
        setChats((prev) => prev.map((c) => getChatId(c) !== chatId ? c : { ...c, __otherUserId: senderId }));
        setSelectedChat((prev) => (!prev || getChatId(prev) !== chatId) ? prev : { ...prev, __otherUserId: senderId });
      }
      setChats((prev) => prev.map((c) => getChatId(c) === chatId ? { ...c, lastMessage: message.text } : c));
      if (senderId !== currentUserId && selectedChat && getChatId(selectedChat) === chatId) {
        markChatAsRead(chatId);
        markIncomingAsReadLocally();
      }
    };
    socket.on('receive_message', handleNewMessage);
    return () => { socket.off('receive_message', handleNewMessage); };
  }, [socket, selectedChat, currentUserId, markChatAsRead, markIncomingAsReadLocally]);

  useEffect(() => {
    if (!socket) return;
    const handleOnlineUsers = ({ userIds }) => {
      const onlineSet = new Set((userIds || []).map((u) => String(u)));
      setChats((prev) => prev.map((c) => applyOnlineToChat(c, onlineSet)));
      setSelectedChat((prev) => prev ? applyOnlineToChat(prev, onlineSet) : prev);
    };
    const handleUserOnline = ({ userId }) => {
      const uid = String(userId);
      setChats((prev) => prev.map((c) => getOtherUserId(c) === uid ? { ...c, online: true } : c));
      setSelectedChat((prev) => prev && getOtherUserId(prev) === uid ? { ...prev, online: true } : prev);
    };
    const handleUserOffline = ({ userId }) => {
      const uid = String(userId);
      setChats((prev) => prev.map((c) => getOtherUserId(c) === uid ? { ...c, online: false } : c));
      setSelectedChat((prev) => prev && getOtherUserId(prev) === uid ? { ...prev, online: false } : prev);
    };
    socket.on('online_users', handleOnlineUsers);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.emit('get_online_users');
    return () => {
      socket.off('online_users', handleOnlineUsers);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [socket, currentUserId]);

  const loadChats = async () => {
    try {
      const data = await chatService.getChats();
      const normalized = (data || []).map((c) => ({ ...c, online: !!c.online }));
      setChats(normalized);
      if (normalized.length > 0) {
        const first = normalized[0];
        setSelectedChat(first);
        await loadMessages(getChatId(first), first);
        markChatAsRead(getChatId(first));
        markIncomingAsReadLocally();
      }
      socket?.emit('get_online_users');
    } catch (error) {
      console.error('Error al cargar chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId, chatObj = null) => {
    try {
      const data = await chatService.getMessages(chatId);
      const formatted = (data || []).map((m) => {
        const senderId = String(m.senderId || m.sender?._id || m.sender?.id || '');
        return { ...m, senderId, sender: senderId === currentUserId ? 'me' : 'other' };
      });
      setMessages(formatted);
      markChatAsRead(chatId);
      markIncomingAsReadLocally();
      const otherFromMessages = formatted.find((m) => m.senderId && m.senderId !== currentUserId)?.senderId;
      if (otherFromMessages) {
        setChats((prev) => prev.map((c) => getChatId(c) === chatId ? { ...c, __otherUserId: otherFromMessages } : c));
        setSelectedChat((prev) => {
          const base = prev || chatObj;
          if (!base || getChatId(base) !== chatId) return prev;
          return { ...base, __otherUserId: otherFromMessages };
        });
        socket?.emit('get_online_users');
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const handleSendMessage = (text) => {
    if (!socket || !selectedChat || !text.trim()) return;
    socket.emit('send_message', { chatId: getChatId(selectedChat), senderId: currentUserId, text: text.trim() });
  };

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setShowChatList(false);
    const chatId = getChatId(chat);
    await loadMessages(chatId, chat);
    markChatAsRead(chatId);
    markIncomingAsReadLocally();
    socket?.emit('get_online_users');
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#efeae2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando chats...</p>
        </div>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="h-screen bg-[#efeae2] flex flex-col">
        {/* Sin header aquí también */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-xl shadow-lg p-10 text-center max-w-sm w-full">
            <div className="text-5xl mb-3">💬</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No tienes conversaciones</h2>
            <p className="text-gray-500 text-sm">Cuando contactes a alguien sobre una mascota, tus chats aparecerán aquí</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    /*
      Sin Header ni Sidebar en móvil.
      El chat ocupa toda la pantalla excepto la BottomNav.
      Usamos 100dvh para contar correctamente la barra del navegador móvil.
    */
    <div className="bg-[#efeae2]" style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Área del chat — ocupa todo menos los 64px de BottomNav */}
      <div className="flex-1 min-h-0" style={{ paddingBottom: '64px' }}>
        <div className="h-full flex gap-0 md:gap-4 md:p-4">

          {/* Lista de chats */}
          <div className={`${showChatList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-72 flex-shrink-0 h-full`}>
            <ChatList chats={chats} selectedChat={selectedChat} onSelectChat={handleSelectChat} />
          </div>

          {/* Ventana de chat */}
          <div className={`${showChatList ? 'hidden' : 'flex'} md:flex flex-col flex-1 min-w-0 h-full`}>
            {selectedChat ? (
              <ChatWindow
                chat={selectedChat}
                messages={messages}
                onSendMessage={handleSendMessage}
                onBack={() => setShowChatList(true)}
              />
            ) : (
              <div className="bg-white md:rounded-xl shadow-lg h-full flex items-center justify-center">
                <p className="text-gray-400 text-sm">Selecciona un chat para comenzar</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* BottomNav fija abajo */}
      <BottomNav />
    </div>
  );
}