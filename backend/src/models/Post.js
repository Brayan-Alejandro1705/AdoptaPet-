const mongoose = require('mongoose');

console.log('📦 Iniciando creación del modelo Post...');

// ===== ESQUEMA DE COMENTARIO =====
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true,
    required: [true, 'El contenido del comentario es obligatorio'],
    maxlength: [1000, 'El comentario no puede exceder 1000 caracteres']
  },
  replies: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    },
    content: { 
      type: String, 
      required: true,
      maxlength: [1000, 'La respuesta no puede exceder 1000 caracteres']
    },
    createdAt: { 
      type: Date, 
      default: Date.now 
    },
    // 🆕 NUEVO: Campo para mencionar a quién se responde
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  }]
}, {
  timestamps: true
});

// ===== ESQUEMA DEL POST =====
const postSchema = new mongoose.Schema({
  // Autor de la publicación
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El autor es obligatorio']
  },

  // Contenido de la publicación
  content: {
    type: String,
    trim: true,
    maxlength: [5000, 'El contenido no puede exceder 5000 caracteres'],
    default: ''
  },

  // Tipo de publicación
  type: {
    type: String,
    enum: ['update', 'adoption-story', 'pet-alert', 'event'],
    default: 'update'
  },

  // Multimedia
  media: {
    images: [{
      type: String
    }],
    videos: [{
      type: String
    }]
  },

  // ===== COMENTARIOS =====
  comments: [commentSchema],

  // Reportes
  reports: [{
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],

  // Estadísticas
  stats: {
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    likesCount: {
      type: Number,
      default: 0
    },
    commentsCount: {
      type: Number,
      default: 0
    },
    reportsCount: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    }
  },

  // Configuración de privacidad
  settings: {
    visibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    allowSharing: {
      type: Boolean,
      default: true
    }
  },

  // Estado
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted', 'reported'],
    default: 'active'
  },

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

  // Información de adopción (si aplica)
  adoptionInfo: {
    adopted: {
      type: Boolean,
      default: false
    },
    adoptionDate: Date
  },

  // Mascota relacionada (opcional)
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet'
  }

}, {
  timestamps: true
});

// ===== ÍNDICES PARA OPTIMIZAR BÚSQUEDAS =====
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ type: 1 });
postSchema.index({ 'stats.likes': 1 });
postSchema.index({ 'comments.user': 1 });
postSchema.index({ 'comments.replies.user': 1 });

// ===== MIDDLEWARE PRE-SAVE =====
postSchema.pre('validate', function(next) {
  next();
});

// ===== MÉTODOS DE INSTANCIA =====

// Obtener comentarios populados con replies
postSchema.methods.getCommentsWithReplies = async function() {
  return await this.populate([
    {
      path: 'comments.user',
      select: 'nombre name avatar verified'
    },
    {
      path: 'comments.replies.user',
      select: 'nombre name avatar verified'
    },
    {
      path: 'comments.replies.replyTo',
      select: 'nombre name avatar'
    }
  ]).execPopulate();
};

// Agregar like a un post
postSchema.methods.addLike = async function(userId) {
  if (!this.stats.likes.includes(userId)) {
    this.stats.likes.push(userId);
    this.stats.likesCount = this.stats.likes.length;
    await this.save();
  }
  return this;
};

// Remover like
postSchema.methods.removeLike = async function(userId) {
  this.stats.likes = this.stats.likes.filter(id => id.toString() !== userId.toString());
  this.stats.likesCount = this.stats.likes.length;
  await this.save();
  return this;
};

// ===== MÉTODOS ESTÁTICOS =====

// Obtener posts con todas las relaciones populadas
postSchema.statics.getPostsWithDetails = async function(filter = {}, options = {}) {
  const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;

  return this.find(filter)
    .populate('author', 'nombre name email avatar verified')
    .populate('comments.user', 'nombre name avatar verified')
    .populate('comments.replies.user', 'nombre name avatar verified')
    .populate('comments.replies.replyTo', 'nombre name avatar')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

// Contar posts activos
postSchema.statics.countActive = async function(filter = {}) {
  return this.countDocuments({ ...filter, status: 'active' });
};

const Post = mongoose.model('Post', postSchema);

console.log('✅ Modelo Post creado exitosamente');
console.log('📋 Collection en MongoDB: posts');
console.log('🆕 Campo replyTo agregado en replies para menciones');

module.exports = Post;