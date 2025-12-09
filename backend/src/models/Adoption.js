//Solicitudes de adopción

// =============================================
// MODELO ADOPTION - ADOPTAPET RED SOCIAL
// =============================================

/**
 * INFORMACIÓN DEL ARCHIVO:
 * 
 * ¿Qué hace este archivo?
 * Define el modelo de datos para las solicitudes de adopción
 * 
 * ¿Qué incluye?
 * - Esquema completo de adopción con validaciones
 * - Estados del proceso (pending, approved, rejected, completed)
 * - Formulario de solicitud detallado
 * - Sistema de evaluación
 * - Gestión de fechas y seguimiento
 * 
 * Proyecto: AdoptaPet - Red Social de Adopción
 */

const mongoose = require('mongoose');

console.log('🏠 Iniciando creación del modelo Adoption...');

// =============================================
// ESQUEMA DE ADOPCIÓN
// =============================================

const adoptionSchema = new mongoose.Schema({
    
    // =============================================
    // INFORMACIÓN BÁSICA
    // =============================================
    
    pet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pet',
        required: [true, 'La mascota es obligatoria'],
        index: true
    },
    
    adopter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El adoptante es obligatorio'],
        index: true
    },
    
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El dueño/refugio es obligatorio'],
        index: true
    },
    
    // =============================================
    // ESTADO DEL PROCESO
    // =============================================
    
    status: {
        type: String,
        enum: {
            values: [
                'pending',      // Pendiente de revisión
                'reviewing',    // En revisión
                'interview',    // Programada entrevista
                'index-visit',   // Programada visita al hogar
                'approved',     // Aprobada
                'rejected',     // Rechazada
                'completed',    // Adopción completada
                'cancelled'     // Cancelada
            ],
            message: '{VALUE} no es un estado válido'
        },
        default: 'pending',
        index: true
    },
    
    // =============================================
    // FORMULARIO DE SOLICITUD
    // =============================================
    
    applicationForm: {
        // Información personal
        personalInfo: {
            fullName: {
                type: String,
                required: [true, 'El nombre completo es obligatorio'],
                trim: true
            },
            age: {
                type: Number,
                required: [true, 'La edad es obligatoria'],
                min: [18, 'Debe ser mayor de 18 años']
            },
            occupation: {
                type: String,
                trim: true
            },
            phone: {
                type: String,
                required: [true, 'El teléfono es obligatorio'],
                trim: true
            },
            email: {
                type: String,
                required: [true, 'El email es obligatorio'],
                lowercase: true,
                trim: true
            }
        },
        
        // Información del hogar
        indexInfo: {
            type: {
                type: String,
                enum: ['casa', 'apartamento', 'finca', 'otro'],
                required: true
            },
            size: {
                type: String,
                enum: ['pequeño', 'mediano', 'grande'],
                required: true
            },
            hasGarden: {
                type: Boolean,
                required: true
            },
            gardenSize: {
                type: String,
                trim: true
            },
            isFenced: {
                type: Boolean,
                default: false
            },
            ownerOrRenter: {
                type: String,
                enum: ['propietario', 'arrendatario'],
                required: true
            },
            landlordPermission: {
                type: Boolean
            }
        },
        
        // Experiencia con mascotas
        petExperience: {
            hasPetsNow: {
                type: Boolean,
                required: true
            },
            currentPets: [{
                species: String,
                breed: String,
                age: Number,
                temperament: String
            }],
            hadPetsBefore: {
                type: Boolean,
                required: true
            },
            previousPets: {
                type: String,
                trim: true
            },
            experienceLevel: {
                type: String,
                enum: ['ninguna', 'poca', 'moderada', 'mucha'],
                required: true
            }
        },
        
        // Familia y convivencia
        familyInfo: {
            livesAlone: {
                type: Boolean,
                required: true
            },
            familyMembers: {
                type: Number,
                min: 0,
                default: 0
            },
            hasChildren: {
                type: Boolean,
                required: true
            },
            childrenAges: [{
                type: Number
            }],
            allMembersAgree: {
                type: Boolean,
                required: true
            },
            allergies: {
                type: Boolean,
                default: false
            },
            allergiesDetails: {
                type: String,
                trim: true
            }
        },
        
        // Cuidado de la mascota
        petCare: {
            dailyTimeAvailable: {
                type: String,
                enum: ['menos-2h', '2-4h', '4-8h', 'mas-8h', 'todo-el-dia'],
                required: true
            },
            whoWillCare: {
                type: String,
                trim: true,
                required: true
            },
            vacationPlans: {
                type: String,
                trim: true
            },
            vetClinic: {
                name: String,
                phone: String,
                address: String
            },
            emergencyBudget: {
                type: Boolean,
                required: true
            },
            monthlyBudget: {
                type: Number,
                min: 0
            }
        },
        
        // Motivación
        motivation: {
            whyAdopt: {
                type: String,
                required: [true, 'Debe explicar por qué quiere adoptar'],
                trim: true,
                minlength: [50, 'Debe explicar con al menos 50 caracteres']
            },
            whyThisPet: {
                type: String,
                required: [true, 'Debe explicar por qué eligió esta mascota'],
                trim: true,
                minlength: [30, 'Debe explicar con al menos 30 caracteres']
            },
            expectations: {
                type: String,
                trim: true
            }
        },
        
        // Compromisos
        commitments: {
            longTermCommitment: {
                type: Boolean,
                required: true
            },
            training: {
                type: Boolean,
                required: true
            },
            medicalCare: {
                type: Boolean,
                required: true
            },
            returnIfNeeded: {
                type: Boolean,
                required: true
            }
        }
    },
    
    // =============================================
    // PROCESO DE EVALUACIÓN
    // =============================================
    
    evaluation: {
        score: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        criteria: {
            indexConditions: { type: Number, min: 0, max: 20, default: 0 },
            experience: { type: Number, min: 0, max: 20, default: 0 },
            economicCapacity: { type: Number, min: 0, max: 20, default: 0 },
            timeAvailability: { type: Number, min: 0, max: 20, default: 0 },
            motivation: { type: Number, min: 0, max: 20, default: 0 }
        },
        evaluatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        evaluatedAt: {
            type: Date
        },
        notes: {
            type: String,
            trim: true
        }
    },
    
    // =============================================
    // ENTREVISTA
    // =============================================
    
    interview: {
        scheduled: {
            type: Boolean,
            default: false
        },
        date: {
            type: Date
        },
        type: {
            type: String,
            enum: ['presencial', 'virtual', 'telefónica']
        },
        location: {
            type: String,
            trim: true
        },
        meetingLink: {
            type: String,
            trim: true
        },
        completed: {
            type: Boolean,
            default: false
        },
        notes: {
            type: String,
            trim: true
        },
        result: {
            type: String,
            enum: ['positivo', 'negativo', 'requiere-seguimiento']
        }
    },
    
    // =============================================
    // VISITA AL HOGAR
    // =============================================
    
    indexVisit: {
        required: {
            type: Boolean,
            default: true
        },
        scheduled: {
            type: Boolean,
            default: false
        },
        date: {
            type: Date
        },
        address: {
            type: String,
            trim: true
        },
        completed: {
            type: Boolean,
            default: false
        },
        visitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        photos: [{
            type: String
        }],
        checklist: {
            safeEnvironment: { type: Boolean, default: false },
            adequateSpace: { type: Boolean, default: false },
            securePerimeter: { type: Boolean, default: false },
            cleanConditions: { type: Boolean, default: false }
        },
        notes: {
            type: String,
            trim: true
        },
        result: {
            type: String,
            enum: ['aprobado', 'rechazado', 'condicional']
        }
    },
    
    // =============================================
    // DOCUMENTOS
    // =============================================
    
    documents: {
        identificationCard: {
            uploaded: { type: Boolean, default: false },
            url: String,
            verified: { type: Boolean, default: false }
        },
        proofOfResidence: {
            uploaded: { type: Boolean, default: false },
            url: String,
            verified: { type: Boolean, default: false }
        },
        proofOfIncome: {
            uploaded: { type: Boolean, default: false },
            url: String,
            verified: { type: Boolean, default: false }
        },
        landlordPermission: {
            uploaded: { type: Boolean, default: false },
            url: String,
            verified: { type: Boolean, default: false }
        },
        references: [{
            name: String,
            phone: String,
            relationship: String,
            verified: { type: Boolean, default: false }
        }]
    },
    
    // =============================================
    // FECHAS IMPORTANTES
    // =============================================
    
    dates: {
        requested: {
            type: Date,
            default: Date.now,
            required: true
        },
        reviewed: {
            type: Date
        },
        approved: {
            type: Date
        },
        rejected: {
            type: Date
        },
        completed: {
            type: Date
        },
        cancelled: {
            type: Date
        }
    },
    
    // =============================================
    // SEGUIMIENTO POST-ADOPCIÓN
    // =============================================
    
    followUp: {
        required: {
            type: Boolean,
            default: true
        },
        schedule: [{
            date: Date,
            type: {
                type: String,
                enum: ['llamada', 'visita', 'fotos', 'video']
            },
            completed: { type: Boolean, default: false },
            notes: String,
            photos: [String]
        }],
        finalReport: {
            completed: { type: Boolean, default: false },
            date: Date,
            notes: String,
            successful: { type: Boolean, default: true }
        }
    },
    
    // =============================================
    // NOTAS Y COMUNICACIÓN
    // =============================================
    
    notes: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: {
            type: String,
            trim: true,
            required: true
        },
        isPrivate: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    
    rejectionReason: {
        type: String,
        trim: true
    },
    
    cancellationReason: {
        type: String,
        trim: true
    },
    
    // =============================================
    // TARIFA DE ADOPCIÓN
    // =============================================
    
    adoptionFee: {
        amount: {
            type: Number,
            min: 0,
            default: 0
        },
        paid: {
            type: Boolean,
            default: false
        },
        paymentDate: {
            type: Date
        },
        paymentMethod: {
            type: String,
            enum: ['efectivo', 'transferencia', 'tarjeta', 'otro']
        },
        receiptUrl: {
            type: String
        }
    },
    
    // =============================================
    // CONTRATO
    // =============================================
    
    contract: {
        signed: {
            type: Boolean,
            default: false
        },
        signedDate: {
            type: Date
        },
        documentUrl: {
            type: String
        },
        terms: {
            returnPolicy: { type: Boolean, default: false },
            medicalCare: { type: Boolean, default: false },
            noAbandonment: { type: Boolean, default: false },
            followUpAcceptance: { type: Boolean, default: false }
        }
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

// Campo virtual: estado en español
adoptionSchema.virtual('statusText').get(function() {
    const statusTexts = {
        'pending': 'Pendiente',
        'reviewing': 'En revisión',
        'interview': 'Entrevista programada',
        'index-visit': 'Visita al hogar programada',
        'approved': 'Aprobada',
        'rejected': 'Rechazada',
        'completed': 'Completada',
        'cancelled': 'Cancelada'
    };
    return statusTexts[this.status] || this.status;
});

// Campo virtual: días desde la solicitud
adoptionSchema.virtual('daysSinceRequest').get(function() {
    const now = new Date();
    const requested = this.dates.requested;
    const diffTime = Math.abs(now - requested);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Campo virtual: está en proceso
adoptionSchema.virtual('isInProcess').get(function() {
    return ['pending', 'reviewing', 'interview', 'index-visit'].includes(this.status);
});

// Campo virtual: está finalizada
adoptionSchema.virtual('isFinalized').get(function() {
    return ['approved', 'rejected', 'completed', 'cancelled'].includes(this.status);
});

// Campo virtual: completitud del formulario
adoptionSchema.virtual('formCompleteness').get(function() {
    let completed = 0;
    let total = 6; // personalInfo, indexInfo, petExperience, familyInfo, petCare, motivation
    
    if (this.applicationForm.personalInfo?.fullName) completed++;
    if (this.applicationForm.indexInfo?.type) completed++;
    if (this.applicationForm.petExperience?.experienceLevel) completed++;
    if (this.applicationForm.familyInfo?.livesAlone !== undefined) completed++;
    if (this.applicationForm.petCare?.dailyTimeAvailable) completed++;
    if (this.applicationForm.motivation?.whyAdopt) completed++;
    
    return Math.round((completed / total) * 100);
});

// Campo virtual: evaluación aprobada
adoptionSchema.virtual('evaluationPassed').get(function() {
    return this.evaluation.score >= 60; // 60% o más para aprobar
});

// =============================================
// MIDDLEWARE - FUNCIONES AUTOMÁTICAS
// =============================================

// MIDDLEWARE PRE-SAVE
adoptionSchema.pre('save', function(next) {
    console.log(`🏠 Procesando solicitud de adopción antes de guardar...`);
    
    // 1. Actualizar fechas según el estado
    if (this.isModified('status')) {
        const now = new Date();
        
        switch(this.status) {
            case 'reviewing':
                if (!this.dates.reviewed) this.dates.reviewed = now;
                break;
            case 'approved':
                if (!this.dates.approved) this.dates.approved = now;
                break;
            case 'rejected':
                if (!this.dates.rejected) this.dates.rejected = now;
                break;
            case 'completed':
                if (!this.dates.completed) this.dates.completed = now;
                break;
            case 'cancelled':
                if (!this.dates.cancelled) this.dates.cancelled = now;
                break;
        }
        
        console.log(`📅 Estado cambiado a: ${this.statusText}`);
    }
    
    // 2. Calcular score total de evaluación
    if (this.isModified('evaluation.criteria')) {
        const criteria = this.evaluation.criteria;
        this.evaluation.score = 
            criteria.indexConditions +
            criteria.experience +
            criteria.economicCapacity +
            criteria.timeAvailability +
            criteria.motivation;
        
        console.log(`⭐ Score de evaluación calculado: ${this.evaluation.score}/100`);
    }
    
    next();
});

// MIDDLEWARE POST-SAVE
adoptionSchema.post('save', function(doc) {
    console.log(`✅ Solicitud de adopción guardada exitosamente:`);
    console.log(`   🐾 Mascota: ${doc.pet}`);
    console.log(`   👤 Adoptante: ${doc.adopter}`);
    console.log(`   📊 Estado: ${doc.statusText}`);
    console.log(`   🆔 ID: ${doc._id}`);
});

// =============================================
// MÉTODOS DE INSTANCIA
// =============================================

// Método: Aprobar solicitud
adoptionSchema.methods.approve = function(notes = '') {
    this.status = 'approved';
    this.dates.approved = new Date();
    if (notes) {
        this.evaluation.notes = notes;
    }
    return this.save();
};

// Método: Rechazar solicitud
adoptionSchema.methods.reject = function(reason) {
    this.status = 'rejected';
    this.dates.rejected = new Date();
    this.rejectionReason = reason;
    return this.save();
};

// Método: Completar adopción
adoptionSchema.methods.complete = function() {
    this.status = 'completed';
    this.dates.completed = new Date();
    return this.save();
};

// Método: Cancelar solicitud
adoptionSchema.methods.cancel = function(reason) {
    this.status = 'cancelled';
    this.dates.cancelled = new Date();
    this.cancellationReason = reason;
    return this.save();
};

// Método: Agregar nota
adoptionSchema.methods.addNote = function(authorId, content, isPrivate = false) {
    this.notes.push({
        author: authorId,
        content: content,
        isPrivate: isPrivate,
        createdAt: new Date()
    });
    return this.save();
};

// Método: Programar entrevista
adoptionSchema.methods.scheduleInterview = function(date, type, location) {
    this.interview.scheduled = true;
    this.interview.date = date;
    this.interview.type = type;
    this.interview.location = location || '';
    this.status = 'interview';
    return this.save();
};

// Método: Programar visita al hogar
adoptionSchema.methods.scheduleindexVisit = function(date, address) {
    this.indexVisit.scheduled = true;
    this.indexVisit.date = date;
    this.indexVisit.address = address;
    this.status = 'index-visit';
    return this.save();
};

// Método: Registrar pago
adoptionSchema.methods.registroPayment = function(amount, method, receiptUrl = '') {
    this.adoptionFee.amount = amount;
    this.adoptionFee.paid = true;
    this.adoptionFee.paymentDate = new Date();
    this.adoptionFee.paymentMethod = method;
    if (receiptUrl) this.adoptionFee.receiptUrl = receiptUrl;
    return this.save();
};

// =============================================
// MÉTODOS ESTÁTICOS
// =============================================

// Método estático: Buscar por adoptante
adoptionSchema.statics.findByAdopter = function(adopterId) {
    return this.find({ adopter: adopterId })
        .sort({ createdAt: -1 })
        .populate('pet', 'nombre species mainPhoto')
        .populate('owner', 'nombre email role');
};

// Método estático: Buscar por dueño/refugio
adoptionSchema.statics.findByOwner = function(ownerId) {
    return this.find({ owner: ownerId })
        .sort({ createdAt: -1 })
        .populate('pet', 'nombre species mainPhoto')
        .populate('adopter', 'nombre email phone');
};

// Método estático: Solicitudes pendientes
adoptionSchema.statics.getPendingAdoptions = function() {
    return this.find({
        status: { $in: ['pending', 'reviewing', 'interview', 'index-visit'] }
    })
    .sort({ createdAt: 1 })
    .populate('pet', 'nombre species mainPhoto')
    .populate('adopter', 'nombre email')
    .populate('owner', 'nombre email role');
};

// Método estático: Estadísticas de adopciones
adoptionSchema.statics.getAdoptionStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                avgScore: { $avg: '$evaluation.score' },
                avgDays: { $avg: {
                    $divide: [
                        { $subtract: [new Date(), '$dates.requested'] },
                        1000 * 60 * 60 * 24
                    ]
                }}
            }
        }
    ]);
    
    return stats;
};

// =============================================
// ÍNDICES COMPUESTOS
// =============================================

adoptionSchema.index({ pet: 1, adopter: 1 }, { unique: true });
adoptionSchema.index({ owner: 1, status: 1, createdAt: -1 });
adoptionSchema.index({ status: 1, createdAt: 1 });

// =============================================
// CREAR EL MODELO DESDE EL ESQUEMA
// =============================================

const Adoption = mongoose.model('Adoption', adoptionSchema);

console.log('✅ Modelo Adoption creado exitosamente');
console.log('📋 Collection en MongoDB: adoptions');

// =============================================
// EXPORTAR EL MODELO
// =============================================

module.exports = Adoption;

console.log('📦 Modelo Adoption exportado y listo para usar');