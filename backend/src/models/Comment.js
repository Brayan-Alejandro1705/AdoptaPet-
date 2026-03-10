//Comentarios en posts

// =============================================
// MODELO: COMMENT (Comentario)
// Descripción: Sistema de comentarios en posts con respuestas anidadas
// =============================================

const mongoose = require('mongoose');

console.log('💬 Iniciando creación del modelo Comment...');

const commentSchema = new mongoose.Schema({
    // RELACIONES
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, 'El post es obligatorio'],
        index: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El autor es obligatorio'],
        index: true
    },
    
    // CONTENIDO
    content: {
        type: String,
        required: [true, 'El contenido es obligatorio'],
        minlength: [1, 'El comentario debe tener al menos 1 caracter'],
        maxlength: [2000, 'El comentario no puede exceder 2000 caracteres'],
        trim: true
    },
    
    // MULTIMEDIA (OPCIONAL)
    images: [{
        type: String,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
            },
            message: 'URL de imagen no válida'
        }
    }],
    
    // SISTEMA DE RESPUESTAS (COMENTARIOS ANIDADOS)
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null,
        index: true
    },
    // Profundidad del comentario (0 = comentario principal, 1 = respuesta, 2 = respuesta a respuesta)
    depth: {
        type: Number,
        default: 0,
        min: 0,
        max: 3 // Máximo 3 niveles de anidación
    },
    
    // ENGAGEMENT
    likes: {
        type: Number,
        default: 0,
        min: 0
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    replies: {
        type: Number,
        default: 0,
        min: 0
    },
    
    // MENCIONES
    mentions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    // ESTADO Y MODERACIÓN
    status: {
        type: String,
        enum: {
            values: ['active', 'hidden', 'reported', 'deleted'],
            message: '{VALUE} no es un estado válido'
        },
        default: 'active',
        index: true
    },
    
    // REPORTES
    reports: {
        count: {
            type: Number,
            default: 0,
            min: 0
        },
        reasons: [{
            reporter: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            reason: {
                type: String,
                enum: ['spam', 'offensive', 'harassment', 'inappropriate', 'misinformation', 'other']
            },
            description: String,
            date: {
                type: Date,
                default: Date.now
            }
        }]
    },
    
    // EDICIÓN
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    editHistory: [{
        content: String,
        editedAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    // METADATA
    isPinned: {
        type: Boolean,
        default: false
    },
    isAuthorVerified: {
        type: Boolean,
        default: false
    }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// =============================================
// CAMPOS VIRTUALES
// =============================================

// Estado en español
commentSchema.virtual('statusText').get(function() {
    const statusMap = {
        'active': 'Activo',
        'hidden': 'Oculto',
        'reported': 'Reportado',
        'deleted': 'Eliminado'
    };
    return statusMap[this.status] || this.status;
});

// Tiempo desde creación
commentSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    if (months > 0) return `hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
    if (weeks > 0) return `hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    if (days > 0) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
    if (hours > 0) return `hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    if (minutes > 0) return `hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    return 'justo ahora';
});

// Es una respuesta
commentSchema.virtual('isReply').get(function() {
    return this.parentComment !== null;
});

// Tiene imágenes
commentSchema.virtual('hasImages').get(function() {
    return this.images && this.images.length > 0;
});

// Engagement rate
commentSchema.virtual('engagementRate').get(function() {
    const total = this.likes + this.replies;
    return total;
});

// Está moderado
commentSchema.virtual('needsModeration').get(function() {
    return this.reports.count >= 3;
});

// =============================================
// ÍNDICES
// =============================================

// Índice compuesto para encontrar comentarios de un post
commentSchema.index({ post: 1, status: 1, createdAt: -1 });

// Índice para comentarios de un autor
commentSchema.index({ author: 1, createdAt: -1 });

// Índice para respuestas de un comentario
commentSchema.index({ parentComment: 1, createdAt: 1 });

// Índice para comentarios reportados
commentSchema.index({ status: 1, 'reports.count': -1 });

// Índice para comentarios destacados
commentSchema.index({ isPinned: -1, likes: -1, createdAt: -1 });

// =============================================
// MÉTODOS DE INSTANCIA
// =============================================

// Agregar like
commentSchema.methods.addLike = async function(userId) {
    if (!this.likedBy.includes(userId)) {
        this.likedBy.push(userId);
        this.likes += 1;
        
        // Limitar array para performance (máximo 1000)
        if (this.likedBy.length > 1000) {
            this.likedBy = this.likedBy.slice(-1000);
        }
        
        await this.save();
    }
    return this;
};

// Remover like
commentSchema.methods.removeLike = async function(userId) {
    const index = this.likedBy.indexOf(userId);
    if (index > -1) {
        this.likedBy.splice(index, 1);
        this.likes = Math.max(0, this.likes - 1);
        await this.save();
    }
    return this;
};

// Verificar si un usuario dio like
commentSchema.methods.hasLiked = function(userId) {
    return this.likedBy.includes(userId);
};

// Incrementar respuestas
commentSchema.methods.incrementReplies = async function() {
    this.replies += 1;
    await this.save();
    return this;
};

// Decrementar respuestas
commentSchema.methods.decrementReplies = async function() {
    this.replies = Math.max(0, this.replies - 1);
    await this.save();
    return this;
};

// Reportar comentario
commentSchema.methods.report = async function(reporterId, reason, description = '') {
    // Verificar si ya fue reportado por este usuario
    const alreadyReported = this.reports.reasons.some(
        r => r.reporter.toString() === reporterId.toString()
    );
    
    if (!alreadyReported) {
        this.reports.reasons.push({
            reporter: reporterId,
            reason: reason,
            description: description
        });
        this.reports.count += 1;
        
        // Auto-moderar si tiene 5 o más reportes
        if (this.reports.count >= 5 && this.status === 'active') {
            this.status = 'reported';
        }
        
        await this.save();
    }
    return this;
};

// Editar contenido
commentSchema.methods.editContent = async function(newContent) {
    if (this.content !== newContent) {
        // Guardar en historial
        this.editHistory.push({
            content: this.content,
            editedAt: new Date()
        });
        
        // Actualizar contenido
        this.content = newContent;
        this.isEdited = true;
        this.editedAt = new Date();
        
        await this.save();
    }
    return this;
};

// Ocultar comentario
commentSchema.methods.hide = async function() {
    this.status = 'hidden';
    await this.save();
    return this;
};

// Eliminar comentario (soft delete)
commentSchema.methods.softDelete = async function() {
    this.status = 'deleted';
    await this.save();
    return this;
};

// Fijar comentario
commentSchema.methods.pin = async function() {
    this.isPinned = true;
    await this.save();
    return this;
};

// Desfijar comentario
commentSchema.methods.unpin = async function() {
    this.isPinned = false;
    await this.save();
    return this;
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

// Encontrar comentarios de un post
commentSchema.statics.findByPost = async function(postId, options = {}) {
    const {
        page = 1,
        limit = 20,
        includeReplies = false,
        sortBy = 'createdAt',
        order = -1
    } = options;
    
    const skip = (page - 1) * limit;
    
    const query = {
        post: postId,
        status: 'active'
    };
    
    // Solo comentarios principales o incluir respuestas
    if (!includeReplies) {
        query.parentComment = null;
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = order;
    
    return this.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('author', 'nombre avatar role verified')
        .lean();
};

// Encontrar respuestas de un comentario
commentSchema.statics.findReplies = async function(commentId, options = {}) {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        order = 1
    } = options;
    
    const skip = (page - 1) * limit;
    const sortOptions = {};
    sortOptions[sortBy] = order;
    
    return this.find({
        parentComment: commentId,
        status: 'active'
    })
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('author', 'nombre avatar role verified')
        .lean();
};

// Encontrar comentarios de un usuario
commentSchema.statics.findByAuthor = async function(authorId, options = {}) {
    const {
        page = 1,
        limit = 20,
        status = 'active'
    } = options;
    
    const skip = (page - 1) * limit;
    
    return this.find({
        author: authorId,
        status: status
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('post', 'content type')
        .lean();
};

// Obtener comentarios reportados
commentSchema.statics.getReportedComments = async function(minReports = 3) {
    return this.find({
        status: { $in: ['active', 'reported'] },
        'reports.count': { $gte: minReports }
    })
        .sort({ 'reports.count': -1, createdAt: -1 })
        .populate('author', 'nombre email role')
        .populate('post', 'content author')
        .lean();
};

// Obtener comentarios destacados (más likes)
commentSchema.statics.getTopComments = async function(postId, limit = 5) {
    return this.find({
        post: postId,
        status: 'active',
        parentComment: null
    })
        .sort({ likes: -1, createdAt: -1 })
        .limit(limit)
        .populate('author', 'nombre avatar role verified')
        .lean();
};

// Estadísticas de comentarios
commentSchema.statics.getCommentStats = async function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalLikes: { $sum: '$likes' },
                totalReplies: { $sum: '$replies' },
                avgLikes: { $avg: '$likes' }
            }
        },
        { $sort: { count: -1 } }
    ]);
};

// Contar comentarios de un post
commentSchema.statics.countByPost = async function(postId) {
    return this.countDocuments({
        post: postId,
        status: 'active'
    });
};

// =============================================
// MIDDLEWARE
// =============================================

// PRE-SAVE: Validaciones y ajustes automáticos
commentSchema.pre('save', async function(next) {
    console.log(`💬 Procesando comentario antes de guardar...`);
    
    // Limitar array de likes para performance
    if (this.likedBy && this.likedBy.length > 1000) {
        this.likedBy = this.likedBy.slice(-1000);
    }
    
    // Extraer menciones del contenido (@usuario)
    const mentionRegex = /@(\w+)/g;
    const mentions = [...this.content.matchAll(mentionRegex)];
    if (mentions.length > 0) {
        // Aquí podrías buscar los usuarios mencionados en la BD
        // Por ahora solo guardamos que hay menciones
        console.log(`    ${mentions.length} menciones detectadas`);
    }
    
    // Si es una respuesta, calcular profundidad
    if (this.isNew && this.parentComment) {
        try {
            const parent = await this.constructor.findById(this.parentComment);
            if (parent) {
                this.depth = parent.depth + 1;
                console.log(`   ↳ Respuesta de nivel ${this.depth}`);
            }
        } catch (error) {
            console.log(`   ⚠️ No se pudo calcular profundidad`);
        }
    }
    
    next();
});

// POST-SAVE: Logs y actualizaciones
commentSchema.post('save', async function(doc) {
    console.log(`✅ Comentario guardado exitosamente:`);
    console.log(`   💬 ID: ${doc._id}`);
    console.log(`   👤 Autor: ${doc.author}`);
    console.log(`   📝 Contenido: ${doc.content.substring(0, 50)}${doc.content.length > 50 ? '...' : ''}`);
    console.log(`   📊 Estado: ${doc.statusText}`);
    console.log(`   ❤️ Likes: ${doc.likes}`);
    
    // Si es un comentario nuevo y es una respuesta, incrementar contador del padre
    if (doc.isNew && doc.parentComment) {
        try {
            const parent = await this.constructor.findById(doc.parentComment);
            if (parent) {
                await parent.incrementReplies();
                console.log(`   ↑ Contador de respuestas del padre incrementado`);
            }
        } catch (error) {
            console.log(`   ⚠️ No se pudo actualizar contador del padre`);
        }
    }
});

// =============================================
// TRANSFORMACIÓN JSON
// =============================================

commentSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        // Remover campos internos
        delete ret.__v;
        delete ret.likedBy; // No exponer lista completa de usuarios
        
        return ret;
    }
});

// =============================================
// EXPORTAR MODELO
// =============================================

const Comment = mongoose.model('Comment', commentSchema);

console.log('✅ Modelo Comment creado exitosamente');
console.log('📋 Collection en MongoDB: comments');
console.log('📦 Modelo Comment exportado y listo para usar');

module.exports = Comment;