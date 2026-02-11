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
  }
}, {
  timestamps: true  // agrega createdAt y updatedAt automáticamente
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

  // Estadísticas
  stats: {
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    commentsCount: {
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
  // ⭐⭐⭐ AGREGAR ESTOS CAMPOS ⭐⭐⭐

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

  // ⭐⭐⭐ FIN DE LOS CAMPOS A AGREGAR ⭐⭐⭐

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

// Índices para optimizar búsquedas
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ type: 1 });

// Permitir posts con solo contenido o solo imagen
postSchema.pre('validate', function(next) {
  next();
});

const Post = mongoose.model('Post', postSchema);

console.log('✅ Modelo Post creado exitosamente');
console.log('📋 Collection en MongoDB: posts');

module.exports = Post;