// backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');

// Middleware de autenticación
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// GET /api/chat - Obtener todos los chats del usuario
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    console.log('📥 Obteniendo chats para usuario:', userId);
    
    const chats = await Chat.find({
      participants: userId
    })
    .populate('participants', 'nombre name email avatar')
    .populate('petRelated', 'nombre imagen')
    .sort({ updatedAt: -1 });

    const formattedChats = chats.map(chat => {
      const otherUser = chat.participants.find(p => p._id.toString() !== userId);
      
      // Obtener nombre (puede estar como 'nombre' o 'name')
      const userName = otherUser?.nombre || otherUser?.name || 'Usuario';
      
      // Asegurar que el avatar tenga la URL completa
      let avatarUrl = otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        avatarUrl = `http://localhost:5000${avatarUrl}`;
      }
      
      return {
        id: chat._id,
        name: userName,
        avatar: avatarUrl,
        lastMessage: chat.lastMessage || 'Sin mensajes',
        online: false,
        unread: 0,
        petRelated: chat.petRelated
      };
    });

    console.log(`✅ Enviando ${formattedChats.length} chats`);
    res.json(formattedChats);
  } catch (error) {
    console.error('❌ Error al obtener chats:', error);
    res.status(500).json({ error: 'Error al obtener chats' });
  }
});

// GET /api/chat/:chatId/messages - Obtener mensajes de un chat
router.get('/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.userId;
    console.log('📥 Obteniendo mensajes del chat:', chatId);

    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'nombre name avatar')
      .sort({ createdAt: 1 });

    const formattedMessages = messages.map(msg => {
      const senderName = msg.sender?.nombre || msg.sender?.name || 'Usuario';
      
      return {
        id: msg._id,
        text: msg.text,
        time: new Date(msg.createdAt).toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        sender: msg.sender._id.toString() === userId ? 'me' : 'other',
        senderId: msg.sender._id,
        senderName: senderName,
        senderAvatar: msg.sender.avatar
      };
    });

    console.log(`✅ Enviando ${formattedMessages.length} mensajes`);
    res.json(formattedMessages);
  } catch (error) {
    console.error('❌ Error al obtener mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes' });
  }
});

// POST /api/chat/:chatId/messages - Enviar un mensaje en un chat
router.post('/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.userId;
    
    console.log('📤 Enviando mensaje en chat:', chatId);
    console.log('📝 Texto del mensaje:', text);
    console.log('👤 Remitente:', userId);

    // Verificar que el chat existe
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    // Verificar que el usuario es parte del chat
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({ error: 'No tienes acceso a este chat' });
    }

    // Crear el mensaje
    const message = new Message({
      chat: chatId,
      sender: userId,
      text: text
    });

    await message.save();
    console.log('✅ Mensaje guardado:', message._id);

    // Actualizar el chat con el último mensaje
    chat.lastMessage = text;
    chat.updatedAt = new Date();
    await chat.save();

    // Poblar el sender para devolver la información completa
    await message.populate('sender', 'nombre name avatar');

    const senderName = message.sender?.nombre || message.sender?.name || 'Usuario';

    // Formatear la respuesta
    const formattedMessage = {
      id: message._id,
      text: message.text,
      time: new Date(message.createdAt).toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      sender: 'me',
      senderId: message.sender._id,
      senderName: senderName,
      senderAvatar: message.sender.avatar
    };

    console.log('✅ Mensaje enviado exitosamente');
    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    res.status(500).json({ error: 'Error al enviar mensaje' });
  }
});

// POST /api/chat - Crear un nuevo chat
router.post('/', authenticate, async (req, res) => {
  try {
    const { otherUserId, petId } = req.body;
    const userId = req.userId;
    console.log('📝 Creando chat entre:', userId, 'y', otherUserId);

    // Verificar si ya existe un chat entre estos usuarios
    let chat = await Chat.findOne({
      participants: { $all: [userId, otherUserId] }
    });

    if (!chat) {
      chat = new Chat({
        participants: [userId, otherUserId],
        petRelated: petId || null
      });
      await chat.save();
      console.log('✅ Nuevo chat creado:', chat._id);
    } else {
      console.log('ℹ️  Chat ya existía:', chat._id);
    }

    await chat.populate('participants', 'nombre name email avatar');

    const otherUser = chat.participants.find(p => p._id.toString() !== userId);
    const userName = otherUser?.nombre || otherUser?.name || 'Usuario';
    
    let avatarUrl = otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = `http://localhost:5000${avatarUrl}`;
    }

    res.status(201).json({
      id: chat._id,
      name: userName,
      avatar: avatarUrl,
      lastMessage: chat.lastMessage || '',
      online: false,
      unread: 0
    });
  } catch (error) {
    console.error('❌ Error al crear chat:', error);
    res.status(500).json({ error: 'Error al crear chat' });
  }
});

console.log('✅ Rutas de chat cargadas');
module.exports = router;