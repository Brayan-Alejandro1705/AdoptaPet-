// backend/src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Middleware de autenticación (reutilizar el de postRoutes)
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025');
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    req.userId = decoded.id;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Error de autenticación'
    });
  }
};

// ============================================
// RUTAS DE IA
// ============================================

// 1. Identificar raza por imagen
router.post('/identify-breed', auth, aiController.identifyPetBreed);

// 2. Obtener consejos sobre mascota
router.post('/advice', auth, aiController.getPetAdvice);

// 3. Chat con IA
router.post('/chat', auth, aiController.chatWithAI);

// 4. Analizar compatibilidad
router.post('/compatibility', auth, aiController.analyzeCompatibility);

// 5. Generar descripción automática
router.post('/generate-description', auth, aiController.generatePetDescription);

console.log('✅ Rutas de IA configuradas');
console.log('   🔍 POST /api/ai/identify-breed - Identificar raza');
console.log('   💡 POST /api/ai/advice - Consejos sobre mascota');
console.log('   💬 POST /api/ai/chat - Chat con IA');
console.log('   🔄 POST /api/ai/compatibility - Compatibilidad');
console.log('   📝 POST /api/ai/generate-description - Generar descripción');

module.exports = router;