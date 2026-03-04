// =============================================
// CONTROLADOR DE AUTENTICACIÓN - Adoptapet
// =============================================

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// =============================================
// FUNCIÓN DE ENVÍO DE EMAIL (CON LOGS DETALLADOS)
// =============================================
const sendVerificationEmail = async (email, userName, code) => {
  try {
    console.log('🔄 Iniciando envío de email...');
    console.log('   📧 Email:', email);
    console.log('   👤 Usuario:', userName);
    console.log('   🔑 API Token:', process.env.API_TOKEN_MAILERSEND ? 'CONFIGURADO' : '❌ NO CONFIGURADO');
    console.log('   📬 EMAIL_USER:', process.env.EMAIL_USER || 'NO CONFIGURADO');

    if (!process.env.API_TOKEN_MAILERSEND) {
      throw new Error('API_TOKEN_MAILERSEND no está configurado');
    }

    if (!process.env.EMAIL_USER) {
      throw new Error('EMAIL_USER no está configurado');
    }

    const payload = {
      from: {
        email: process.env.EMAIL_USER,
        name: "AdoptaPet Team",
      },
      to: [
        {
          email: email,
        },
      ],
      subject: "🐾 Verifica tu email - AdoptaPet",
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu email - AdoptaPet</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Arial', sans-serif;
      background-color: #f4f4f7;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    .header-title {
      color: #ffffff;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 20px;
      color: #333333;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      color: #666666;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .code-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .code-label {
      color: #ffffff;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .code {
      color: #ffffff;
      font-size: 48px;
      font-weight: bold;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-text {
      color: #856404;
      font-size: 14px;
      margin: 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer-text {
      color: #6c757d;
      font-size: 14px;
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">🐾</div>
      <h1 class="header-title">AdoptaPet</h1>
    </div>
    <div class="content">
      <p class="greeting">¡Hola ${userName}! 👋</p>
      <p class="message">
        ¡Bienvenido/a a AdoptaPet! Estamos emocionados de tenerte en nuestra comunidad de amantes de los animales. 🎉
      </p>
      <p class="message">
        Para completar tu registro, verifica tu email usando el siguiente código:
      </p>
      <div class="code-container">
        <div class="code-label">Tu código de verificación</div>
        <div class="code">${code}</div>
      </div>
      <p class="message">
        Ingresa este código en la aplicación para activar tu cuenta.
      </p>
      <div class="warning">
        <p class="warning-text">
          ⚠️ <strong>Importante:</strong> Este código expira en 15 minutos.
        </p>
      </div>
      <p class="message">
        ¡Gracias por unirte! ❤️
      </p>
    </div>
    <div class="footer">
      <p class="footer-text">© 2025 AdoptaPet. Todos los derechos reservados.</p>
      <p class="footer-text">Ayudando a mascotas a encontrar hogares felices 🏡</p>
    </div>
  </div>
</body>
</html>
      `,
    };

    console.log('📤 Enviando a MailerSend...');

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Authorization: `Bearer ${process.env.API_TOKEN_MAILERSEND}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('📡 Respuesta MailerSend Status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ MailerSend Error Status:', response.status);
      console.error('❌ MailerSend Error Body:', errorData);
      throw new Error(`MailerSend HTTP ${response.status}: ${errorData}`);
    }

    const responseData = await response.json().catch(() => ({}));
    console.log('✅ Email de verificación enviado EXITOSAMENTE a:', email);
    console.log('   🔢 Código:', code);
    console.log('   📨 Respuesta:', responseData);
    return { success: true };
  } catch (err) {
    console.error('❌ ERROR AL ENVIAR EMAIL:');
    console.error('   Mensaje:', err.message);
    console.error('   Stack:', err.stack);
    throw err;
  }
};

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

    console.log('👤 Usuario creado:', user.email);

    try {
      await sendVerificationEmail(user.email, user.name, verificationCode);
    } catch (emailError) {
      console.error('❌ Error enviando email:', emailError.message);
      // No interrumpir el flujo si falla el email
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

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
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