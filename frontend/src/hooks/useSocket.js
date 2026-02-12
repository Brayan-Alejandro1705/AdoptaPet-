// frontend/src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const useSocket = () => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = user?.id || user?._id;

    const s = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    s.on('connect', () => {
      console.log('✅ Conectado a Socket.io:', s.id);

      if (currentUserId) {
        s.emit('register', String(currentUserId));
        console.log('🟢 register enviado:', String(currentUserId));
      } else {
        console.warn('⚠️ No pude registrar presencia: user.id/user._id no existe');
      }
    });

    s.on('disconnect', () => {
      console.log('❌ Desconectado de Socket.io');
    });

    s.on('connect_error', (err) => {
      console.error('❌ connect_error Socket.io:', err.message);
    });

    setSocket(s);

    return () => {
      s.disconnect();
      console.log('🔌 Socket desconectado');
    };
  }, []);

  return socket;
};
