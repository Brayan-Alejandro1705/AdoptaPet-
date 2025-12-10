const mongoose = require('mongoose');

console.log('📦 Iniciando creación del modelo Post...');

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

  // Estadísticas
  stats: {
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    comments: {
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

// IMPORTANTE: Remover la validación pre-save que causa problemas
// Permitir posts con solo contenido o solo imagen
postSchema.pre('validate', function(next) {
  // Permitir posts vacíos temporalmente para debugging
  next();
});

const Post = mongoose.model('Post', postSchema);

console.log('✅ Modelo Post creado exitosamente');
console.log('📋 Collection en MongoDB: posts');

module.exports = Post;