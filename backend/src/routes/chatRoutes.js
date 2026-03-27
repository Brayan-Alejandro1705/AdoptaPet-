// backend/routes/chatRoutes.js

const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification'); // ✅ FIX: agregado
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');


// ================================
// Middleware de autenticación
// ================================
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


// ================================
// Helpers
// ================================
const getOtherUserIdFromChat = (chat, myUserId) => {

  if (!chat?.participants?.length) return null;

  const other = chat.participants.find(
    p => p.toString() !== myUserId.toString()
  );

  return other ? other.toString() : null;

};

const buildAvatarUrl = (avatar, userName) => {

  if (!avatar) {

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random`;

  }

  if (!avatar.startsWith('http')) {

    return `${process.env.API_URL || 'http://localhost:5000'}${avatar}`;

  }

  return avatar;

};


// ================================
// GET contador global no leídos
// ================================
router.get('/unread-count', authenticate, async (req, res) => {

  try {

    const userId = req.userId;

    const count = await Message.countDocuments({
      receiver: userId,
      readAt: null
    });

    res.json({ ok: true, count });

  } catch (error) {

    console.error('❌ Error unread-count:', error);

    res.status(500).json({ ok: false, count: 0 });

  }

});


// ================================
// GET todos los chats del usuario
// ================================
router.get('/', authenticate, async (req, res) => {

  try {

    const userId = req.userId;

    const chats = await Chat.find({
      participants: userId
    })
      .populate({
        path: 'participants',
        select: 'name email avatar bio'
      })
      .sort({ updatedAt: -1 })
      .lean();


    const unreadByChatAgg = await Message.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(userId),
          readAt: null
        }
      },
      {
        $group: {
          _id: '$chat',
          count: { $sum: 1 }
        }
      }
    ]);

    const unreadMap = new Map(
      unreadByChatAgg.map(x => [x._id.toString(), x.count])
    );


    const formattedChats = chats.map(chat => {

      const otherUser = chat.participants.find(
        p => p._id.toString() !== userId.toString()
      );

      if (!otherUser) return null;

      const userName = otherUser.name || 'Usuario';

      const avatarUrl = buildAvatarUrl(
        otherUser.avatar,
        userName
      );

      return {
        id: chat._id.toString(),
        name: userName,
        avatar: avatarUrl,
        lastMessage: chat.lastMessage || '',
        unread: unreadMap.get(chat._id.toString()) || 0,
        updatedAt: chat.updatedAt
      };

    }).filter(Boolean);

    res.json(formattedChats);

  } catch (error) {

    console.error('❌ Error chats:', error);

    res.status(500).json({
      error: 'Error al obtener chats'
    });

  }

});


// ================================
// GET mensajes del chat
// ================================
router.get('/:chatId/messages', authenticate, async (req, res) => {

  try {

    const { chatId } = req.params;
    const userId = req.userId;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ error: 'Chat no encontrado' });
    }

    const hasAccess = chat.participants.some(
      p => p.toString() === userId
    );

    if (!hasAccess) {
      return res.status(403).json({ error: 'Sin acceso' });
    }


    // marcar mensajes como entregados
    await Message.updateMany(
      {
        chat: chatId,
        receiver: userId,
        deliveredAt: null
      },
      {
        $set: {
          status: 'delivered',
          deliveredAt: new Date()
        }
      }
    );


    const messages = await Message.find({ chat: chatId })
      .populate({
        path: 'sender',
        select: 'name avatar'
      })
      .sort({ createdAt: 1 })
      .lean();


    const formattedMessages = messages.map(msg => {

      const senderId = msg.sender?._id?.toString();

      return {

        id: msg._id.toString(),
        text: msg.text,

        time: new Date(msg.createdAt).toLocaleTimeString(
          'es-CO',
          {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Bogota'
          }
        ),

        sender: senderId === userId ? 'me' : 'other',

        senderId,

        senderName: msg.sender?.name || 'Usuario',

        senderAvatar: msg.sender?.avatar,

        status: msg.status || 'sent',

        readAt: msg.readAt || null,

        deliveredAt: msg.deliveredAt || null

      };

    });

    res.json(formattedMessages);

  } catch (error) {

    console.error('❌ Error mensajes:', error);

    res.status(500).json({
      error: 'Error al obtener mensajes'
    });

  }

});


// ================================
// POST enviar mensaje ✅ CON notificationSettings
// ================================
router.post('/:chatId/messages', authenticate, async (req, res) => {

  try {

    const { chatId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Mensaje vacío'
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        error: 'Mensaje demasiado largo'
      });
    }


    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        error: 'Chat no encontrado'
      });
    }

    const hasAccess = chat.participants.some(
      p => p.toString() === userId
    );

    if (!hasAccess) {
      return res.status(403).json({
        error: 'No tienes acceso'
      });
    }


    const otherUserId = getOtherUserIdFromChat(chat, userId);

    // ✅ El mensaje SIEMPRE se guarda y entrega — independiente del setting
    const message = new Message({

      chat: chatId,

      sender: userId,

      receiver: otherUserId,

      text: text.trim(),

      status: 'sent'

    });


    await message.save();


    chat.lastMessage = text.trim();
    chat.updatedAt = new Date();

    await chat.save();


    await message.populate({
      path: 'sender',
      select: 'name avatar'
    });

    // ✅ FIX: solo crear notificación si el receptor tiene messages activado
    if (otherUserId) {
      try {
        const [sender, receiver] = await Promise.all([
          User.findById(userId).select('name nombre avatar'),
          User.findById(otherUserId).select('notificationSettings')
        ]);

        const messagesEnabled = receiver?.notificationSettings?.messages !== false;

        if (messagesEnabled) {
          const notification = await Notification.create({
            recipient: otherUserId,
            sender: userId,
            type: 'message',
            title: 'Nuevo mensaje',
            message: `${sender.name || sender.nombre} te envió un mensaje`,
            icon: '📩',
            color: 'blue',
            relatedId: chat._id,
            relatedModel: 'Chat',
            actionUrl: `/mensajes/${chatId}`
          });

          const io = req.app.get('io');
          if (io) {
            io.to(otherUserId.toString()).emit('nueva-notificacion', {
              ...notification.toObject(),
              sender: {
                _id: sender._id,
                name: sender.name || sender.nombre,
                avatar: sender.avatar
              }
            });
          }

          console.log('🔔 Notificación de mensaje creada:', notification._id);
        } else {
          console.log('🔕 Usuario desactivó notificaciones de mensajes — omitida');
        }
      } catch (notifError) {
        console.error('⚠️ Error creando notificación de mensaje:', notifError);
      }
    }

    res.status(201).json({

      id: message._id.toString(),

      text: message.text,

      sender: 'me',

      senderId: message.sender._id.toString(),

      senderName: message.sender.name,

      senderAvatar: message.sender.avatar,

      status: message.status,

      createdAt: message.createdAt

    });

  } catch (error) {

    console.error('❌ Error enviar mensaje:', error);

    res.status(500).json({
      error: 'Error al enviar mensaje'
    });

  }

});


// ================================
// POST crear chat
// ================================
router.post('/', authenticate, async (req, res) => {

  try {

    const { otherUserId, petId } = req.body;
    const userId = req.userId;

    let chat = await Chat.findOne({
      participants: { $all: [userId, otherUserId] }
    });

    if (!chat) {

      chat = new Chat({

        participants: [userId, otherUserId],

        petRelated: petId || null

      });

      await chat.save();

    }

    await chat.populate({
      path: 'participants',
      select: 'name avatar'
    });

    const other = chat.participants.find(
      p => p._id.toString() !== userId
    );

    const avatar = buildAvatarUrl(
      other.avatar,
      other.name
    );

    res.status(201).json({

      id: chat._id,

      name: other.name,

      avatar,

      lastMessage: chat.lastMessage || '',

      unread: 0

    });

  } catch (error) {

    console.error('❌ Error crear chat:', error);

    res.status(500).json({
      error: 'Error al crear chat'
    });

  }

});


console.log('✅ Chat routes cargadas');

module.exports = router;