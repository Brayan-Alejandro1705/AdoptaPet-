// =============================================
// MODELO AdoptionRequest - ADOPTAPET
// backend/src/models/AdoptionRequest.js
// =============================================
const mongoose = require('mongoose');

const adoptionRequestSchema = new mongoose.Schema({
  // Mascota a la que se solicita adoptar
  pet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pet',
    required: true,
    index: true
  },
  // Usuario que solicita la adopción
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Dueño/publicador de la mascota
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Mensaje del solicitante
  message: {
    type: String,
    required: [true, 'El mensaje es obligatorio'],
    trim: true,
    minlength: [5, 'El mensaje debe tener al menos 5 caracteres'],
    maxlength: [1000, 'El mensaje no puede tener más de 1000 caracteres'],
    default: 'Estoy interesado en adoptar a esta mascota.'
  },
  // Estado de la solicitud
  status: {
    type: String,
    enum: ['pendiente', 'aceptada', 'rechazada', 'cancelada'],
    default: 'pendiente',
    index: true
  },
  // Respuesta del dueño (opcional)
  ownerResponse: {
    type: String,
    trim: true,
    maxlength: [500, 'La respuesta no puede tener más de 500 caracteres']
  },
  // Fecha en que el dueño respondió
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Un usuario no puede enviar más de una solicitud por mascota
adoptionRequestSchema.index({ pet: 1, applicant: 1 }, { unique: true });

const AdoptionRequest = mongoose.model('AdoptionRequest', adoptionRequestSchema);
module.exports = AdoptionRequest;