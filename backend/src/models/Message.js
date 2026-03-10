// backend/models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

  // chat al que pertenece el mensaje
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },

  // usuario que envía
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // usuario que recibe
  // no required para mantener compatibilidad con tu chat actual
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },

  // contenido del mensaje
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },

  // tipo de mensaje (por si luego agregas imágenes o archivos)
  type: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },

  // url de archivo si el mensaje tiene imagen
  fileUrl: {
    type: String,
    default: null
  },

  // estado del mensaje estilo WhatsApp
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
    index: true
  },

  deliveredAt: {
    type: Date,
    default: null
  },

  readAt: {
    type: Date,
    default: null
  },

  // compatibilidad con lógica antigua
  read: {
    type: Boolean,
    default: false
  },

  // mensaje eliminado
  deleted: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});


// 🔹 Mantener compatibilidad con código antiguo
messageSchema.pre('save', function (next) {

  if (this.read === true && !this.readAt) {
    this.readAt = new Date();
  }

  if (this.readAt) {
    this.status = 'read';
    this.read = true;
  }

  next();
});


// 🚀 Índices para rendimiento del chat
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, status: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });


// 🚀 Método para marcar como entregado
messageSchema.methods.markDelivered = function () {
  this.status = 'delivered';
  this.deliveredAt = new Date();
};


// 🚀 Método para marcar como leído
messageSchema.methods.markRead = function () {
  this.status = 'read';
  this.read = true;
  this.readAt = new Date();
};


const Message = mongoose.model('Message', messageSchema);

module.exports = Message;