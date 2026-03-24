// =============================================
// CONTROLADOR DE AUTENTICACIÓN - Adoptapet
// =============================================

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

// =============================================
// GENERAR TOKEN
// =============================================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// =============================================
// REGISTRO
// =============================================
exports.registro = async (req, res) => {
  try {
    const { nombre, email, password, passwordConfirm, telefono } = req.body;

    if (!nombre || !email || !password || !passwordConfirm) {
      return res.status(400).json({ success: false, message: 'Por favor completa todos los campos obligatorios' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Ya existe una cuenta con este email' });
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpires = new Date(Date.now() + 15 * 60 * 1000);

    const user = await User.create({
      name: nombre.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: telefono || undefined,
      verificationToken: verificationCode,
      verificationTokenExpires: verificationExpires,
      verified: { email: false }
    });

    console.log('👤 Usuario creado:', user.email);

    try {
      await sendVerificationEmail(user.email, user.name, verificationCode);
    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError.message);
    }

    res.status(201).json({
      success: true,
      message: `Código enviado a ${user.email}`,
      requiresVerification: true,
      email: user.email
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ya existe una cuenta con este email' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages[0] });
    }
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// =============================================
// LOGIN
// =============================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Por favor ingresa email y contraseña' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
    }

    if (user.isLocked) {
      return res.status(423).json({ success: false, message: 'Cuenta bloqueada temporalmente. Intenta en 2 horas.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, message: 'Email o contraseña incorrectos' });
    }

    if (!user.verified.email) {
      return res.status(403).json({
        success: false,
        message: 'Debes verificar tu email antes de iniciar sesión',
        requiresVerification: true,
        email: user.email
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Tu cuenta ha sido suspendida.' });
    }

    await user.resetLoginAttempts();
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        verified: user.verified
      }
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// =============================================
// VERIFICAR EMAIL
// =============================================
exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email y código son requeridos' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+verificationToken +verificationTokenExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'No se encontró ninguna cuenta con ese email' });
    }

    if (user.verified.email) {
      const token = generateToken(user._id);
      return res.json({
        success: true,
        message: 'Email ya verificado. Entrando...',
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, verified: user.verified }
      });
    }

    if (!user.verificationTokenExpires || user.verificationTokenExpires < Date.now()) {
      return res.status(400).json({ success: false, message: 'El código ha expirado. Solicita uno nuevo.', expired: true });
    }

    if (user.verificationToken !== code.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Código incorrecto. Intenta de nuevo.' });
    }

    await user.verifyEmail();
    const token = generateToken(user._id);
    console.log(`✅ Email verificado: ${user.email}`);

    res.json({
      success: true,
      message: '¡Email verificado! Bienvenido a AdoptaPet 🐾',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        verified: { email: true }
      }
    });

  } catch (error) {
    console.error('❌ Error al verificar email:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// =============================================
// REENVIAR CÓDIGO
// =============================================
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'El email es requerido' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+verificationToken +verificationTokenExpires');

    if (!user) {
      return res.status(404).json({ success: false, message: 'No se encontró ninguna cuenta con ese email' });
    }

    if (user.verified.email) {
      return res.status(400).json({ success: false, message: 'Este email ya fue verificado.' });
    }

    const newCode = crypto.randomInt(100000, 999999).toString();
    user.verificationToken = newCode;
    user.verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    try {
      await sendVerificationEmail(user.email, user.name, newCode);
    } catch (emailError) {
      console.error('❌ Error al reenviar email:', emailError.message);
    }

    res.json({ success: true, message: 'Código reenviado. Revisa tu bandeja de entrada.' });

  } catch (error) {
    console.error('❌ Error al reenviar verificación:', error);
    res.status(500).json({ success: false, message: 'Error al reenviar el código.' });
  }
};

// =============================================
// RECUPERAR CONTRASEÑA - Enviar correo
// =============================================
exports.recuperarPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'El email es requerido' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Respuesta genérica para no revelar si el email existe o no
    if (!user) {
      return res.json({
        success: true,
        message: 'Si ese email está registrado, recibirás un enlace en tu correo.'
      });
    }

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
      console.log('✅ Email de recuperación enviado a:', user.email);
    } catch (emailError) {
      // Si falla el correo, limpiar el token para no dejar datos colgados
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('❌ Error enviando email de recuperación:', emailError.message);
      return res.status(500).json({ success: false, message: 'Error al enviar el correo. Intenta de nuevo.' });
    }

    res.json({
      success: true,
      message: 'Si ese email está registrado, recibirás un enlace en tu correo.'
    });

  } catch (error) {
    console.error('❌ Error en recuperarPassword:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// =============================================
// RESET CONTRASEÑA - Guardar nueva contraseña
// =============================================
exports.resetPassword = async (req, res) => {
  try {
    const { token, password, passwordConfirm } = req.body;

    if (!token || !password || !passwordConfirm) {
      return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres' });
    }

    // Hashear el token recibido para comparar con el guardado en BD
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'El enlace es inválido o ha expirado.' });
    }

    // Actualizar contraseña y limpiar token
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('✅ Contraseña restablecida para:', user.email);

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.'
    });

  } catch (error) {
    console.error('❌ Error en resetPassword:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// =============================================
// GET ME
// =============================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, user });
  } catch (error) {
    console.error('❌ Error en getMe:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};