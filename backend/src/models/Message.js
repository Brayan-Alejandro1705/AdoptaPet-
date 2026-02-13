// backend/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ✅ NO required para no romper tu chat actual
  // (cuando actualices tu envío, ya lo puedes volver required)
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },

  text: {
    type: String,
    required: true,
    trim: true
  },

  // ✅ Estado del mensaje tipo WhatsApp
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

  // 🔹 Compatibilidad con tu lógica actual
  read: {
    type: Boolean,
    default: false
  }

}, {
  timestamps: true
});

// ✅ Mantener compatibilidad: si tu código antiguo marca read=true,
// también dejamos status/readAt consistentes.
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

// Índices para rendimiento
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, status: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
