// backend/utils/socket.js
const mongoose = require('mongoose');
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

/**
 * ✅ Emitir:
 * - chatUnreadCount: cantidad de CHATS con al menos 1 mensaje sin leer (badge del Header)
 * - unreadByChat: { chatId: cantidadMensajesSinLeer } (para tu bandeja/ChatList)
 */
const emitUnreadCountToUser = async (userId) => {
  try {
    if (!userId) return;
    const uid = String(userId);

    // Emitir a TODOS los sockets del usuario (si está online)
    const sockets = onlineUsers.get(uid);
    if (!sockets || sockets.size === 0) return;

    // ✅ 1) Cantidad de chats con mensajes sin leer (NO suma de mensajes)
    const chatsWithUnread = await Message.distinct('chat', {
      receiver: new mongoose.Types.ObjectId(uid),
      readAt: null
    });

    const chatUnreadCount = chatsWithUnread.length;

    // ✅ 2) Cantidad de mensajes sin leer por chat
    const unreadByChatAgg = await Message.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(uid),
          readAt: null
        }
      },
      { $group: { _id: '$chat', count: { $sum: 1 } } }
    ]);

    const unreadByChat = {};
    for (const row of unreadByChatAgg) {
      unreadByChat[String(row._id)] = row.count;
    }

    // ✅ Emitir payload completo
    for (const sid of sockets) {
      io.to(sid).emit('unread_count', {
        chatUnreadCount,
        unreadByChat
      });
    }
  } catch (e) {
    console.error('❌ emitUnreadCountToUser error:', e);
  }
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
    socket.on('register', async (userId) => {
      if (!userId) return;

      const uid = String(userId);
      socket.data.userId = uid;

      const wasOffline = !onlineUsers.has(uid);
      addOnlineUser(uid, socket.id);

      // Enviamos lista inicial al que se conectó
      socket.emit('online_users', { userIds: Array.from(onlineUsers.keys()) });

      // ✅ Enviar contador de no leídos al conectarse
      await emitUnreadCountToUser(uid);

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
      if (!chatId) return;
      socket.join(`chat_${chatId}`);
      console.log(`👤 ${socket.id} se unió al chat ${chatId}`);
    });

    // ✅ Enviar mensaje (GUARDANDO receiver)
    socket.on('send_message', async (data) => {
      try {
        const { chatId, senderId, text } = data;
        if (!chatId || !senderId || !text || !String(text).trim()) return;

        // Buscar el chat para obtener el receptor
        const chat = await Chat.findById(chatId).lean();
        if (!chat) return;

        const sid = String(senderId);
        const otherUserId = chat.participants
          ?.map((p) => String(p))
          ?.find((p) => p !== sid);

        if (!otherUserId) return;

        // Crear mensaje con receiver + status
        const newMessage = new Message({
          chat: chatId,
          sender: senderId,
          receiver: otherUserId, // ✅ CLAVE PARA VISTO / CONTADOR
          text: String(text).trim(),
          status: 'sent'
        });

        await newMessage.save();
        await newMessage.populate('sender', 'nombre name avatar');

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: newMessage.text,
          updatedAt: new Date()
        });

        const senderName =
          newMessage.sender?.nombre || newMessage.sender?.name || 'Usuario';

        const messageData = {
          id: String(newMessage._id),
          chatId: String(chatId),

          text: newMessage.text,
          time: new Date(newMessage.createdAt).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
          }),

          senderId: String(newMessage.sender._id),
          senderName,
          senderAvatar: newMessage.sender.avatar,

          // ✅ para checks y visto
          receiver: String(otherUserId),
          status: newMessage.status || 'sent',
          readAt: newMessage.readAt || null,
          createdAt: newMessage.createdAt
        };

        // Emitir al chat (a todos los que estén en esa sala)
        io.to(`chat_${chatId}`).emit('receive_message', messageData);

        // ✅ Actualiza contador del receptor (badge + por chat)
        await emitUnreadCountToUser(otherUserId);
      } catch (error) {
        console.error('❌ Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error al enviar mensaje' });
      }
    });

    /**
     * ✅ Marcar mensajes como leídos (visto)
     * El frontend debe emitir:
     * socket.emit('mark_read', { chatId, readerId })
     */
    socket.on('mark_read', async ({ chatId, readerId }) => {
      try {
        if (!chatId || !readerId) return;

        const reader = String(readerId);

        // Verificar chat y obtener el otro usuario
        const chat = await Chat.findById(chatId).lean();
        if (!chat) return;

        const otherUserId = chat.participants
          ?.map((p) => String(p))
          ?.find((p) => p !== reader);

        const now = new Date();

        // Marcar como leído TODO lo que el reader recibió en ese chat
        await Message.updateMany(
          { chat: chatId, receiver: reader, readAt: null },
          { $set: { read: true, readAt: now, status: 'read' } }
        );

        // ✅ Avisar al otro usuario para que cambie los checks en tiempo real
        if (otherUserId) {
          const otherSockets = onlineUsers.get(String(otherUserId));
          if (otherSockets) {
            for (const sid of otherSockets) {
              io.to(sid).emit('messages_read', {
                chatId: String(chatId),
                readAt: now.toISOString(),
                readerId: reader
              });
            }
          }

          // ✅ Actualiza contador del lector (badge + por chat)
          await emitUnreadCountToUser(reader);
        }
      } catch (e) {
        console.error('❌ mark_read error:', e);
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
