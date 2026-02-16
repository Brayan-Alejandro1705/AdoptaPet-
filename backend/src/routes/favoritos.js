// backend/src/routes/favoritos.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // ← Usa el middleware estándar
const User = require('../models/User');
const Post = require('../models/Post');

// ✅ 1. VERIFICAR SI UN POST ESTÁ EN FAVORITOS
router.get('/check/:postId', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id; // ← CAMBIAR AQUÍ

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const isFavorite = user.favoritesPosts && user.favoritesPosts.some(
      id => id.toString() === postId
    );

    res.json({
      success: true,
      isFavorite
    });
  } catch (error) {
    console.error('❌ Error al verificar favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar favorito',
      error: error.message
    });
  }
});

// ✅ 2. OBTENER POSTS FAVORITOS DEL USUARIO
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id; // ← CAMBIAR AQUÍ
    console.log('⭐ Obteniendo favoritos del usuario:', userId);

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const favoritePosts = await Post.find({
      _id: { $in: user.favoritesPosts || [] }
    })
      .populate('author', 'name nombre email avatar role verified')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ ${favoritePosts.length} posts favoritos encontrados`);

    res.json({
      success: true,
      data: favoritePosts,
      count: favoritePosts.length
    });
  } catch (error) {
    console.error('❌ Error al obtener favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener favoritos',
      error: error.message
    });
  }
});

// ✅ 3. AGREGAR POST A FAVORITOS
router.post('/:postId', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id; // ← CAMBIAR AQUÍ
    console.log(`⭐ Agregando post ${postId} a favoritos del usuario ${userId}`);

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.favoritesPosts) {
      user.favoritesPosts = [];
    }

    const alreadyFavorite = user.favoritesPosts.some(
      id => id.toString() === postId
    );

    if (alreadyFavorite) {
      return res.json({
        success: true,
        message: 'Ya está en favoritos',
        isFavorite: true
      });
    }

    user.favoritesPosts.push(postId);
    await user.save();

    console.log('✅ Post agregado a favoritos');

    res.json({
      success: true,
      message: 'Agregado a favoritos',
      isFavorite: true
    });
  } catch (error) {
    console.error('❌ Error al agregar favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar favorito',
      error: error.message
    });
  }
});

// ✅ 4. QUITAR POST DE FAVORITOS
router.delete('/:postId', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id; // ← CAMBIAR AQUÍ
    console.log(`💔 Quitando post ${postId} de favoritos del usuario ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.favoritesPosts || user.favoritesPosts.length === 0) {
      return res.json({
        success: true,
        message: 'No estaba en favoritos',
        isFavorite: false
      });
    }

    user.favoritesPosts = user.favoritesPosts.filter(
      id => id.toString() !== postId
    );

    await user.save();

    console.log('✅ Post quitado de favoritos');

    res.json({
      success: true,
      message: 'Eliminado de favoritos',
      isFavorite: false
    });
  } catch (error) {
    console.error('❌ Error al eliminar favorito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar favorito',
      error: error.message
    });
  }
});

console.log('✅ Rutas de favoritos configuradas');
console.log('   🔍 GET    /api/favoritos/check/:postId - Verificar favorito');
console.log('   ⭐ GET    /api/favoritos - Obtener favoritos');
console.log('   ⭐ POST   /api/favoritos/:postId - Agregar a favoritos');
console.log('   💔 DELETE /api/favoritos/:postId - Quitar de favoritos');

module.exports = router;