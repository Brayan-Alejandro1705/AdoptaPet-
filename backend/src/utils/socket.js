// backend/utils/socket.js
const { Server } = require('socket.io');
const Message = require('../models/Message');
const Chat = require('../models/Chat');

let io;

// ✅ userId -> Set(socketIds)
const onlineUsers = new Map();

const addOnlineUser = (userId, socketId) => {
  const uid = String(userId);
  if (!onlineUsers.has(uid)) onlineUsers.set(uid, new Set());
  onlineUsers.get(uid).add(socketId);
};

const removeOnlineUser = (userId, socketId) => {
  const uid = String(userId);
  const set = onlineUsers.get(uid);
  if (!set) return false;

  set.delete(socketId);
  if (set.size === 0) {
    onlineUsers.delete(uid);
    return true; // quedó offline real
  }
  return false;
};

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  console.log('🔌 Inicializando Socket.io...');

  io.on('connection', (socket) => {
    console.log('✅ Usuario conectado:', socket.id);

    // ✅ REGISTRO DE PRESENCIA
    socket.on('register', (userId) => {
      if (!userId) return;

      const uid = String(userId);
      socket.data.userId = uid;

      const wasOffline = !onlineUsers.has(uid);
      addOnlineUser(uid, socket.id);

      // Enviamos lista inicial al que se conectó
      socket.emit('online_users', { userIds: Array.from(onlineUsers.keys()) });

      if (wasOffline) {
        io.emit('user_online', { userId: uid });
        console.log('🟢 user_online emit:', uid);
      }

      console.log(`🟢 Registrado en presencia: ${uid} (${socket.id})`);
    });

    socket.on('get_online_users', () => {
      socket.emit('online_users', { userIds: Array.from(onlineUsers.keys()) });
    });

    // Unirse a un chat específico
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`👤 ${socket.id} se unió al chat ${chatId}`);
    });

    // Enviar mensaje
    socket.on('send_message', async (data) => {
      try {
        const { chatId, senderId, text } = data;
        if (!chatId || !senderId || !text) return;

        const newMessage = new Message({
          chat: chatId,
          sender: senderId,
          text
        });

        await newMessage.save();
        await newMessage.populate('sender', 'nombre name avatar');

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: text,
          updatedAt: new Date()
        });

        const senderName = newMessage.sender?.nombre || newMessage.sender?.name || 'Usuario';

        const messageData = {
          id: String(newMessage._id),
          text: newMessage.text,
          time: new Date(newMessage.createdAt).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          senderId: String(newMessage.sender._id),
          senderName,
          senderAvatar: newMessage.sender.avatar
        };

        io.to(`chat_${chatId}`).emit('receive_message', messageData);
      } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error al enviar mensaje' });
      }
    });

    // ✅ TYPING START
    socket.on('typing', ({ chatId, userId }) => {
      if (!chatId || !userId) return;
      socket.to(`chat_${chatId}`).emit('user_typing', {
        chatId,
        userId: String(userId),
        isTyping: true
      });
    });

    // ✅ TYPING STOP
    socket.on('stop_typing', ({ chatId, userId }) => {
      if (!chatId || !userId) return;
      socket.to(`chat_${chatId}`).emit('user_typing', {
        chatId,
        userId: String(userId),
        isTyping: false
      });
    });

    socket.on('disconnect', () => {
      const userId = socket.data.userId;
      console.log('❌ socket disconnected:', socket.id, 'userId:', userId);

      if (userId) {
        const becameOffline = removeOnlineUser(userId, socket.id);
        if (becameOffline) {
          io.emit('user_offline', { userId: String(userId) });
          console.log('🔴 user_offline emit:', userId);
        }
      }
    });
  });

  console.log('✅ Socket.io inicializado correctamente');
  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io no ha sido inicializado');
  return io;
};

module.exports = { initializeSocket, getIO };
