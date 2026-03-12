// =============================================
// MODELO USER - ADOPTAPET RED SOCIAL
// =============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('👤 Iniciando creación del modelo User...');

// =============================================
// ESQUEMA DEL USUARIO
// =============================================

const userSchema = new mongoose.Schema({
    
    // =============================================
    // INFORMACIÓN BÁSICA Y AUTENTICACIÓN
    // =============================================
    
    name: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [50, 'El nombre debe tener máximo 50 caracteres'],
        validate: {
            validator: function(name) {
                return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name);
            },
            message: 'El nombre solo puede contener letras y espacios'
        }
    },
    
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Email inválido'
        },
    },
    
    password: {
        type: String,
        required: function() {
            return !this.googleId;
        },
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        select: false
    },
    
    // =============================================
    // GOOGLE OAUTH
    // =============================================
    
    googleId: {
        type: String,
        sparse: true,
        select: false
    },
    
    googleAvatar: {
        type: String
    },
    
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    
    // =============================================
    // ROLES Y PERMISOS
    // =============================================
    
    role: {
        type: String,
        enum: {
            values: ['admin', 'adoptante', 'refugio', 'usuario', 'adopter', 'shelter', 'superadmin'],
            message: '{VALUE} no es un rol válido'
        },
        default: 'adopter',
        index: true
    },
    
    // =============================================
    // PERFIL DEL USUARIO
    // =============================================
    
    avatar: {
        type: String,
        default: 'https://ui-avatars.com/api/?name=User&background=random'
    },
    
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'La biografía no puede tener más de 500 caracteres']
    },
    
    phone: {
        type: String,
        required: false,
        trim: true,
        validate: {
            validator: function(v) {
                if (!v || v.length === 0) return true;
                return /^[0-9]{10}$/.test(v);
            },
            message: 'El teléfono debe tener exactamente 10 dígitos numéricos'
        }
    },
    
    // =============================================
    // UBICACIÓN
    // =============================================
    
    location: {
        country: {
            type: String,
            trim: true,
            default: 'Colombia'
        },
        city: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        }
    },
    
    // =============================================
    // INFORMACIÓN ESPECÍFICA DE REFUGIO
    // =============================================
    
    shelterInfo: {
        organizationName: {
            type: String,
            trim: true
        },
        website: {
            type: String,
            trim: true
        },
        taxId: {
            type: String,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'La descripción no puede tener más de 1000 caracteres']
        },
        capacity: {
            type: Number,
            min: [0, 'La capacidad no puede ser negativa']
        },
        socialMedia: {
            facebook: String,
            instagram: String,
            twitter: String
        }
    },
    
    // =============================================
    // VERIFICACIÓN
    // =============================================
    
    verified: {
        email: {
            type: Boolean,
            default: false
        },
        phone: {
            type: Boolean,
            default: false
        },
        shelter: {
            type: Boolean,
            default: false
        }
    },
    
    verificationToken: {
        type: String,
        select: false
    },
    
    verificationTokenExpires: {
        type: Date,
        select: false
    },
    
    // =============================================
    // PREFERENCIAS DE ADOPCIÓN
    // =============================================
    
    adoptionPreferences: {
        species: {
            type: [String],
            enum: ['perro', 'gato', 'conejo', 'ave', 'roedor', 'reptil', 'otro']
        },
        size: {
            type: [String],
            enum: ['pequeño', 'mediano', 'grande', 'gigante']
        },
        age: {
            type: String,
            enum: ['cachorro', 'joven', 'adulto', 'senior', 'cualquiera'],
            default: 'cualquiera'
        },
        hasGarden: Boolean,
        hasOtherPets: Boolean,
        hasChildren: Boolean,
        experience: {
            type: String,
            enum: ['ninguna', 'poca', 'moderada', 'mucha'],
            default: 'ninguna'
        }
    },
    
    // =============================================
    // ESTADÍSTICAS Y ENGAGEMENT
    // =============================================
    
    stats: {
        petsPublished: { type: Number, default: 0, min: 0 },
        petsAdopted: { type: Number, default: 0, min: 0 },
        postsCount: { type: Number, default: 0, min: 0 },
        followersCount: { type: Number, default: 0, min: 0 },
        followingCount: { type: Number, default: 0, min: 0 }
    },
    
    // =============================================
    // CONEXIONES SOCIALES
    // =============================================
    
    connections: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    // ✅ NUEVO: Lista de amigos (amistades aceptadas)
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    
    favoritesPets: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet'
    }],
    
    favoritesPosts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet'
    }],
    
    // =============================================
    // ✅ NUEVO: AJUSTES DE PUBLICACIONES (MODAL PUBLICACIONES)
    // =============================================
    // Solo estos 3:
    // - privacidadPorDefecto: publico | amigos | privado
    // - permitirComentarios: boolean
    // - permitirCompartir: boolean
    postSettings: {
        privacidadPorDefecto: {
            type: String,
            enum: ['publico', 'amigos', 'privado'],
            default: 'publico'
        },
        permitirComentarios: {
            type: Boolean,
            default: true
        },
        permitirCompartir: {
            type: Boolean,
            default: true
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    
    // =============================================
    // SEGURIDAD
    // =============================================
    
    resetPasswordToken: {
        type: String,
        select: false
    },
    
    resetPasswordExpires: {
        type: Date,
        select: false
    },
    
    lastLogin: Date,
    
    loginAttempts: {
        type: Number,
        default: 0
    },
    
    lockUntil: Date,
    
    // =============================================
    // ESTADO DE LA CUENTA
    // =============================================
    
    status: {
        type: String,
        enum: {
            values: ['active', 'inactive', 'suspended', 'banned'],
            message: '{VALUE} no es un estado válido'
        },
        default: 'active',
        index: true
    },

    // =============================================
    // ✅ NUEVO: AJUSTES DE NOTIFICACIONES (MODAL)
    // =============================================
    // Esto corresponde a: Likes, Comentarios, Nuevos seguidores, Menciones, Mensajes
    notificationSettings: {
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        followers: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true },
        messages: { type: Boolean, default: true }
    },
    
    // =============================================
    // NOTIFICACIONES Y PRIVACIDAD
    // =============================================
    
    settings: {
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            adoptionUpdates: { type: Boolean, default: true },
            newFollowers: { type: Boolean, default: true }
        },
        privacy: {
            showEmail: { type: Boolean, default: false },
            showPhone: { type: Boolean, default: false },
            profileVisibility: {
                type: String,
                enum: ['public', 'followers', 'private'],
                default: 'public'
            }
        }
    },
    
    // =============================================
    // TOKENS Y SESIONES
    // =============================================
    
    refreshTokens: [{
        token: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
    
}, {
    timestamps: true,
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.password;
            delete ret.googleId;
            delete ret.resetPasswordToken;
            delete ret.resetPasswordExpires;
            delete ret.verificationToken;
            delete ret.verificationTokenExpires;
            delete ret.refreshTokens;
            return ret;
        }
    },
    toObject: { 
        virtuals: true
    }
});

// =============================================
// CAMPOS VIRTUALES
// =============================================

userSchema.virtual('displayName').get(function() {
    if ((this.role === 'shelter' || this.role === 'refugio') && this.shelterInfo?.organizationName) {
        return this.shelterInfo.organizationName;
    }
    return this.name;
});

userSchema.virtual('isFullyVerified').get(function() {
    if (this.role === 'shelter' || this.role === 'refugio') {
        return this.verified.email && this.verified.shelter;
    }
    return this.verified.email;
});

userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('roleText').get(function() {
    const roleTexts = {
        'adopter': 'Adoptante',
        'adoptante': 'Adoptante',
        'shelter': 'Refugio',
        'refugio': 'Refugio',
        'admin': 'Administrador',
        'usuario': 'Usuario'
    };
    return roleTexts[this.role] || this.role;
});

userSchema.virtual('profileCompleteness').get(function() {
    const fields = [
        this.name,
        this.email,
        this.avatar,
        this.bio,
        this.phone,
        this.location?.city,
        this.verified.email
    ];
    
    if (this.role === 'shelter' || this.role === 'refugio') {
        fields.push(
            this.shelterInfo?.organizationName,
            this.shelterInfo?.description,
            this.verified.shelter
        );
    }
    
    const filledFields = fields.filter(field => field).length;
    return Math.round((filledFields / fields.length) * 100);
});

// =============================================
// MIDDLEWARE
// =============================================

// 🔐 Hash password
userSchema.pre('save', async function(next) {
    if (!this.password || !this.isModified('password')) return next();
    
    try {
        console.log(`🔐 Encriptando contraseña para usuario: ${this.email}`);
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log(`✅ Contraseña encriptada exitosamente`);
        next();
    } catch (error) {
        console.error('❌ Error al encriptar contraseña:', error);
        next(error);
    }
});

// ✅ Actualizar timestamp de postSettings cuando cambie
userSchema.pre('save', function(next) {
    if (this.isModified('postSettings')) {
        this.postSettings = this.postSettings || {};
        this.postSettings.updatedAt = new Date();
    }
    next();
});

userSchema.pre('save', function(next) {
    console.log(`👤 Procesando usuario antes de guardar: ${this.email}`);
    
    if ((this.role === 'shelter' || this.role === 'refugio') && !this.shelterInfo?.organizationName) {
        console.log('⚠️ Refugio sin nombre de organización');
    }
    
    if (!this.avatar || this.avatar === 'https://ui-avatars.com/api/?name=User&background=random') {
        if (this.googleAvatar) {
            this.avatar = this.googleAvatar;
            console.log(`🎨 Avatar de Google configurado`);
        } else {
            this.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random`;
            console.log(`🎨 Avatar generado automáticamente`);
        }
    }
    
    next();
});

userSchema.post('save', function(doc) {
    console.log(`✅ Usuario guardado exitosamente:`);
    console.log(`   👤 Nombre: ${doc.name}`);
    console.log(`   📧 Email: ${doc.email}`);
    console.log(`   🎭 Rol: ${doc.roleText}`);
    console.log(`   🔐 Proveedor: ${doc.authProvider}`);
    console.log(`   ✅ Verificado: ${doc.verified.email ? 'Sí' : 'No'}`);
    console.log(`   📱 Teléfono: ${doc.phone || 'No proporcionado'}`);
    console.log(`   🆔 ID: ${doc._id}`);
});

// =============================================
// MÉTODOS DE INSTANCIA
// =============================================

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        if (this.authProvider === 'google' && !this.password) {
            return false;
        }
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Error al comparar contraseñas');
    }
};

userSchema.methods.incrementLoginAttempts = function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    const maxAttempts = 5;
    
    if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }
    
    return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0, lastLogin: Date.now() },
        $unset: { lockUntil: 1 }
    });
};

userSchema.methods.verifyEmail = function() {
    this.verified.email = true;
    this.verificationToken = undefined;
    this.verificationTokenExpires = undefined;
    return this.save();
};

userSchema.methods.addFavoritePet = function(petId) {
    if (!this.favoritesPets.includes(petId)) {
        this.favoritesPets.push(petId);
        return this.save();
    }
    return Promise.resolve(this);
};

userSchema.methods.removeFavoritePet = function(petId) {
    this.favoritesPets = this.favoritesPets.filter(
        id => id.toString() !== petId.toString()
    );
    return this.save();
};

userSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

userSchema.methods.isShelter = function() {
    return this.role === 'shelter' || this.role === 'refugio';
};

userSchema.methods.canPublishPets = function() {
    return this.role === 'shelter' || this.role === 'refugio' || this.role === 'admin';
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findVerifiedShelters = function(city = null) {
    const query = {
        $or: [{ role: 'shelter' }, { role: 'refugio' }],
        'verified.shelter': true,
        status: 'active'
    };
    
    if (city) {
        query['location.city'] = new RegExp(city, 'i');
    }
    
    return this.find(query).select('-password');
};

userSchema.statics.getUserStats = async function() {
    return await this.aggregate([
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 }
            }
        }
    ]);
};

// =============================================
// ÍNDICES
// =============================================

userSchema.index({ email: 1, status: 1 });
userSchema.index({ role: 1, 'verified.shelter': 1 });
userSchema.index({ 'location.city': 1, role: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

// ✅ (Opcional) índice para consultas por amigos
userSchema.index({ friends: 1 });

// ✅ (Opcional) índice para consultas por privacidad por defecto
userSchema.index({ 'postSettings.privacidadPorDefecto': 1 });

// =============================================
// CREAR Y EXPORTAR MODELO
// =============================================

const User = mongoose.model('User', userSchema);

console.log('✅ Modelo User creado exitosamente');
console.log('📋 Collection en MongoDB: users');
console.log('🔐 Soporte Google OAuth: Habilitado');

module.exports = User;

console.log('📦 Modelo User exportado y listo para usar');
