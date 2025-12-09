// =============================================
// RUTAS DE AUTENTICACIÓN - Adoptapet
// =============================================

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Validaciones
const {
  registroValidation,
  loginValidation,
} = require('../middleware/validations/authValidations');

// =============================================
// RUTAS PÚBLICAS
// =============================================

/**
 * @route   POST /api/auth/registro
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/registro', registroValidation, authController.registro);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   GET /api/auth/test
 * @desc    Verificar que las rutas están montadas correctamente
 * @access  Public
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: '✅ Rutas de autenticación funcionando',
    timestamp: new Date().toISOString()
  });
});

// =============================================
// NOTA: Las rutas de Google OAuth están en server.js
// para evitar duplicación y conflictos
// =============================================

// =============================================
// RUTAS PROTEGIDAS
// =============================================

/**
 * @route   GET /api/auth/me
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get('/me', protect, authController.getMe);

module.exports = router;