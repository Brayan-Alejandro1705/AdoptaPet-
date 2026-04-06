// backend/models/Chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: String,
    default: ''
  },
  petRelated: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  },
  blockedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

chatSchema.index({ participants: 1 });

console.log('🐾 Iniciando creación del modelo Chat...');
const Chat = mongoose.model('Chat', chatSchema);
console.log('✅ Modelo Chat creado exitosamente');
console.log('📋 Collection en MongoDB: chats');

module.exports = Chat;