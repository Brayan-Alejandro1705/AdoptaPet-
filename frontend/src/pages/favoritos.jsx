const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');

console.log('⭐ Inicializando rutas de favoritos...');

// =====================================================
// ✅ 1. VERIFICAR SI UN POST ESTÁ EN FAVORITOS
// =====================================================
router.get('/check/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const isFavorite = user.favoritesPosts && user.favoritesPosts.some(
      favId => favId.toString() === id
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

// =====================================================
// ✅ 2. OBTENER TODOS LOS FAVORITOS (POSTS)
// =====================================================
router.get('/', protect, async (req, res) => {
  try {
    const userId = req.user._id;
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

// =====================================================
// ✅ 3. AGREGAR POST A FAVORITOS (AMBOS: :id y :postId)
// =====================================================
router.post('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    console.log(`⭐ Agregando post ${id} a favoritos del usuario ${userId}`);

    const post = await Post.findById(id);
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
      favId => favId.toString() === id
    );

    if (alreadyFavorite) {
      return res.json({
        success: true,
        message: 'Ya está en favoritos',
        isFavorite: true
      });
    }

    user.favoritesPosts.push(id);
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

// =====================================================
// ✅ 4. QUITAR POST DE FAVORITOS (AMBOS: :id y :postId)
// =====================================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    console.log(`💔 Quitando post ${id} de favoritos del usuario ${userId}`);

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
      favId => favId.toString() !== id
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

// =====================================================
// ✅ 5. VERIFICAR SI UNA MASCOTA ESTÁ EN FAVORITOS
// =====================================================
router.get('/check-pet/:petId', protect, async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const isFavorite = user.favoritesPets && user.favoritesPets.some(
      favId => favId.toString() === petId
    );

    res.json({
      success: true,
      isFavorite
    });
  } catch (error) {
    console.error('❌ Error al verificar favorito de mascota:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar favorito',
      error: error.message
    });
  }
});

// =====================================================
// ✅ 6. AGREGAR MASCOTA A FAVORITOS
// =====================================================
router.post('/pet/:petId', protect, async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.user._id;
    console.log(`⭐ Agregando mascota ${petId} a favoritos del usuario ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.favoritesPets) {
      user.favoritesPets = [];
    }

    const alreadyFavorite = user.favoritesPets.some(
      favId => favId.toString() === petId
    );

    if (alreadyFavorite) {
      return res.json({
        success: true,
        message: 'Ya está en favoritos',
        isFavorite: true
      });
    }

    user.favoritesPets.push(petId);
    await user.save();

    console.log('✅ Mascota agregada a favoritos');

    res.json({
      success: true,
      message: 'Mascota agregada a favoritos',
      isFavorite: true
    });
  } catch (error) {
    console.error('❌ Error al agregar mascota a favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar favorito',
      error: error.message
    });
  }
});

// =====================================================
// ✅ 7. QUITAR MASCOTA DE FAVORITOS
// =====================================================
router.delete('/pet/:petId', protect, async (req, res) => {
  try {
    const { petId } = req.params;
    const userId = req.user._id;
    console.log(`💔 Quitando mascota ${petId} de favoritos del usuario ${userId}`);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.favoritesPets || user.favoritesPets.length === 0) {
      return res.json({
        success: true,
        message: 'No estaba en favoritos',
        isFavorite: false
      });
    }

    user.favoritesPets = user.favoritesPets.filter(
      favId => favId.toString() !== petId
    );

    await user.save();

    console.log('✅ Mascota quitada de favoritos');

    res.json({
      success: true,
      message: 'Mascota eliminada de favoritos',
      isFavorite: false
    });
  } catch (error) {
    console.error('❌ Error al eliminar mascota de favoritos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar favorito',
      error: error.message
    });
  }
});

console.log('✅ Rutas de favoritos configuradas:');
console.log('   🔍 GET    /api/favoritos/check/:id');
console.log('   ⭐ GET    /api/favoritos');
console.log('   ⭐ POST   /api/favoritos/:id');
console.log('   💔 DELETE /api/favoritos/:id');
console.log('   🔍 GET    /api/favoritos/check-pet/:petId');
console.log('   ⭐ POST   /api/favoritos/pet/:petId');
console.log('   💔 DELETE /api/favoritos/pet/:petId');

module.exports = router;