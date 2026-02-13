// frontend/src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = String(user?.id || user?._id || '');

    const s = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500
    });

    const registerPresence = () => {
      if (currentUserId) {
        s.emit('register', currentUserId);
        console.log('🟢 register enviado:', currentUserId);
      } else {
        console.warn('⚠️ No pude registrar presencia: user.id/user._id no existe');
      }
    };

    s.on('connect', () => {
      console.log('✅ Conectado a Socket.io:', s.id);
      registerPresence();
    });

    // ✅ si reconecta, volvemos a registrar presencia
    s.io.on('reconnect', () => {
      console.log('🔄 Socket reconectado');
      registerPresence();
    });

    s.on('disconnect', (reason) => {
      console.log('❌ Desconectado de Socket.io:', reason);
    });

    s.on('connect_error', (err) => {
      console.error('❌ connect_error Socket.io:', err.message);
    });

    /**
     * ✅ ACTUALIZADO:
     * backend ahora emite:
     *  - chatUnreadCount: cantidad de chats con no leídos (badge del Header)
     *  - unreadByChat: { chatId: cantidadMensajesSinLeer } (para ChatList)
     */
    s.on('unread_count', ({ chatUnreadCount, unreadByChat }) => {
      const safeChats = Number.isFinite(chatUnreadCount) ? chatUnreadCount : 0;

      // badge del Header (solo chats)
      localStorage.setItem('chat_unread_count', String(safeChats));

      // mapa por chat (para bandeja / ChatList)
      localStorage.setItem('chat_unread_by_chat', JSON.stringify(unreadByChat || {}));

      // 🔔 eventos para que otros componentes reaccionen en tiempo real
      window.dispatchEvent(
        new CustomEvent('chat_unread_count', { detail: { count: safeChats } })
      );

      window.dispatchEvent(
        new CustomEvent('chat_unread_by_chat', {
          detail: { unreadByChat: unreadByChat || {} }
        })
      );
    });

    // ✅ evento cuando el otro leyó mensajes de un chat (✔✔ púrpura)
    s.on('messages_read', (payload) => {
      // payload: { chatId, readAt, readerId }
      window.dispatchEvent(new CustomEvent('chat_messages_read', { detail: payload }));
    });

    setSocket(s);

    return () => {
      s.off('unread_count');
      s.off('messages_read');
      s.disconnect();
      console.log('🔌 Socket desconectado');
    };
  }, []);

  return socket;
};
