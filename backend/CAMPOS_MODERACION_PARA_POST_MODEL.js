// =============================================
// CAMPOS DE MODERACIÓN PARA AGREGAR AL MODELO POST
// =============================================
//
// INSTRUCCIONES:
// Agrega estos campos al esquema del modelo Post.js
// justo después del campo "status"
//
// =============================================

/*

  // ===== CAMPOS EXISTENTES =====
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted', 'reported'],
    default: 'active'
  },

  // ===== AGREGAR ESTOS CAMPOS DE MODERACIÓN =====

  // Información de moderación
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  moderatedAt: {
    type: Date,
    default: null
  },

  moderationReason: {
    type: String,
    trim: true,
    maxlength: [500, 'La razón de moderación no puede exceder 500 caracteres'],
    default: ''
  },

  // Información de restauración
  restoredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  restoredAt: {
    type: Date,
    default: null
  },

  // Información de eliminación (usuario normal)
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  deletedAt: {
    type: Date,
    default: null
  },

  // ===== FIN DE LOS CAMPOS DE MODERACIÓN =====

*/

// =============================================
// TAMBIÉN AGREGAR ESTE MÉTODO AL MODELO POST
// =============================================
// Agregar antes de "module.exports = mongoose.model('Post', postSchema);"

/*

// Método para verificar si fue moderado
postSchema.methods.isModerated = function() {
  return this.moderatedBy !== null && this.moderatedBy !== undefined;
};

// Método para verificar si fue restaurado
postSchema.methods.isRestored = function() {
  return this.restoredBy !== null && this.restoredBy !== undefined;
};

// Método estático para obtener posts moderados
postSchema.statics.getModeratedPosts = function(limit = 50) {
  return this.find({ 
    moderatedBy: { $exists: true, $ne: null } 
  })
    .sort({ moderatedAt: -1 })
    .limit(limit)
    .populate('author', 'name nombre email avatar role')
    .populate('moderatedBy', 'name nombre email role');
};

*/

console.log('📝 Campos de moderación para agregar al modelo Post');
console.log('✅ Copia los campos marcados al archivo backend/src/models/Post.js');