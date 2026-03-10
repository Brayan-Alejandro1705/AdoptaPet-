// =====================================================
// 🚀 RUTAS BACKEND PARA GOOGLE GEMINI
// Adaptadas para tu estructura (CommonJS)
// =====================================================

const express = require('express');
const router = express.Router();
const {
  chatbotAnimalAdvisor,
  analyzeAnimalImage,
  moderateImage,
  validatePetPosting,
  generatePetDescription,
  checkImageSimilarity,
} = require('../services/geminiService');

// Middleware de autenticación (asume que ya tienes)
const { verifyToken } = require('../middleware/auth');

// =====================================================
// 1️⃣ CHATBOT DE ASESORAMIENTO ANIMAL
// =====================================================

router.post('/chatbot', verifyToken, async (req, res) => {
  try {
    const { message, petType } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'El mensaje es requerido',
      });
    }

    const result = await chatbotAnimalAdvisor(message, petType);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      reply: result.reply,
      tokens: result.tokensUsed,
    });
  } catch (error) {
    console.error('Error en /api/ai/chatbot:', error);
    return res.status(500).json({
      success: false,
      error: 'Error del servidor',
    });
  }
});

// =====================================================
// 2️⃣ ANALIZAR IMAGEN DE MASCOTA
// =====================================================

router.post('/analyze-pet', verifyToken, async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'La URL de la imagen es requerida',
      });
    }

    const result = await analyzeAnimalImage(imageUrl);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      analysis: result.analysis,
      tokens: result.tokensUsed,
    });
  } catch (error) {
    console.error('Error en /api/ai/analyze-pet:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al analizar imagen',
    });
  }
});

// =====================================================
// 3️⃣ MODERAR IMAGEN
// =====================================================

router.post('/moderate', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'La URL de la imagen es requerida',
      });
    }

    const result = await moderateImage(imageUrl);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    if (!result.moderation.isAppropriate) {
      return res.json({
        success: false,
        error: `Imagen rechazada: ${result.moderation.reason}`,
        moderation: result.moderation,
      });
    }

    return res.json({
      success: true,
      moderation: result.moderation,
      tokens: result.tokensUsed,
    });
  } catch (error) {
    console.error('Error en /api/ai/moderate:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al moderar imagen',
    });
  }
});

// =====================================================
// 4️⃣ VALIDAR PUBLICACIÓN
// =====================================================

router.post('/validate-posting', verifyToken, async (req, res) => {
  try {
    const { imageUrl, description } = req.body;

    if (!imageUrl || !description) {
      return res.status(400).json({
        success: false,
        error: 'Imagen y descripción son requeridas',
      });
    }

    const result = await validatePetPosting(imageUrl, description);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    if (!result.validation.isValid) {
      return res.json({
        success: false,
        error: result.validation.feedback,
        validation: result.validation,
      });
    }

    return res.json({
      success: true,
      validation: result.validation,
      tokens: result.tokensUsed,
    });
  } catch (error) {
    console.error('Error en /api/ai/validate-posting:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al validar publicación',
    });
  }
});

// =====================================================
// 5️⃣ GENERAR DESCRIPCIÓN AUTOMÁTICA
// =====================================================

router.post('/generate-description', verifyToken, async (req, res) => {
  try {
    const { imageUrl, petName, petType } = req.body;

    if (!imageUrl || !petName || !petType) {
      return res.status(400).json({
        success: false,
        error: 'Imagen, nombre y tipo de mascota son requeridos',
      });
    }

    const result = await generatePetDescription(imageUrl, petName, petType);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    return res.json({
      success: true,
      description: result.description,
      tokens: result.tokensUsed,
    });
  } catch (error) {
    console.error('Error en /api/ai/generate-description:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar descripción',
    });
  }
});

// =====================================================
// 6️⃣ DETECTAR FOTOS DUPLICADAS (Anti-scam)
// =====================================================

router.post('/check-duplicate', verifyToken, async (req, res) => {
  try {
    const { imageUrl1, imageUrl2 } = req.body;

    if (!imageUrl1 || !imageUrl2) {
      return res.status(400).json({
        success: false,
        error: 'Ambas URLs de imagen son requeridas',
      });
    }

    const result = await checkImageSimilarity(imageUrl1, imageUrl2);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    if (result.comparison.riskLevel === 'alto') {
      return res.json({
        success: false,
        warning: 'Posible contenido duplicado o fraudulento',
        comparison: result.comparison,
        tokens: result.tokensUsed,
      });
    }

    return res.json({
      success: true,
      comparison: result.comparison,
      tokens: result.tokensUsed,
    });
  } catch (error) {
    console.error('Error en /api/ai/check-duplicate:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al comparar imágenes',
    });
  }
});

module.exports = router;