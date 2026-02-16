const mongoose = require('mongoose');

// ============================================================================
// SCHEMA DEFINITION
// ============================================================================

const notificationSchema = new mongoose.Schema({
  
  // --------------------------------------------------------------------------
  // USER REFERENCES
  // --------------------------------------------------------------------------
  
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
  
  // --------------------------------------------------------------------------
  // NOTIFICATION TYPE
  // --------------------------------------------------------------------------
  
  type: {
    type: String,
    enum: [
      // Social interactions
      'like',
      'comment',
      'mention',
      'follow',
      'friend_request',       // ✅ AGREGADO
      'friend_accept',        // ✅ AGREGADO
      
      // Adoption related
      'adoption',
      'adoption_request',
      'adoption_accepted',
      'adoption_rejected',
      'favorite',
      
      // Communication
      'message',
      
      // Content
      'new_post',
      
      // System
      'system',
      'connection'
    ],
    required: true
  },
  
  // --------------------------------------------------------------------------
  // NOTIFICATION CONTENT
  // --------------------------------------------------------------------------
  
  // Título de la notificación
  title: {
    type: String,
    required: false           // ✅ CAMBIADO A OPCIONAL
  },
  
  // Mensaje de la notificación
  message: {
    type: String,
    required: true
  },
  
  // --------------------------------------------------------------------------
  // UI STYLING
  // --------------------------------------------------------------------------
  
  // Icono/emoji para la notificación
  icon: {
    type: String,
    default: '🔔'
  },
  
  // Color para la UI
  color: {
    type: String,
    enum: ['purple', 'green', 'blue', 'yellow', 'pink', 'red', 'gray'],
    default: 'purple'
  },
  
  // --------------------------------------------------------------------------
  // STATUS
  // --------------------------------------------------------------------------
  
  // Si fue leída
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // --------------------------------------------------------------------------
  // RELATED REFERENCES
  // --------------------------------------------------------------------------
  
  // Referencia relacionada (mascota, chat, post, etc.)
  relatedId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  relatedModel: {
    type: String,
    enum: ['Pet', 'Chat', 'User', 'Application', 'Post']
  },
  
  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------
  
  // URL de acción (opcional)
  actionUrl: {
    type: String
  }

}, {
  timestamps: true
});

// ============================================================================
// INDEXES
// ============================================================================

// Índice compuesto para consultas por usuario y fecha
notificationSchema.index({ recipient: 1, createdAt: -1 });

// Índice compuesto para filtrar notificaciones no leídas
notificationSchema.index({ recipient: 1, read: 1 });

// ============================================================================
// LOGGING
// ============================================================================

console.log('📬 Modelo Notification actualizado:');
console.log('   ✅ Soporte para friend_request y friend_accept');
console.log('   ✅ Campo title ahora es opcional');
console.log('   ✅ Tipos de notificación organizados por categoría');

// ============================================================================
// EXPORT
// ============================================================================

module.exports = mongoose.model('Notification', notificationSchema);