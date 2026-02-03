// backend/src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// GET /api/notifications - Obtener todas las notificaciones del usuario
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('📥 Obteniendo notificaciones para usuario:', userId);
    
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'nombre name avatar')
      .sort({ createdAt: -1 })
      .limit(50); // Últimas 50 notificaciones

    const formattedNotifications = notifications.map(notif => {
      const senderName = notif.sender?.nombre || notif.sender?.name || 'Sistema';
      
      // Calcular tiempo transcurrido
      const now = Date.now();
      const diff = now - notif.createdAt.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      let timeAgo;
      if (minutes < 1) timeAgo = 'Ahora';
      else if (minutes < 60) timeAgo = `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
      else if (hours < 24) timeAgo = `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
      else timeAgo = `Hace ${days} día${days > 1 ? 's' : ''}`;
      
      return {
        id: notif._id,
        type: notif.type,
        icon: notif.icon,
        title: notif.title,
        message: notif.message,
        time: timeAgo,
        timestamp: notif.createdAt,
        read: notif.read,
        color: notif.color,
        sender: senderName,
        senderAvatar: notif.sender?.avatar,
        actionUrl: notif.actionUrl,
        relatedId: notif.relatedId
      };
    });

    console.log(`✅ Enviando ${formattedNotifications.length} notificaciones`);
    res.json(formattedNotifications);
  } catch (error) {
    console.error('❌ Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

// GET /api/notifications/unread-count - Obtener contador de no leídas
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });
    
    res.json({ count });
  } catch (error) {
    console.error('❌ Error al contar notificaciones:', error);
    res.status(500).json({ error: 'Error al contar notificaciones' });
  }
});

// PUT /api/notifications/:id/read - Marcar como leída
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    console.log('✅ Notificación marcada como leída:', req.params.id);
    res.json({ success: true, notification });
  } catch (error) {
    console.error('❌ Error al marcar notificación:', error);
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
});

// PUT /api/notifications/read-all - Marcar todas como leídas
router.put('/read-all', protect, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );

    console.log(`✅ ${result.modifiedCount} notificaciones marcadas como leídas`);
    res.json({ 
      success: true, 
      count: result.modifiedCount 
    });
  } catch (error) {
    console.error('❌ Error al marcar todas:', error);
    res.status(500).json({ error: 'Error al marcar todas como leídas' });
  }
});

// DELETE /api/notifications/:id - Eliminar una notificación
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    console.log('🗑️ Notificación eliminada:', req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error al eliminar notificación:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
});

// DELETE /api/notifications - Eliminar todas las notificaciones
router.delete('/', protect, async (req, res) => {
  try {
    const result = await Notification.deleteMany({
      recipient: req.user.id
    });

    console.log(`🗑️ ${result.deletedCount} notificaciones eliminadas`);
    res.json({ 
      success: true, 
      count: result.deletedCount 
    });
  } catch (error) {
    console.error('❌ Error al eliminar todas:', error);
    res.status(500).json({ error: 'Error al eliminar todas' });
  }
});

console.log('✅ Rutas de notificaciones cargadas');
module.exports = router;