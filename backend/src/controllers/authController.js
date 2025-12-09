// =============================================
// CONTROLADOR DE AUTENTICACIÓN - Adoptapet
// =============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// =============================================
// FUNCIÓN AUXILIAR: Generar JWT
// =============================================
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025',
    { expiresIn: '7d' }
  );
};

// =============================================
// @desc    Registrar nuevo usuario
// @route   POST /api/auth/registro
// @access  Public
// =============================================
exports.registro = async (req, res) => {
  try {
    const { nombre, email, password, passwordConfirm, telefono } = req.body;

    console.log('📝 Intento de Registro:', { nombre, email, telefono });

    // Validar que las contraseñas coincidan
    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Las contraseñas no coinciden'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    // Crear nuevo usuario (el password se hasheará automáticamente en el middleware pre-save)
    const newUser = new User({
      name: nombre,
      email: email.toLowerCase(),
      password: password, // ← Sin hashear - el middleware lo hace
      phone: telefono || undefined,
      role: 'usuario',
      authProvider: 'local'
    });

    await newUser.save();

    console.log('✅ Usuario registrado exitosamente:', newUser.email);

    // Generar JWT
    const token = generateToken(newUser._id);

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: newUser._id,
        nombre: newUser.name,
        email: newUser.email,
        telefono: newUser.phone,
        rol: newUser.role,
        avatar: newUser.avatar
      }
    });

  } catch (error) {
    console.error('❌ Error en Registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =============================================
// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
// =============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Intento de login:', email);

    // Buscar usuario y seleccionar password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    console.log('✅ Usuario encontrado:', email);
    console.log('🔑 Tiene password?', !!user.password);

    // Verificar si el usuario tiene contraseña (puede ser usuario de Google)
    if (!user.password) {
      console.log('❌ Usuario sin contraseña (Google OAuth)');
      return res.status(401).json({
        success: false,
        message: 'Esta cuenta fue creada con Google. Por favor inicia sesión con Google.'
      });
    }

    // Verificar contraseña
    console.log('🔍 Comparando contraseñas...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔑 Contraseña válida?', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    console.log('✅ Login exitoso:', user.email);

    // Generar JWT
    const token = generateToken(user._id);

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        nombre: user.name,
        email: user.email,
        telefono: user.phone,
        direccion: user.location?.address || '',
        avatar: user.avatar,
        rol: user.role,
        verificado: user.isFullyVerified
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =============================================
// @desc    Obtener perfil del usuario autenticado
// @route   GET /api/auth/me
// @access  Private
// =============================================
exports.getMe = async (req, res) => {
  try {
    // El usuario ya viene del middleware protect
    const user = await User.findById(req.user.id);

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
        nombre: user.name,
        email: user.email,
        telefono: user.phone,
        direccion: user.location?.address || '',
        avatar: user.avatar,
        rol: user.role,
        verificado: user.isFullyVerified
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// =============================================
// @desc    Callback de Google OAuth
// @route   GET /auth/google/callback
// @access  Public (llamado por Google)
// =============================================
exports.googleCallback = async (req, res) => {
  try {
    console.log('🔄 Google callback recibido');
    
    const user = req.user;
    
    if (!user) {
      console.error('❌ No hay usuario en req.user');
      return res.redirect('http://127.0.0.1:5000/login.html?error=auth_failed');
    }

    console.log('✅ Usuario autenticado:', user.email);

    // Generar token
    const token = generateToken(user._id);
    console.log('🔑 Token JWT generado');

    // Preparar datos del usuario
    const userData = {
      id: user._id,
      nombre: user.name,
      email: user.email,
      telefono: user.phone || '',
      direccion: user.location?.address || '',
      rol: user.role,
      avatar: user.avatar,
      verificado: user.isFullyVerified
    };

    // Redirigir al frontend con token y usuario
    const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5000';
    const redirectUrl = `${frontendUrl}/Home?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
    
    console.log('🔄 Redirigiendo a frontend');
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('❌ Error en googleCallback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5000';
    res.redirect(`${frontendUrl}/login.html?error=server_error`);
  }
};