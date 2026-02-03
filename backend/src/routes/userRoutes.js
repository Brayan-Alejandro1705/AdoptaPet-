const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Configurar almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/avatars';
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: fileFilter
});

// ===== RUTAS =====

// GET - Obtener todos los usuarios
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password') // No enviar contraseñas
      .sort({ createdAt: -1 }); // Más recientes primero
    
    console.log(`✅ ${users.length} usuarios encontrados`);
    
    res.json(users);
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener usuarios' 
    });
  }
});

// GET - Buscar usuarios por nombre
router.get('/search', protect, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false,
        message: 'Parámetro de búsqueda requerido' 
      });
    }

    const users = await User.find({
      _id: { $ne: req.user.id }, // Excluir al usuario actual
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { nombre: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('-password')
    .limit(20);

    console.log(`🔍 Búsqueda: "${q}" - ${users.length} resultados`);
    
    res.json(users);
  } catch (error) {
    console.error('❌ Error al buscar usuarios:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al buscar usuarios' 
    });
  }
});

// GET - Obtener perfil del usuario autenticado (DEBE IR ANTES DE /:userId)
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        nombre: user.nombre || user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        telefono: user.telefono || user.phone,
        ubicacion: user.ubicacion || user.location,
        rol: user.rol || user.role,
        verified: user.verified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener perfil' 
    });
  }
});

// PUT - Actualizar perfil del usuario
router.put('/profile', protect, async (req, res) => {
  try {
    const { nombre, bio, telefono, ubicacion } = req.body;
    
    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (bio) updateData.bio = bio;
    if (telefono) updateData.telefono = telefono;
    if (ubicacion) updateData.ubicacion = ubicacion;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        telefono: user.telefono,
        ubicacion: user.ubicacion,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar perfil' 
    });
  }
});

// POST - Subir avatar
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se recibió ninguna imagen' 
      });
    }

    // Construir URL del avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Obtener usuario actual para eliminar avatar anterior
    const currentUser = await User.findById(req.user.id);
    
    // Eliminar avatar anterior si existe y no es de Google
    if (currentUser.avatar && 
        !currentUser.avatar.includes('googleusercontent') && 
        !currentUser.avatar.includes('ui-avatars')) {
      
      const oldAvatarPath = path.join(__dirname, '../..', currentUser.avatar);
      if (fs.existsSync(oldAvatarPath)) {
        fs.unlinkSync(oldAvatarPath);
      }
    }

    // Actualizar usuario con nuevo avatar
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Avatar actualizado correctamente',
      avatar: avatarUrl,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error al subir avatar:', error);
    
    // Eliminar archivo si hubo error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al subir avatar' 
    });
  }
});

// DELETE - Eliminar avatar (volver al avatar por defecto)
router.delete('/avatar', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Eliminar archivo del avatar si existe
    if (user.avatar && 
        !user.avatar.includes('googleusercontent') && 
        !user.avatar.includes('ui-avatars')) {
      
      const avatarPath = path.join(__dirname, '../..', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }

    // Generar avatar por defecto
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&size=200&background=random`;
    
    user.avatar = defaultAvatar;
    await user.save();

    res.json({
      success: true,
      message: 'Avatar eliminado correctamente',
      avatar: defaultAvatar
    });
  } catch (error) {
    console.error('Error al eliminar avatar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar avatar' 
    });
  }
});

// GET - Obtener perfil de un usuario específico por ID (DEBE IR AL FINAL)
router.get('/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        nombre: user.nombre || user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        telefono: user.telefono || user.phone,
        ubicacion: user.ubicacion || user.location,
        rol: user.rol || user.role,
        verified: user.verified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener usuario' 
    });
  }
});

module.exports = router;