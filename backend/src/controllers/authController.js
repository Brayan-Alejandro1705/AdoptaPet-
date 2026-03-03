// =============================================
// CONTROLADOR DE AUTENTICACIÓN - Adoptapet
// =============================================

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: '74.125.134.109',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error) => {
  if (error) {
    console.error('❌ Error al conectar con servidor de correo:', error.message);
  } else {
    console.log('✅ Servidor de correo listo para enviar emails');
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const sendVerificationEmail = async (email, code, nombre) => {
  await transporter.sendMail({
    from: `"AdoptaPet 🐾" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Código de verificación - AdoptaPet',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
        <div style="background:linear-gradient(135deg,#a855f7,#ec4899);padding:30px;text-align:center">
          <h1 style="color:white;margin:0;font-size:28px">🐾 AdoptaPet</h1>
          <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Verificación de correo electrónico</p>
        </div>
        <div style="padding:40px 30px;text-align:center">
          <p style="color:#555;font-size:16px">Hola <strong>${nombre || 'usuario'}</strong>,</p>
          <p style="color:#555;font-size:16px">Usa este código para verificar tu correo:</p>
          <div style="background:#f3e8ff;border:2px dashed #a855f7;border-radius:12px;padding:20px;display:inline-block;margin:20px 0">
            <div style="font-size:42px;font-weight:bold;color:#7c3aed;letter-spacing:10px">${code}</div>
          </div>
          <p style="color:#888;font-size:13px">⏰ Expira en <strong>15 minutos</strong>.</p>
        </div>
        <div style="background:#f9fafb;padding:20px;text-align:center;color:#aaa;font-size:12px">
          AdoptaPet — Dale un hogar a tu nuevo mejor amigo 🐶🐱
        </div>
      </div>
    `
  });
  console.log(`📧 Email enviado a: ${email}`);
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

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Ya existe una cuenta con este email' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
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

    try {
      await sendVerificationEmail(user.email, verificationCode, nombre);
    } catch (emailError) {
      console.error('❌ Error al enviar email:', emailError.message);
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
// ✅ Devuelve token directo para ir al home sin pasar por login
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

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = newCode;
    user.verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    await sendVerificationEmail(user.email, newCode, user.name);

    res.json({ success: true, message: 'Código reenviado. Revisa tu bandeja de entrada.' });

  } catch (error) {
    console.error('❌ Error al reenviar verificación:', error);
    res.status(500).json({ success: false, message: 'Error al reenviar el código.' });
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