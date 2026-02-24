import { useState, useEffect, useCallback } from 'react';
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

  const markChatAsRead = useCallback(
    (chatId) => {
      if (!socket || !chatId || !currentUserId) return;
      socket.emit('mark_read', { chatId: String(chatId), readerId: String(currentUserId) });
    },
    [socket, currentUserId]
  );

  const markIncomingAsReadLocally = useCallback(() => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.sender === 'other' && m.status !== 'read' && !m.readAt) {
          return { ...m, status: 'read', readAt: new Date().toISOString() };
        }
        return m;
      })
    );
  }, []);

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail || {};
      const chatId = String(payload.chatId || '');
      if (!chatId) return;

      if (!selectedChat || getChatId(selectedChat) !== chatId) return;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.sender === 'me') {
            return {
              ...m,
              status: 'read',
              readAt: payload.readAt || new Date().toISOString()
            };
          }
          return m;
        })
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

      const formattedMessage = {
        ...message,
        senderId,
        sender: senderId === currentUserId ? 'me' : 'other'
      };

      setMessages((prev) => [...prev, formattedMessage]);

      if (senderId && senderId !== currentUserId) {
        setChats((prev) =>
          prev.map((c) => {
            if (getChatId(c) !== chatId) return c;
            return { ...c, __otherUserId: senderId };
          })
        );

        setSelectedChat((prev) => {
          if (!prev || getChatId(prev) !== chatId) return prev;
          return { ...prev, __otherUserId: senderId };
        });
      }

      setChats((prev) =>
        prev.map((c) => (getChatId(c) === chatId ? { ...c, lastMessage: message.text } : c))
      );

      const esDelOtro = senderId && senderId !== currentUserId;
      const chatAbierto = selectedChat && getChatId(selectedChat) === chatId;

      if (chatAbierto && esDelOtro) {
        markChatAsRead(chatId);
        markIncomingAsReadLocally();
      }
    };

    socket.on('receive_message', handleNewMessage);

    return () => {
      socket.off('receive_message', handleNewMessage);
    };
  }, [socket, selectedChat, currentUserId, markChatAsRead, markIncomingAsReadLocally]);

  useEffect(() => {
    if (!socket) return;

    const handleOnlineUsers = ({ userIds }) => {
      const onlineSet = new Set((userIds || []).map((u) => String(u)));
      setChats((prev) => prev.map((c) => applyOnlineToChat(c, onlineSet)));
      setSelectedChat((prev) => (prev ? applyOnlineToChat(prev, onlineSet) : prev));
    };

    const handleUserOnline = ({ userId }) => {
      const uid = String(userId);
      setChats((prev) => prev.map((c) => (getOtherUserId(c) === uid ? { ...c, online: true } : c)));
      setSelectedChat((prev) => (prev && getOtherUserId(prev) === uid ? { ...prev, online: true } : prev));
    };

    const handleUserOffline = ({ userId }) => {
      const uid = String(userId);
      setChats((prev) => prev.map((c) => (getOtherUserId(c) === uid ? { ...c, online: false } : c)));
      setSelectedChat((prev) => (prev && getOtherUserId(prev) === uid ? { ...prev, online: false } : prev));
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
        const firstChatId = getChatId(first);
        await loadMessages(firstChatId, first);

        markChatAsRead(firstChatId);
        markIncomingAsReadLocally();
      }

      socket?.emit('get_online_users');
    } catch (error) {
      console.error('❌ Error al cargar chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (chatId, chatObj = null) => {
    try {
      const data = await chatService.getMessages(chatId);

      const formatted = (data || []).map((m) => {
        const senderId = String(m.senderId || m.sender?._id || m.sender?.id || '');
        return {
          ...m,
          senderId,
          sender: senderId === currentUserId ? 'me' : 'other'
        };
      });

      setMessages(formatted);

      markChatAsRead(chatId);
      markIncomingAsReadLocally();

      const otherFromMessages = formatted.find((m) => m.senderId && m.senderId !== currentUserId)?.senderId;

      if (otherFromMessages) {
        setChats((prev) =>
          prev.map((c) => (getChatId(c) === chatId ? { ...c, __otherUserId: otherFromMessages } : c))
        );

        setSelectedChat((prev) => {
          const base = prev || chatObj;
          if (!base || getChatId(base) !== chatId) return prev;
          return { ...base, __otherUserId: otherFromMessages };
        });

        socket?.emit('get_online_users');
      }
    } catch (error) {
      console.error('❌ Error al cargar mensajes:', error);
    }
  };

  const handleSendMessage = (text) => {
    if (!socket || !selectedChat || !text.trim()) return;

    socket.emit('send_message', {
      chatId: getChatId(selectedChat),
      senderId: currentUserId,
      text: text.trim()
    });
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
      <div className="h-screen bg-[#efeae2] overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-00 mx-auto" />
          <p className="mt-4 text-gray-600">Cargando chats...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="h-screen bg-[#efeae2] overflow-hidden flex flex-col">
      <Header />

      <div className="flex-1 min-h-0">
        <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6 h-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 h-full min-h-0">
            <div className="hidden md:block md:col-span-3 h-full min-h-0">
              <Sidebar />
            </div>

            <main className="col-span-1 md:col-span-9 h-full min-h-0">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-full min-h-0">
                <div className={`${showChatList ? 'block' : 'hidden'} md:block md:col-span-4 h-full min-h-0`}>
                  <ChatList chats={chats} selectedChat={selectedChat} onSelectChat={handleSelectChat} />
                </div>

                <div className={`${showChatList ? 'hidden' : 'block'} md:block col-span-1 md:col-span-8 h-full min-h-0`}>
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