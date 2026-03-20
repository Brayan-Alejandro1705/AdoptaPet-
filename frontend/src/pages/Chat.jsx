import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { chatService } from '../services/chatService';
import Header from '../components/common/Header';
import ChatList from '../components/common/ChatList';
import ChatWindow from '../components/common/ChatWindow';

export default function Chat() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  // Mobile: true = show list, false = show window
  const [showList, setShowList] = useState(true);

  const socket = useSocket();
  const socketRef = useRef(null);
  const [searchParams] = useSearchParams();

  const targetChatId = searchParams.get('chat');
  const autoMsg = searchParams.get('autoMsg');
  const autoMsgSentRef = useRef(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = String(user?.id || user?._id || '');

  useEffect(() => {
    if (socket) socketRef.current = socket;
  }, [socket]);

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
    const s = socketRef.current;
    if (!s || !chatId || !currentUserId) return;
    s.emit('mark_read', { chatId: String(chatId), readerId: String(currentUserId) });
  }, [currentUserId]);

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
    const s = socketRef.current;
    if (!autoMsg || !selectedChat || !s || !s.connected || autoMsgSentRef.current) return;
    const chatId = getChatId(selectedChat);
    if (targetChatId && chatId !== targetChatId) return;
    const timer = setTimeout(() => {
      const text = decodeURIComponent(autoMsg);
      const tempMessage = {
        id: `temp-auto-${Date.now()}`, _id: `temp-auto-${Date.now()}`,
        text, senderId: currentUserId, sender: 'me',
        time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        status: 'sent',
      };
      setMessages((prev) => [...prev, tempMessage]);
      s.emit('send_message', { chatId, senderId: currentUserId, text });
      autoMsgSentRef.current = true;
    }, 800);
    return () => clearTimeout(timer);
  }, [autoMsg, selectedChat, socket, targetChatId, currentUserId]);

  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail || {};
      const chatId = String(payload.chatId || '');
      if (!chatId || !selectedChat || getChatId(selectedChat) !== chatId) return;
      setMessages((prev) =>
        prev.map((m) => m.sender === 'me'
          ? { ...m, status: 'read', readAt: payload.readAt || new Date().toISOString() }
          : m
        )
      );
    };
    window.addEventListener('chat_messages_read', handler);
    return () => window.removeEventListener('chat_messages_read', handler);
  }, [selectedChat]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s || !selectedChat) return;
    const chatId = getChatId(selectedChat);
    s.emit('join_chat', chatId);
    markChatAsRead(chatId);
    markIncomingAsReadLocally();

    const handleNewMessage = (message) => {
      const senderId = String(message.senderId || message.sender?._id || message.sender?.id || '');
      if (senderId === currentUserId) return;
      const formattedMessage = {
        ...message, senderId, sender: 'other',
        time: message.time || new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, formattedMessage]);
      if (senderId) {
        setChats((prev) => prev.map((c) => getChatId(c) !== chatId ? c : { ...c, __otherUserId: senderId }));
        setSelectedChat((prev) => (!prev || getChatId(prev) !== chatId) ? prev : { ...prev, __otherUserId: senderId });
      }
      setChats((prev) => prev.map((c) => (getChatId(c) === chatId ? { ...c, lastMessage: message.text } : c)));
      markChatAsRead(chatId);
      markIncomingAsReadLocally();
    };

    s.on('receive_message', handleNewMessage);
    return () => s.off('receive_message', handleNewMessage);
  }, [socket, selectedChat, currentUserId, markChatAsRead, markIncomingAsReadLocally]);

  useEffect(() => {
    const s = socketRef.current;
    if (!s) return;
    const handleOnlineUsers = ({ userIds }) => {
      const onlineSet = new Set((userIds || []).map((u) => String(u)));
      setChats((prev) => prev.map((c) => applyOnlineToChat(c, onlineSet)));
      setSelectedChat((prev) => (prev ? applyOnlineToChat(prev, onlineSet) : prev));
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
    s.on('online_users', handleOnlineUsers);
    s.on('user_online', handleUserOnline);
    s.on('user_offline', handleUserOffline);
    s.emit('get_online_users');
    return () => {
      s.off('online_users', handleOnlineUsers);
      s.off('user_online', handleUserOnline);
      s.off('user_offline', handleUserOffline);
    };
  }, [socket, currentUserId]);

  const loadChats = async () => {
    try {
      const data = await chatService.getChats();
      const normalized = (data || []).map((c) => ({ ...c, online: !!c.online }));
      setChats(normalized);
      let chatToSelect = null;
      if (targetChatId) chatToSelect = normalized.find((c) => getChatId(c) === targetChatId);
      if (targetChatId && !chatToSelect) {
        try {
          const fresh = await chatService.getChats();
          const freshNorm = (fresh || []).map((c) => ({ ...c, online: !!c.online }));
          setChats(freshNorm);
          chatToSelect = freshNorm.find((c) => getChatId(c) === targetChatId) || freshNorm[0];
        } catch (_) { chatToSelect = normalized[0]; }
      } else if (!chatToSelect && normalized.length > 0) {
        chatToSelect = normalized[0];
      }
      if (chatToSelect) {
        setSelectedChat(chatToSelect);
        const chatId = getChatId(chatToSelect);
        await loadMessages(chatId, chatToSelect);
        markChatAsRead(chatId);
        markIncomingAsReadLocally();
        // On mobile, if there's a target chat, go directly to the window
        if (targetChatId) setShowList(false);
      }
      const s = socketRef.current;
      if (s) s.emit('get_online_users');
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
          ...m, senderId,
          sender: senderId === currentUserId ? 'me' : 'other',
          time: m.time || (m.createdAt ? new Date(m.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''),
        };
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
        const s = socketRef.current;
        if (s) s.emit('get_online_users');
      }
    } catch (error) {
      console.error('❌ Error al cargar mensajes:', error);
    }
  };

  const handleSendMessage = useCallback((text) => {
    if (!text?.trim() || !selectedChat) return;
    const s = socketRef.current;
    if (!s) return;
    if (!s.connected) {
      s.connect();
      setTimeout(() => { if (s.connected) s.emit('send_message', { chatId: getChatId(selectedChat), senderId: currentUserId, text: text.trim() }); }, 1000);
      return;
    }
    const chatId = getChatId(selectedChat);
    const tempMessage = {
      id: `temp-${Date.now()}`, _id: `temp-${Date.now()}`,
      text: text.trim(), senderId: currentUserId, sender: 'me',
      time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };
    setMessages((prev) => [...prev, tempMessage]);
    setChats((prev) => prev.map((c) => getChatId(c) === chatId ? { ...c, lastMessage: text.trim() } : c));
    s.emit('send_message', { chatId, senderId: currentUserId, text: text.trim() });
  }, [selectedChat, currentUserId]);

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    setShowList(false); // On mobile, go to window
    const chatId = getChatId(chat);
    await loadMessages(chatId, chat);
    markChatAsRead(chatId);
    markIncomingAsReadLocally();
    const s = socketRef.current;
    if (s) s.emit('get_online_users');
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #f3f0ff, #fdf2f8)' }}>
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg, #7C3AED22, #EC489944)' }}
            >
              <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Cargando mensajes...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Empty state ───
  if (chats.length === 0) {
    return (
      <div className="h-screen flex flex-col" style={{ background: 'linear-gradient(180deg, #f3f0ff, #fdf2f8)' }}>
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-xs">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">Sin conversaciones</h2>
            <p className="text-gray-500 text-sm">
              Cuando contactes a alguien sobre una mascota, tus chats aparecerán aquí
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* ─── Desktop: side-by-side ─── */}
        <div className="hidden md:flex w-full h-full">
          {/* List Panel */}
          <div className="w-80 xl:w-96 flex-shrink-0 h-full border-r border-gray-200 overflow-hidden shadow-lg">
            <ChatList chats={chats} selectedChat={selectedChat} onSelectChat={handleSelectChat} />
          </div>

          {/* Window Panel */}
          <div className="flex-1 h-full overflow-hidden p-4" style={{ background: 'linear-gradient(180deg, #f3f0ff, #fdf2f8)' }}>
            {selectedChat ? (
              <ChatWindow
                chat={selectedChat}
                messages={messages}
                onSendMessage={handleSendMessage}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-3">👈</div>
                  <p className="text-gray-400 font-medium">Selecciona una conversación</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Mobile: full screen toggle ─── */}
        <div className="md:hidden w-full h-full">
          {showList ? (
            /* Chat List - full screen */
            <ChatList chats={chats} selectedChat={selectedChat} onSelectChat={handleSelectChat} />
          ) : (
            /* Chat Window - full screen */
            selectedChat && (
              <ChatWindow
                chat={selectedChat}
                messages={messages}
                onSendMessage={handleSendMessage}
                onBack={() => setShowList(true)}
              />
            )
          )}
        </div>

      </div>
    </div>
  );
}