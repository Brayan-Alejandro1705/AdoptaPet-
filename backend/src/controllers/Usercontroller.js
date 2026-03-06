// =============================================
// CONTROLADOR DE USUARIOS - ADOPTAPET
// =============================================

const User = require('../models/User');
const cloudinary = require('cloudinary').v2;

console.log('👤 Controlador de usuarios cargado');

// =============================================
// OBTENER PERFIL DEL USUARIO ACTUAL
// =============================================

exports.getProfile = async (req, res) => {
  try {
    console.log(`📋 Obteniendo perfil del usuario: ${req.user._id}`);
    
    const user = await User.findById(req.user._id)
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el perfil',
      error: error.message
    });
  }
};

// =============================================
// ACTUALIZAR PERFIL DEL USUARIO
// =============================================

exports.updateProfile = async (req, res) => {
  try {
    console.log('✏️ Actualizando perfil del usuario...');
    console.log('📥 Datos recibidos:', JSON.stringify(req.body, null, 2));

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // ✅ ACEPTAR AMBOS: "name" y "nombre"
    if (req.body.name) {
      user.name = req.body.name.trim();
      console.log(`📝 Nombre actualizado (name): ${user.name}`);
    } else if (req.body.nombre) {
      user.name = req.body.nombre.trim();
      console.log(`📝 Nombre actualizado (nombre): ${user.name}`);
    }

    // Email - NO SE PUEDE CAMBIAR
    // (comentado intencionalmente)

    // Bio
    if (req.body.bio !== undefined) {
      user.bio = req.body.bio.trim();
      console.log(`📄 Bio actualizada: ${user.bio.substring(0, 30)}...`);
    }

    // ✅ ACEPTAR AMBOS: "phone" y "telefono"
    if (req.body.phone) {
      user.phone = req.body.phone.trim();
      console.log(`📞 Teléfono actualizado (phone): ${user.phone}`);
    } else if (req.body.telefono) {
      user.phone = req.body.telefono.trim();
      console.log(`📞 Teléfono actualizado (telefono): ${user.phone}`);
    }

    // ✅ ACEPTAR AMBOS: "location" y "ubicacion"
    if (req.body.location) {
      if (typeof req.body.location === 'object') {
        user.location = { ...user.location, ...req.body.location };
        console.log(`📍 Ubicación actualizada (location): ${JSON.stringify(user.location)}`);
      } else {
        // Si viene como string, asumimos que es la ciudad
        user.location = user.location || {};
        user.location.city = req.body.location.trim();
        console.log(`📍 Ciudad actualizada (location): ${user.location.city}`);
      }
    } else if (req.body.ubicacion) {
      user.location = user.location || {};
      user.location.city = req.body.ubicacion.trim();
      console.log(`📍 Ciudad actualizada (ubicacion): ${user.location.city}`);
    }

    // Guardar cambios
    await user.save();
    console.log(`✅ Perfil actualizado exitosamente para: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado correctamente',
      user
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
      message: 'Error al actualizar el perfil',
      error: error.message
    });
  }
};

// =============================================
// SUBIR AVATAR (FOTO DE PERFIL)
// =============================================

exports.uploadAvatar = async (req, res) => {
  try {
    console.log('📸 Subiendo avatar...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Subir a Cloudinary
    console.log(`📤 Subiendo a Cloudinary...`);
    
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'adopta-pet/avatars',
      public_id: `avatar_${user._id}`,
      overwrite: true,
      quality: 'auto',
      fetch_format: 'auto'
    });

    console.log(`✅ Avatar subido a Cloudinary: ${result.secure_url}`);

    // Actualizar usuario
    user.avatar = result.secure_url;
    await user.save();

    console.log(`✅ Avatar actualizado para: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Avatar actualizado correctamente',
      avatar: user.avatar
    });

  } catch (error) {
    console.error('❌ Error al subir avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir el avatar',
      error: error.message
    });
  }
};

// =============================================
// OBTENER USUARIO POR ID
// =============================================

exports.getUserById = async (req, res) => {
  try {
    console.log(`👤 Obteniendo usuario: ${req.params.id}`);
    
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires')
      .populate('friends', 'name avatar email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ Error al obtener usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el usuario',
      error: error.message
    });
  }
};

// =============================================
// BUSCAR USUARIOS
// =============================================

exports.searchUsers = async (req, res) => {
  try {
    const { q, limit = 10, skip = 0 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda'
      });
    }

    console.log(`🔍 Buscando usuarios: "${q}"`);

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      status: 'active'
    })
      .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken -verificationTokenExpires')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await User.countDocuments({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      status: 'active'
    });

    console.log(`✅ Encontrados ${users.length} usuarios`);

    res.status(200).json({
      success: true,
      data: {
        users,
        total,
        limit: parseInt(limit),
        skip: parseInt(skip)
      }
    });

  } catch (error) {
    console.error('❌ Error al buscar usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios',
      error: error.message
    });
  }
};

// =============================================
// OBTENER ESTADÍSTICAS DEL USUARIO
// =============================================

exports.getUserStats = async (req, res) => {
  try {
    console.log(`📊 Obteniendo estadísticas del usuario: ${req.user._id}`);
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        stats: user.stats,
        verified: user.verified,
        friends: user.friends.length,
        profileCompleteness: user.profileCompleteness
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// =============================================
// CAMBIAR CONTRASEÑA
// =============================================

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'La contraseña actual es incorrecta'
      });
    }

    user.password = newPassword;
    await user.save();

    console.log(`✅ Contraseña actualizada para: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('❌ Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar la contraseña',
      error: error.message
    });
  }
};

// =============================================
// OBTENER AMIGOS DEL USUARIO
// =============================================

exports.getFriends = async (req, res) => {
  try {
    console.log(`👥 Obteniendo amigos del usuario: ${req.user._id}`);
    
    const user = await User.findById(req.user._id)
      .populate('friends', 'name avatar email role');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        friends: user.friends,
        count: user.friends.length
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener amigos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener amigos',
      error: error.message
    });
  }
};

console.log('✅ Controlador de usuarios listo');