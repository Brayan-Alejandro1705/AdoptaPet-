// backend/src/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Usuario que recibe la notificación
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Usuario que genera la notificación (opcional)
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Tipo de notificación
  type: {
    type: String,
    enum: ['adoption', 'favorite', 'message', 'system', 'connection'],
    required: true
  },
  
  // Título de la notificación
  title: {
    type: String,
    required: true
  },
  
  // Mensaje de la notificación
  message: {
    type: String,
    required: true
  },
  
  // Icono/emoji para la notificación
  icon: {
    type: String,
    default: '🔔'
  },
  
  // Color para la UI
  color: {
    type: String,
    enum: ['purple', 'green', 'blue', 'yellow', 'pink', 'red'],
    default: 'purple'
  },
  
  // Si fue leída
  read: {
    type: Boolean,
    default: false
  },
  
  // Referencia relacionada (mascota, chat, etc.)
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  relatedModel: {
    type: String,
    enum: ['Pet', 'Chat', 'User', 'Application']
  },
  
  // URL de acción (opcional)
  actionUrl: String

}, {
  timestamps: true
});

// Índices para mejorar el rendimiento
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });

console.log('📬 Iniciando creación del modelo Notification...');
const Notification = mongoose.model('Notification', notificationSchema);
console.log('✅ Modelo Notification creado exitosamente');
console.log('📋 Collection en MongoDB: notifications');

module.exports = Notification;