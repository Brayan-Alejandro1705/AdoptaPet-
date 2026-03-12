// backend/src/routes/favoritos.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const Pet  = require('../models/Pet');

// ============================================
// POSTS FAVORITOS
// ============================================

// 1. Verificar si un post está en favoritos
router.get('/check/:postId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const isFavorite = user.favoritesPosts?.some(id => id.toString() === req.params.postId) || false;
    res.json({ success: true, isFavorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Obtener posts favoritos
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const favoritePosts = await Post.find({ _id: { $in: user.favoritesPosts || [] } })
      .populate('author', 'name nombre email avatar role verified')
      .sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: favoritePosts, count: favoritePosts.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Agregar post a favoritos
router.post('/:postId', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (!user.favoritesPosts) user.favoritesPosts = [];
    if (!user.favoritesPosts.some(id => id.toString() === postId)) {
      user.favoritesPosts.push(postId);
      await user.save();
    }
    res.json({ success: true, message: 'Agregado a favoritos', isFavorite: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Quitar post de favoritos
router.delete('/:postId', protect, async (req, res) => {
  try {
    const { postId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    user.favoritesPosts = (user.favoritesPosts || []).filter(id => id.toString() !== postId);
    await user.save();
    res.json({ success: true, message: 'Eliminado de favoritos', isFavorite: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// MASCOTAS FAVORITAS ✅ RUTAS NUEVAS
// ============================================

// 5b. Obtener mascotas favoritas
router.get("/pets", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    const favoritePets = await Pet.find({ _id: { $in: user.favoritesPets || [] } })
      .populate("owner", "nombre name email avatar")
      .sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: favoritePets, count: favoritePets.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Verificar si una mascota está en favoritos
router.get('/check-pet/:petId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    const isFavorite = user.favoritesPets?.some(id => id.toString() === req.params.petId) || false;
    res.json({ success: true, isFavorite });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Agregar mascota a favoritos
router.post('/pet/:petId', protect, async (req, res) => {
  try {
    const { petId } = req.params;
    const pet = await Pet.findById(petId);
    if (!pet) return res.status(404).json({ success: false, message: 'Mascota no encontrada' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    if (!user.favoritesPets) user.favoritesPets = [];
    if (!user.favoritesPets.some(id => id.toString() === petId)) {
      user.favoritesPets.push(petId);
      await user.save();
    }
    res.json({ success: true, message: 'Mascota agregada a favoritos', isFavorite: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Quitar mascota de favoritos
router.delete('/pet/:petId', protect, async (req, res) => {
  try {
    const { petId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    user.favoritesPets = (user.favoritesPets || []).filter(id => id.toString() !== petId);
    await user.save();
    res.json({ success: true, message: 'Mascota eliminada de favoritos', isFavorite: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

console.log('✅ Rutas de favoritos configuradas');
console.log('   🔍 GET    /api/favoritos/check/:postId');
console.log('   ⭐ GET    /api/favoritos');
console.log('   ⭐ POST   /api/favoritos/:postId');
console.log('   💔 DELETE /api/favoritos/:postId');
console.log('   🔍 GET    /api/favoritos/check-pet/:petId');
console.log('   ⭐ POST   /api/favoritos/pet/:petId');
console.log('   💔 DELETE /api/favoritos/pet/:petId');

module.exports = router;