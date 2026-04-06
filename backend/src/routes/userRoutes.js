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

// Modelos para cascada al eliminar usuario
const Post = require('../models/Post');
const Pet = require('../models/Pet');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const Follow = require('../models/Follow');
const AdoptionRequest = require('../models/AdoptionRequest');
const Adoption = require('../models/Adoption');

console.log('👤 Rutas de usuarios cargadas');

// =============================================
// CLOUDINARY STORAGE PARA AVATARES
// =============================================
// ✅ CONFIGURAR CLOUDINARY CON VARIABLES DE ENTORNO
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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

    if (nombre) {
      user.name = nombre.trim();
      console.log(`📝 Nombre actualizado: ${user.name}`);
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
      console.log(`📄 Bio actualizada: ${user.bio.substring(0, 30)}...`);
    }

    if (telefono) {
      user.phone = telefono.trim();
      console.log(`📞 Teléfono actualizado: ${user.phone}`);
    }

    if (ubicacion) {
      if (typeof ubicacion === 'object') {
        user.location = { ...user.location, ...ubicacion };
        console.log(`📍 Ubicación actualizada: ${JSON.stringify(user.location)}`);
      } else {
        user.location = user.location || {};
        if (ubicacion.includes(',')) {
          const parts = ubicacion.split(',');
          user.location.city = parts[0].trim();
          user.location.country = parts.slice(1).join(',').trim();
        } else {
          user.location.city = ubicacion.trim();
        }
        console.log(`📍 Ciudad/País actualizado: ${user.location.city}`);
      }
    }

    await user.save();
    console.log(`✅ Perfil actualizado para: ${user.email}`);

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
// ✅ DELETE - Eliminar cuenta permanentemente (CASCADA COMPLETA)
// =====================================================
router.delete('/me/deactivate', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🗑️ Iniciando eliminación total de cuenta y datos para:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // --- 0️⃣ PREPARACIÓN: Obtener IDs de lo que se va a borrar para limpiar referencias ---
    const userPostIds = await Post.find({ author: userId }).distinct('_id');
    const userPetIds = await Pet.find({ owner: userId }).distinct('_id');

    // --- 1️⃣ PUBLICACIONES Y MASCOTAS ---
    await Post.deleteMany({ author: userId });
    await Pet.deleteMany({ owner: userId });
    console.log(`🗑️ Borrados: ${userPostIds.length} posts y ${userPetIds.length} mascotas`);

    // --- 2️⃣ SOCIAL: Amigos, Seguidores, Solicitudes y Conexiones ---
    await FriendRequest.deleteMany({ $or: [{ from: userId }, { to: userId }] });
    await Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] });
    
    // Quitar de listas de otros usuarios
    await User.updateMany(
      { $or: [{ friends: userId }, { connections: userId }, { favoritesPets: { $in: userPetIds } }, { favoritesPosts: { $in: userPostIds } }] },
      { 
        $pull: { 
          friends: userId, 
          connections: userId,
          favoritesPets: { $in: userPetIds },
          favoritesPosts: { $in: userPostIds }
        } 
      }
    );
    console.log('✅ Limpieza social y de favoritos completada');

    // --- 3️⃣ INTERACCIONES: Likes y Comentarios ---
    // Borrar likes del usuario
    await Like.deleteMany({ user: userId });
    
    // Quitar likes del usuario de los posts (stats.likes)
    await Post.updateMany(
      { 'stats.likes': userId },
      { 
        $pull: { 'stats.likes': userId },
        $inc: { 'stats.likesCount': -1 }
      }
    );

    // Borrar comentarios del usuario de la colección Comment
    await Comment.deleteMany({ author: userId });

    // Quitar comentarios del usuario embebidos en Posts
    // Nota: Esto es complejo si hay respuestas anidadas, pero limpiaremos lo básico
    await Post.updateMany(
      { 'comments.user': userId },
      { 
        $pull: { comments: { user: userId } }
        // Nota: El decremento de commentsCount es difícil de hacer masivamente con exactitud exacta en una sola query de $pull
      }
    );
    
    // Recalcular counts de comentarios para posts afectados (opcional pero recomendado)
    // Por simplicidad en este script masivo, lo dejaremos así por ahora.

    console.log('✅ Interacciones (likes/comentarios) limpiadas');

    // --- 4️⃣ COMUNICACIÓN: Chats, Conversaciones y Mensajes ---
    await Message.deleteMany({ sender: userId });
    
    // Individual chats/conversations donde el usuario participaba -> BORRAR
    await Chat.deleteMany({ participants: userId }); // Usualmente chats son de 2 en este modelo
    
    // Conversaciones: Quitar de la lista de participantes
    await Conversation.updateMany(
      { 'participants.user': userId },
      { $pull: { participants: { user: userId } } }
    );
    
    // Borrar conversaciones grupales que se queden vacías
    await Conversation.deleteMany({ participants: { $size: 0 } });

    console.log('✅ Comunicaciones (chats/mensajes) limpiadas');

    // --- 5️⃣ ADOPCIONES: Solicitudes y Registros ---
    await AdoptionRequest.deleteMany({ $or: [{ applicant: userId }, { owner: userId }] });
    await Adoption.deleteMany({ $or: [{ adopter: userId }, { owner: userId }] });
    console.log('✅ Registros de adopción limpiados');

    // --- 6️⃣ NOTIFICACIONES ---
    await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] });

    // --- 7️⃣ ELIMINACIÓN FINAL DEL USUARIO ---
    await User.findByIdAndDelete(userId);
    console.log('🚨 CUENTA ELIMINADA TOTALMENTE:', user.email);

    return res.json({
      success: true,
      message: 'Tu cuenta y todos tus datos (posts, mascotas, mensajes, likes, etc.) han sido eliminados permanentemente.'
    });

  } catch (error) {
    console.error('❌ ERROR FATAL AL ELIMINAR CUENTA:', error);
    return res.status(500).json({
      success: false,
      message: 'Error crítico al eliminar la cuenta',
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

    const avatarUrl = req.file.secure_url || req.file.path;
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

// =====================================================
// GET - Sugerencias de usuarios (personas que quizás conozcas)
// =====================================================
router.get('/suggestions', protect, async (req, res) => {
  try {
    console.log('💡 Obteniendo sugerencias para:', req.user.id);

    const currentUser = await User.findById(req.user.id).select('friends');
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const excludeIds = [
      req.user.id,
      ...(currentUser.friends || []).map(id => id.toString())
    ];

    const suggestions = await User.find({
      _id: { $nin: excludeIds },
      status: 'active',
      'verified.email': true
    })
      .select('name nombre email avatar bio location role verified createdAt')
      .sort({ createdAt: -1 })
      .limit(12);

    console.log(`✅ Sugerencias encontradas: ${suggestions.length}`);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('❌ Error al obtener sugerencias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener sugerencias',
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