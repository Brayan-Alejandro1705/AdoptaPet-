const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// =============================================
// MULTER CONFIG (AVATARS)
// =============================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/avatars';

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      'avatar-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) return cb(null, true);
  cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif, webp)'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter
});

// =============================================
// RUTAS
// =============================================

// GET - Obtener todos los usuarios
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

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
      _id: { $ne: req.user.id },
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

// GET - Obtener perfil del usuario autenticado (antes de /:userId)
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
        nombre: user.nombre || user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        telefono: user.telefono || user.phone,
        ubicacion: user.ubicacion || user.location,
        rol: user.rol || user.role
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

// =====================================================
// ✅ NOTIFICATION SETTINGS (NUEVO)
// =====================================================

// GET - Traer los ajustes de notificaciones del usuario autenticado
// GET /api/users/notification-settings
router.get('/notification-settings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('notificationSettings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.json({
      success: true,
      notificationSettings: user.notificationSettings || {}
    });
  } catch (error) {
    console.error('❌ Error al obtener notificationSettings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener notificationSettings'
    });
  }
});

// PUT - Guardar los ajustes de notificaciones del usuario autenticado
// PUT /api/users/notification-settings
router.put('/notification-settings', protect, async (req, res) => {
  try {
    const { likes, comments, followers, mentions, messages } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        notificationSettings: {
          likes: Boolean(likes),
          comments: Boolean(comments),
          followers: Boolean(followers),
          mentions: Boolean(mentions),
          messages: Boolean(messages)
        }
      },
      { new: true, runValidators: true }
    ).select('notificationSettings');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.json({
      success: true,
      message: '✅ Configuración de notificaciones actualizada',
      notificationSettings: updatedUser.notificationSettings || {}
    });
  } catch (error) {
    console.error('❌ Error al actualizar notificationSettings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar notificationSettings'
    });
  }
});

// =====================================================
// ✅ POST SETTINGS (NUEVO) - AJUSTES DE PUBLICACIONES
// =====================================================
// ✅ IMPORTANTÍSIMO: el frontend llama /me/post-settings
// Así que las rutas deben ser /me/post-settings

// GET /api/users/me/post-settings
router.get('/me/post-settings', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('postSettings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // 👇 Para que tu frontend (que hace ...data) funcione fácil,
    // devolvemos directamente el objeto (sin envolverlo)
    return res.json(user.postSettings || {});
  } catch (error) {
    console.error('❌ Error al obtener postSettings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener postSettings'
    });
  }
});

// PUT /api/users/me/post-settings
router.put('/me/post-settings', protect, async (req, res) => {
  try {
    const { privacidadPorDefecto, permitirComentarios, permitirCompartir } = req.body;

    // ✅ whitelist + validación simple
    const allowedPrivacy = ['publico', 'amigos', 'privado'];
    const safePrivacy = allowedPrivacy.includes(privacidadPorDefecto)
      ? privacidadPorDefecto
      : 'publico';

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        postSettings: {
          privacidadPorDefecto: safePrivacy,
          permitirComentarios: Boolean(permitirComentarios),
          permitirCompartir: Boolean(permitirCompartir),
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).select('postSettings');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Igual: devolvemos directo el objeto para el modal
    return res.json(updatedUser.postSettings || {});
  } catch (error) {
    console.error('❌ Error al actualizar postSettings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar postSettings'
    });
  }
});

// =====================================================
// ✅ CUENTA: CAMBIAR CONTRASEÑA (REAL)
// PATCH /api/users/me/password
// =====================================================
router.patch('/me/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos (currentPassword, newPassword)'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Esta cuenta fue creada con Google y no tiene contraseña local'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: '✅ Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña'
    });
  }
});

// =====================================================
// ✅ CUENTA: DESACTIVAR CUENTA (REAL)
// PATCH /api/users/me/deactivate
// =====================================================
router.patch('/me/deactivate', protect, async (req, res) => {
  try {
    const { reason } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { status: 'inactive' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.json({
      success: true,
      message: 'Cuenta desactivada correctamente'
    });
  } catch (error) {
    console.error('Error al desactivar cuenta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al desactivar cuenta'
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

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const currentUser = await User.findById(req.user.id);

    if (
      currentUser.avatar &&
      !currentUser.avatar.includes('googleusercontent') &&
      !currentUser.avatar.includes('ui-avatars')
    ) {
      const oldAvatarPath = path.join(__dirname, '../..', currentUser.avatar);
      if (fs.existsSync(oldAvatarPath)) fs.unlinkSync(oldAvatarPath);
    }

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
        nombre: user.nombre || user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        rol: user.rol || user.role
      }
    });
  } catch (error) {
    console.error('Error al subir avatar:', error);

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

    if (
      user.avatar &&
      !user.avatar.includes('googleusercontent') &&
      !user.avatar.includes('ui-avatars')
    ) {
      const avatarPath = path.join(__dirname, '../..', user.avatar);
      if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    }

    const nameForAvatar = user.nombre || user.name || 'User';
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      nameForAvatar
    )}&size=200&background=random`;

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

// =============================================
// GET - Perfil de usuario por ID (DEBE IR AL FINAL)
// =============================================
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
