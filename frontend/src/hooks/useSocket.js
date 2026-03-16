// frontend/src/hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}`;

let globalSocket = null;

export const useSocket = () => {
  const socketRef = useRef(null);
  const [, forceUpdate] = useState(0); // para forzar re-render cuando el socket esté listo

  useEffect(() => {
    // Si ya hay un socket conectado, reutilizarlo
    if (globalSocket && globalSocket.connected) {
      socketRef.current = globalSocket;
      forceUpdate(n => n + 1);
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = String(user?.id || user?._id || '');

    const s = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500
    });

    globalSocket = s;
    socketRef.current = s;

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
      socketRef.current = s;
      forceUpdate(n => n + 1); // notificar que el socket ya está listo
    });

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

    s.on('unread_count', ({ chatUnreadCount, unreadByChat }) => {
      const safeChats = Number.isFinite(chatUnreadCount) ? chatUnreadCount : 0;
      localStorage.setItem('chat_unread_count', String(safeChats));
      localStorage.setItem('chat_unread_by_chat', JSON.stringify(unreadByChat || {}));
      window.dispatchEvent(new CustomEvent('chat_unread_count', { detail: { count: safeChats } }));
      window.dispatchEvent(new CustomEvent('chat_unread_by_chat', { detail: { unreadByChat: unreadByChat || {} } }));
    });

    s.on('messages_read', (payload) => {
      window.dispatchEvent(new CustomEvent('chat_messages_read', { detail: payload }));
    });

    return () => {
      s.off('unread_count');
      s.off('messages_read');
    };
  }, []);

  return socketRef.current;
};