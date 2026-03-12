// =============================================
// MODELO PET - ADOPTAPET RED SOCIAL
// =============================================

/**
 * INFORMACIÓN DEL ARCHIVO:
 * 
 * ¿Qué hace este archivo?
 * Define el modelo de datos para las mascotas en adopción
 * 
 * ¿Qué incluye?
 * - Esquema completo de mascota con validaciones
 * - Campos virtuales calculados
 * - Middleware para procesamiento automático
 * - Métodos personalizados para adopciones
 * 
 * Proyecto: AdoptaPet - Red Social de Adopción
 */

const mongoose = require('mongoose');

console.log('🐾 Iniciando creación del modelo Pet...');

// =============================================
// ESQUEMA DE LA MASCOTA
// =============================================

const petSchema = new mongoose.Schema({
    
    // =============================================
    // INFORMACIÓN BÁSICA DE LA MASCOTA
    // =============================================
    
    name: {
        type: String,
        required: [true, 'El nombre de la mascota es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
    },
    
    species: {
        type: String,
        required: [true, 'La especie es obligatoria'],
        enum: {
            values: ['perro', 'gato', 'conejo', 'ave', 'roedor', 'reptil', 'otro'],
            message: '{VALUE} no es una especie válida'
        },
        lowercase: true,
        index: true
    },
    
    breed: {
        type: String,
        trim: true,
        maxlength: [100, 'La raza no puede tener más de 100 caracteres'],
        default: 'Mestizo'
    },
    
    // =============================================
    // CARACTERÍSTICAS FÍSICAS
    // =============================================
    
    age: {
        value: {
            type: Number,
            min: [0, 'La edad no puede ser negativa'],
            max: [50, 'La edad no puede superar 50 años']
        },
        unit: {
            type: String,
            enum: ['meses', 'años'],
            default: 'años'
        }
    },
    
    gender: {
        type: String,
        required: [true, 'El género es obligatorio'],
        enum: {
            values: ['macho', 'hembra', 'desconocido'],
            message: '{VALUE} no es un género válido'
        },
        lowercase: true
    },
    
    size: {
        type: String,
        required: [true, 'El tamaño es obligatorio'],
        enum: {
            values: ['pequeño', 'mediano', 'grande', 'gigante'],
            message: '{VALUE} no es un tamaño válido'
        },
        lowercase: true,
        index: true
    },
    
    weight: {
        type: Number,
        min: [0, 'El peso no puede ser negativo'],
        max: [200, 'El peso no puede superar 200 kg']
    },
    
    color: {
        type: String,
        trim: true,
        maxlength: [100, 'El color no puede tener más de 100 caracteres']
    },
    
    // =============================================
    // DESCRIPCIÓN E HISTORIA
    // =============================================
    
    description: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        trim: true,
        minlength: [20, 'La descripción debe tener al menos 20 caracteres'],
        maxlength: [2000, 'La descripción no puede tener más de 2000 caracteres']
    },
    
    story: {
        type: String,
        trim: true,
        maxlength: [5000, 'La historia no puede tener más de 5000 caracteres']
    },
    
    personality: {
        type: [String],
        validate: {
            validator: function(traits) {
                return traits.length <= 15;
            },
            message: 'No puede haber más de 15 rasgos de personalidad'
        },
        set: function(traits) {
            return [...new Set(traits.map(trait => trait.toLowerCase().trim()))];
        }
    },
    
    // =============================================
    // IMÁGENES Y MULTIMEDIA
    // =============================================
    
    photos: {
        type: [String],
        validate: {
            validator: function(photos) {
                return photos.length >= 1 && photos.length <= 10;
            },
            message: 'Debe haber entre 1 y 10 fotos'
        },
        required: [true, 'Al menos una foto es obligatoria']
    },
    
    mainPhoto: {
        type: String,
        required: [true, 'La foto principal es obligatoria']
    },
    
    videos: {
        type: [String],
        validate: {
            validator: function(videos) {
                return videos.length <= 3;
            },
            message: 'No puede haber más de 3 videos'
        }
    },
    video: {
        type: String,
        default: null
    },
    // =============================================
    // INFORMACIÓN DE SALUD
    // =============================================
    
    healthInfo: {
        vaccinated: {
            type: Boolean,
            default: false
        },
        sterilized: {
            type: Boolean,
            default: false
        },
        dewormed: {
            type: Boolean,
            default: false
        },
        medicalConditions: {
            type: [String],
            default: []
        },
        specialNeeds: {
            type: String,
            trim: true,
            maxlength: [500, 'Las necesidades especiales no pueden tener más de 500 caracteres']
        },
        lastVetVisit: {
            type: Date
        }
    },
    
    // =============================================
    // UBICACIÓN Y CONTACTO
    // =============================================
    
    location: {
        country: {
            type: String,
            required: [true, 'El país es obligatorio'],
            trim: true
        },
        city: {
            type: String,
            required: [true, 'La ciudad es obligatoria'],
            trim: true,
            index: true
        },
        address: {
            type: String,
            trim: true
        },
        coordinates: {
            latitude: {
                type: Number,
                min: -90,
                max: 90
            },
            longitude: {
                type: Number,
                min: -180,
                max: 180
            }
        }
    },
    
    // =============================================
    // REFERENCIAS A OTROS MODELOS
    // =============================================
    
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El dueño/refugio es obligatorio'],
        index: true
    },
    
    shelter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shelter'
    },
    
    // =============================================
    // ESTADO Y DISPONIBILIDAD
    // =============================================
    
    status: {
        type: String,
        enum: {
            values: ['disponible', 'en-proceso', 'adoptado', 'reservado', 'no-disponible'],
            message: '{VALUE} no es un estado válido'
        },
        default: 'disponible',
        index: true
    },
    
    adoptionDate: {
        type: Date
    },
    
    adoptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    
    // =============================================
    // REQUISITOS DE ADOPCIÓN
    // =============================================
    
    adoptionRequirements: {
        experience: {
            type: Boolean,
            default: false
        },
        hasGarden: {
            type: Boolean,
            default: false
        },
        hasOtherPets: {
            type: Boolean,
            default: true
        },
        hasChildren: {
            type: Boolean,
            default: true
        },
        adoptionFee: {
            type: Number,
            min: [0, 'La tarifa no puede ser negativa'],
            default: 0
        }
    },
    
    // =============================================
    // ESTADÍSTICAS Y ENGAGEMENT
    // =============================================
    
    views: {
        type: Number,
        min: [0, 'Las vistas no pueden ser negativas'],
        default: 0
    },
    
    favorites: {
        type: Number,
        min: [0, 'Los favoritos no pueden ser negativos'],
        default: 0
    },
    
    shares: {
        type: Number,
        min: [0, 'Los compartidos no pueden ser negativos'],
        default: 0
    },
    
    // =============================================
    // ETIQUETAS Y BÚSQUEDA
    // =============================================
    
    tags: {
        type: [String],
        validate: {
            validator: function(tags) {
                return tags.length <= 20;
            },
            message: 'No puede haber más de 20 etiquetas'
        },
        set: function(tags) {
            return [...new Set(tags.map(tag => tag.toLowerCase().trim()))];
        }
    },
    
    keywords: {
        type: [String]
    },
    
    // =============================================
    // URGENCIA Y PRIORIDAD
    // =============================================
    
    urgent: {
        type: Boolean,
        default: false,
        index: true
    },
    
    featured: {
        type: Boolean,
        default: false,
        index: true
    },
    
    priority: {
        type: Number,
        min: 0,
        max: 10,
        default: 5
    }
    
}, {
    // =============================================
    // OPCIONES DEL SCHEMA
    // =============================================
    
    timestamps: true,
    
    toJSON: { 
        virtuals: true,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    },
    
    toObject: { 
        virtuals: true
    }
});

// =============================================
// CAMPOS VIRTUALES - PROPIEDADES CALCULADAS
// =============================================

// Campo virtual: edad en texto legible
petSchema.virtual('ageText').get(function() {
    if (!this.age || !this.age.value) return 'Edad desconocida';
    return `${this.age.value} ${this.age.unit}`;
});

// Campo virtual: estado de salud general
petSchema.virtual('healthStatus').get(function() {
    const { vaccinated, sterilized, dewormed } = this.healthInfo;
    const healthyCount = [vaccinated, sterilized, dewormed].filter(Boolean).length;
    
    if (healthyCount === 3) return 'excelente';
    if (healthyCount === 2) return 'bueno';
    if (healthyCount === 1) return 'regular';
    return 'necesita-atencion';
});

// Campo virtual: descripción de tamaño
petSchema.virtual('sizeDescription').get(function() {
    const descriptions = {
        'pequeño': 'Menos de 10kg',
        'mediano': 'Entre 10kg y 25kg',
        'grande': 'Entre 25kg y 45kg',
        'gigante': 'Más de 45kg'
    };
    return descriptions[this.size] || this.size;
});

// Campo virtual: tiempo desde publicación
petSchema.virtual('timePosted').get(function() {
    const now = new Date();
    const posted = this.createdAt;
    const diffTime = Math.abs(now - posted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
});

// Campo virtual: estado de adopción en español
petSchema.virtual('statusText').get(function() {
    const statusTexts = {
        'disponible': 'Disponible para adopción',
        'en-proceso': 'En proceso de adopción',
        'adoptado': 'Adoptado felizmente',
        'reservado': 'Reservado',
        'no-disponible': 'No disponible'
    };
    return statusTexts[this.status] || this.status;
});

// =============================================
// MIDDLEWARE - FUNCIONES AUTOMÁTICAS
// =============================================

// MIDDLEWARE PRE-SAVE
petSchema.pre('save', function(next) {
    console.log(`🐾 Procesando mascota antes de guardar: ${this.name}`);
    
    // 1. GENERAR KEYWORDS PARA BÚSQUEDA
    const keywords = [
        this.name.toLowerCase(),
        this.species.toLowerCase(),
        this.breed.toLowerCase(),
        this.location.city.toLowerCase()
    ];
    
    // Agregar características
    if (this.gender) keywords.push(this.gender.toLowerCase());
    if (this.size) keywords.push(this.size.toLowerCase());
    if (this.color) keywords.push(this.color.toLowerCase());
    
    // Agregar palabras del nombre
    const nameWords = this.name.toLowerCase().split(' ');
    keywords.push(...nameWords);
    
    // Agregar rasgos de personalidad
    if (this.personality && this.personality.length > 0) {
        keywords.push(...this.personality);
    }
    
    this.keywords = [...new Set(keywords)].filter(word => word.length > 2);
    
    console.log(`🔍 Keywords generadas: ${this.keywords.slice(0, 5).join(', ')}...`);
    
    // 2. NORMALIZAR TAGS
    if (this.tags && this.tags.length > 0) {
        this.tags = [...new Set(this.tags.map(tag => tag.toLowerCase().trim()))];
        console.log(`🏷️ Tags normalizadas: ${this.tags.join(', ')}`);
    }
    
    // 3. VALIDAR FOTO PRINCIPAL ESTÁ EN ARRAY DE FOTOS
    if (this.mainPhoto && this.photos && !this.photos.includes(this.mainPhoto)) {
        this.photos.unshift(this.mainPhoto);
        console.log(`📸 Foto principal agregada al array de fotos`);
    }
    
    // 4. ACTUALIZAR FECHA DE ADOPCIÓN SI CAMBIA A ADOPTADO
    if (this.isModified('status') && this.status === 'adoptado' && !this.adoptionDate) {
        this.adoptionDate = new Date();
        console.log(`✅ Fecha de adopción establecida: ${this.adoptionDate}`);
    }
    
    next();
});

// MIDDLEWARE POST-SAVE
petSchema.post('save', function(doc) {
    console.log(`✅ Mascota guardada exitosamente:`);
    console.log(`   🐾 Nombre: ${doc.name}`);
    console.log(`   🐕 Especie: ${doc.species}`);
    console.log(`   📍 Ubicación: ${doc.location.city}`);
    console.log(`   ⭐ Estado: ${doc.statusText}`);
    console.log(`   🆔 ID: ${doc._id}`);
});

// =============================================
// MÉTODOS PERSONALIZADOS DEL MODELO
// =============================================

// Método: Marcar mascota como adoptada
petSchema.methods.markAsAdopted = function(adopterId) {
    this.status = 'adoptado';
    this.adoptedBy = adopterId;
    this.adoptionDate = new Date();
    return this.save();
};

// Método: Incrementar vistas
petSchema.methods.incrementViews = function() {
    this.views += 1;
    return this.save();
};

// Método: Verificar si está disponible
petSchema.methods.isAvailable = function() {
    return this.status === 'disponible';
};

// Método estático: Buscar mascotas disponibles en una ciudad
petSchema.statics.findAvailableInCity = function(city) {
    return this.find({
        'location.city': new RegExp(city, 'i'),
        status: 'disponible'
    });
    // .populate('owner', 'nombre email'); // Descomentaremos cuando creemos el modelo User
};

// =============================================
// ÍNDICES COMPUESTOS PARA BÚSQUEDAS OPTIMIZADAS
// =============================================

petSchema.index({ species: 1, 'location.city': 1, status: 1 });
petSchema.index({ createdAt: -1, featured: 1 });
petSchema.index({ keywords: 1 });

// =============================================
// CREAR EL MODELO DESDE EL ESQUEMA
// =============================================

const Pet = mongoose.model('Pet', petSchema);

console.log('✅ Modelo Pet creado exitosamente');
console.log('📋 Collection en MongoDB: pets');

// =============================================
// EXPORTAR EL MODELO
// =============================================

module.exports = Pet;

console.log('📦 Modelo Pet exportado y listo para usar');