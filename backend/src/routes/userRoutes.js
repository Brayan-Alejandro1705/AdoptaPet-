const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

console.log('👤 Rutas de usuarios cargadas');

// =============================================
// CLOUDINARY STORAGE PARA AVATARES
// =============================================

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'adopta-pet/avatars',
    resource_type: 'auto',
    quality: 'auto',
    fetch_format: 'auto'
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log(`✅ Archivo válido: ${file.originalname}`);
    return cb(null, true);
  }
  console.log(`❌ Tipo de archivo no permitido: ${file.mimetype}`);
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
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires')
      .sort({ createdAt: -1 });

    console.log(`✅ ${users.length} usuarios encontrados`);
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
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
        { email: { $regex: q, $options: 'i' } }
      ],
      status: 'active'
    })
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires')
      .limit(20);

    console.log(`🔍 Búsqueda: "${q}" - ${users.length} resultados`);
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('❌ Error al buscar usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios',
      error: error.message
    });
  }
});

// =============================================
// GET - Obtener perfil del usuario autenticado
// =============================================
router.get('/profile', protect, async (req, res) => {
  try {
    console.log(`📋 Obteniendo perfil del usuario: ${req.user.id}`);
    
    const user = await User.findById(req.user.id)
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log(`✅ Perfil obtenido: ${user.email}`);

    res.json({
      success: true,
      user: {
        id: user._id,
        nombre: user.name,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        telefono: user.phone,
        phone: user.phone,
        ubicacion: user.location?.city || user.location,
        location: user.location,
        rol: user.role,
        role: user.role,
        verified: user.verified,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
});

// =============================================
// PUT - Actualizar perfil del usuario
// ✅ ACEPTA AMBOS FORMATOS: español (nombre, telefono, ubicacion) e inglés (name, phone, location)
// =============================================
router.put('/profile', protect, async (req, res) => {
  try {
    console.log('✏️ Actualizando perfil...');
    console.log('📥 Datos recibidos:', JSON.stringify(req.body, null, 2));

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // ✅ ACEPTAR AMBOS FORMATOS
    const nombre = req.body.nombre || req.body.name;
    const bio = req.body.bio;
    const telefono = req.body.telefono || req.body.phone;
    const ubicacion = req.body.ubicacion || req.body.location;

    // ✅ IMPORTANTE: El schema usa "name" no "nombre"
    if (nombre) {
      user.name = nombre.trim();
      console.log(`📝 Nombre actualizado: ${user.name}`);
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
      console.log(`📄 Bio actualizada: ${user.bio.substring(0, 30)}...`);
    }

    // ✅ IMPORTANTE: El schema usa "phone" no "telefono"
    if (telefono) {
      user.phone = telefono.trim();
      console.log(`📞 Teléfono actualizado: ${user.phone}`);
    }

    // ✅ IMPORTANTE: El schema usa "location" no "ubicacion"
    if (ubicacion) {
      if (typeof ubicacion === 'object') {
        user.location = { ...user.location, ...ubicacion };
        console.log(`📍 Ubicación actualizada: ${JSON.stringify(user.location)}`);
      } else {
        // Si viene como string, asumimos que es la ciudad
        user.location = user.location || {};
        user.location.city = ubicacion.trim();
        console.log(`📍 Ciudad actualizada: ${user.location.city}`);
      }
    }

    await user.save();
    console.log(`✅ Perfil actualizado para: ${user.email}`);

    // ✅ RETORNAR EN AMBOS FORMATOS para que el frontend entienda
    res.json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user: {
        id: user._id,
        nombre: user.name,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        telefono: user.phone,
        phone: user.phone,
        ubicacion: user.location?.city || user.location,
        location: user.location,
        rol: user.role,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (error) {
    console.error('❌ Error al actualizar perfil:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        message: messages[0]
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
});

// =====================================================
// GET - Obtener ajustes de notificaciones
// =====================================================
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
      message: 'Error al obtener notificationSettings',
      error: error.message
    });
  }
});

// =====================================================
// PUT - Guardar ajustes de notificaciones
// =====================================================
router.put('/notification-settings', protect, async (req, res) => {
  try {
    const { likes, comments, followers, mentions, messages } = req.body;

    console.log('📬 Actualizando notificationSettings...');

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

    console.log('✅ Notificaciones actualizadas');

    return res.json({
      success: true,
      message: '✅ Configuración de notificaciones actualizada',
      notificationSettings: updatedUser.notificationSettings || {}
    });
  } catch (error) {
    console.error('❌ Error al actualizar notificationSettings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar notificationSettings',
      error: error.message
    });
  }
});

// =====================================================
// GET - Obtener ajustes de publicaciones (POST SETTINGS)
// =====================================================
router.get('/me/post-settings', protect, async (req, res) => {
  try {
    console.log('📋 Obteniendo postSettings...');
    
    const user = await User.findById(req.user.id).select('postSettings');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.json(user.postSettings || {});
  } catch (error) {
    console.error('❌ Error al obtener postSettings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener postSettings',
      error: error.message
    });
  }
});

// =====================================================
// PUT - Guardar ajustes de publicaciones
// =====================================================
router.put('/me/post-settings', protect, async (req, res) => {
  try {
    const { privacidadPorDefecto, permitirComentarios, permitirCompartir } = req.body;

    console.log('📝 Actualizando postSettings...');

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

    console.log('✅ Post settings actualizados');

    return res.json(updatedUser.postSettings || {});
  } catch (error) {
    console.error('❌ Error al actualizar postSettings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar postSettings',
      error: error.message
    });
  }
});

// =====================================================
// PATCH - Cambiar contraseña
// =====================================================
router.patch('/me/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    console.log('🔐 Cambiando contraseña...');

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

    console.log('✅ Contraseña actualizada');

    return res.json({
      success: true,
      message: '✅ Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
});

// =====================================================
// PATCH - Desactivar cuenta
// =====================================================
router.patch('/me/deactivate', protect, async (req, res) => {
  try {
    console.log('❌ Desactivando cuenta...');

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

    console.log('✅ Cuenta desactivada');

    return res.json({
      success: true,
      message: 'Cuenta desactivada correctamente'
    });
  } catch (error) {
    console.error('❌ Error al desactivar cuenta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al desactivar cuenta',
      error: error.message
    });
  }
});

// =====================================================
// POST - Subir avatar (CLOUDINARY)
// =====================================================
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    console.log('📸 Subiendo avatar a Cloudinary...');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ninguna imagen'
      });
    }

    const avatarUrl = req.file.secure_url;
    console.log(`✅ Avatar subido: ${avatarUrl}`);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    console.log(`✅ Avatar actualizado para: ${user.email}`);

    res.json({
      success: true,
      message: 'Avatar actualizado correctamente',
      avatar: avatarUrl,
      user: {
        id: user._id,
        nombre: user.name,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        rol: user.role,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Error al subir avatar:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Error al subir avatar',
      error: error.message
    });
  }
});

// =====================================================
// DELETE - Eliminar avatar
// =====================================================
router.delete('/avatar', protect, async (req, res) => {
  try {
    console.log('🗑️ Eliminando avatar...');

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const nameForAvatar = user.name || 'User';
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      nameForAvatar
    )}&size=200&background=random`;

    user.avatar = defaultAvatar;
    await user.save();

    console.log('✅ Avatar eliminado, volviendo al avatar por defecto');

    res.json({
      success: true,
      message: 'Avatar eliminado correctamente',
      avatar: defaultAvatar
    });
  } catch (error) {
    console.error('❌ Error al eliminar avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar avatar',
      error: error.message
    });
  }
});

// =============================================
// GET - Obtener usuario por ID (DEBE IR AL FINAL)
// =============================================
router.get('/:userId', protect, async (req, res) => {
  try {
    console.log(`👤 Obteniendo usuario: ${req.params.userId}`);

    const user = await User.findById(req.params.userId)
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log(`✅ Usuario encontrado: ${user.email}`);

    res.json({
      success: true,
      user: {
        id: user._id,
        nombre: user.name,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        telefono: user.phone,
        phone: user.phone,
        ubicacion: user.location?.city || user.location,
        location: user.location,
        rol: user.role,
        role: user.role,
        verified: user.verified,
        createdAt: user.createdAt,
        stats: user.stats
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
});

console.log('✅ Rutas de usuarios listas');

module.exports = router;