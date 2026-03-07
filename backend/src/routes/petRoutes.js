// src/routes/petRoutes.js
const express = require('express');
const petController = require('../controllers/petController');
const { protect, restrictTo } = require('../middleware/auth');
const {
  createPetValidation,
  updatePetValidation,
  searchPetsValidation
} = require('../middleware/validations/petValidations');

const router = express.Router();

// ==========================================
// RUTAS PÚBLICAS - ESPECÍFICAS PRIMERO
// ==========================================
router.get('/adopcion', petController.getMascotasEnAdopcion);
router.get('/search', searchPetsValidation, petController.searchPets);
router.get('/shelter/:shelterId', petController.getPetsByShelterId);

// ==========================================
// RUTAS PROTEGIDAS - SOLICITUDES DE ADOPCIÓN
// (deben ir ANTES de /:id para no colisionar)
// ==========================================
router.get('/mis-solicitudes', protect, petController.getMisSolicitudes);
router.get('/solicitudes-recibidas', protect, petController.getSolicitudesRecibidas);
router.patch('/solicitudes/:requestId/responder', protect, petController.responderSolicitud);
router.delete('/solicitudes/:requestId', protect, petController.cancelarSolicitud);

// ==========================================
// RUTAS PROTEGIDAS - MASCOTAS
// ==========================================
router.post('/publicar-adopcion', protect, petController.publicarMascotaAdopcion);
router.post('/', protect, restrictTo('shelter', 'admin'), createPetValidation, petController.createPet);

// ==========================================
// RUTAS CON PARÁMETRO :id - AL FINAL
// ==========================================
router.get('/:id', petController.getPetById);
router.post('/:id/solicitar', protect, petController.solicitarAdopcion); // ← NUEVA
router.patch('/:id', protect, restrictTo('shelter', 'admin'), updatePetValidation, petController.updatePet);
router.delete('/:id', protect, restrictTo('shelter', 'admin'), petController.deletePet);
router.get('/', petController.getAllPets);

module.exports = router;