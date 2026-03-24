// =============================================
// RUTAS DE AUTENTICACIÓN - Adoptapet
// =============================================
console.log('✅ authRoutes.js cargando...');
try {
  const authController = require('../controllers/authController');
  console.log('✅ authController OK');
} catch(e) {
  console.error('❌ authController FALLA:', e.message);
}
try {
  const { registroValidation } = require('../middleware/validations/authValidations');
  console.log('✅ authValidations OK');
} catch(e) {
  console.error('❌ authValidations FALLA:', e.message);
}

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
 * @route   POST /api/auth/verify-email
 * @desc    Verificar código de email
 * @access  Public
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Reenviar código de verificación
 * @access  Public
 */
router.post('/resend-verification', authController.resendVerification);

/**
 * @route   POST /api/auth/recuperar-password
 * @desc    Enviar correo con link de recuperación
 * @access  Public
 */
router.post('/recuperar-password', authController.recuperarPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Resetear contraseña con token del correo
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

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