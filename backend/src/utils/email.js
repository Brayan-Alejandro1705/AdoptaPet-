// backend/src/utils/email.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_FROM = `AdoptaPet <noreply@adoptapet.fun>`;

// ─── Envío genérico ───────────────────────────────────────────────────────────
const sendEmail = async (subject, html, send_to) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY no está configurado');
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to:   [send_to],
      subject,
      html,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(`Resend error: ${error.message}`);
    }

    console.log('✅ Email enviado a:', send_to, '| ID:', data.id);
    return { success: true, id: data.id };

  } catch (err) {
    console.error('❌ Error enviando email:', err.message);
    throw new Error('Error al enviar email');
  }
};

// ─── Código de verificación ───────────────────────────────────────────────────
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ─── Template: verificación ───────────────────────────────────────────────────
const getVerificationEmailTemplate = (userName, code) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu email - AdoptaPet</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f7; }
    .email-container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .logo { font-size: 48px; margin-bottom: 10px; }
    .header-title { color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #333333; margin-bottom: 20px; }
    .message { font-size: 16px; color: #666666; line-height: 1.6; margin-bottom: 20px; }
    .code-container { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
    .code-label { color: #ffffff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
    .code { color: #ffffff; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .warning-text { color: #856404; font-size: 14px; margin: 0; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer-text { color: #6c757d; font-size: 14px; margin: 5px 0; }
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
      <p class="message">Ingresa este código en la aplicación para activar tu cuenta.</p>
      <div class="warning">
        <p class="warning-text">
          ⚠️ <strong>Importante:</strong> Este código expira en 15 minutos. Si no solicitaste este código, ignora este email.
        </p>
      </div>
      <p class="message">¡Gracias por unirte a nuestra misión! ❤️</p>
      <p class="message"><strong>El equipo de AdoptaPet</strong></p>
    </div>
    <div class="footer">
      <p class="footer-text">© 2025 AdoptaPet. Todos los derechos reservados.</p>
      <p class="footer-text">Ayudando a mascotas a encontrar hogares felices 🏡</p>
    </div>
  </div>
</body>
</html>`;
};

// ─── Template: bienvenida ─────────────────────────────────────────────────────
const getWelcomeEmailTemplate = (userName) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
    .logo { font-size: 48px; }
    .title { color: #fff; font-size: 28px; font-weight: bold; margin: 10px 0 0 0; }
    .content { padding: 40px 30px; }
    .message { font-size: 16px; color: #666; line-height: 1.6; margin: 15px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🎉</div>
      <h1 class="title">¡Bienvenido/a a AdoptaPet!</h1>
    </div>
    <div class="content">
      <p class="message">¡Hola ${userName}!</p>
      <p class="message">¡Tu email ha sido verificado exitosamente! 🎊 Ahora eres parte oficial de nuestra comunidad.</p>
      <p class="message">Con tu cuenta verificada, ahora puedes:</p>
      <ul class="message">
        <li>🏠 Publicar mascotas en adopción</li>
        <li>❤️ Guardar tus favoritos</li>
        <li>💬 Chatear con otros usuarios</li>
        <li>📱 Compartir historias y fotos</li>
        <li>🌟 Solicitar adopciones</li>
      </ul>
      <div style="text-align: center;">
        <a href="https://adoptapet.fun" class="button">Ir a AdoptaPet</a>
      </div>
      <p class="message" style="margin-top: 30px;">¡Gracias por unirte! 🐾</p>
      <p class="message"><strong>El equipo de AdoptaPet</strong></p>
    </div>
    <div class="footer">
      <p>© 2025 AdoptaPet. Todos los derechos reservados.</p>
      <p>Ayudando a mascotas a encontrar hogares felices 🏡</p>
    </div>
  </div>
</body>
</html>`;
};

// ─── Template: recuperar contraseña ──────────────────────────────────────────
const getPasswordResetEmailTemplate = (userName, resetUrl) => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar contraseña - AdoptaPet</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f7; }
    .email-container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .logo { font-size: 48px; margin-bottom: 10px; }
    .header-title { color: #ffffff; font-size: 28px; font-weight: bold; margin: 0; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 20px; color: #333333; margin-bottom: 20px; }
    .message { font-size: 16px; color: #666666; line-height: 1.6; margin-bottom: 20px; }
    .button-container { text-align: center; margin: 30px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; }
    .url-box { background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 12px 16px; margin: 20px 0; word-break: break-all; font-size: 13px; color: #495057; }
    .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .warning-text { color: #856404; font-size: 14px; margin: 0; }
    .footer { background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef; }
    .footer-text { color: #6c757d; font-size: 14px; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">🔐</div>
      <h1 class="header-title">AdoptaPet</h1>
    </div>
    <div class="content">
      <p class="greeting">¡Hola ${userName}! 👋</p>
      <p class="message">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta en AdoptaPet.
      </p>
      <p class="message">
        Haz clic en el botón de abajo para crear una nueva contraseña:
      </p>
      <div class="button-container">
        <a href="${resetUrl}" class="button">Restablecer contraseña</a>
      </div>
      <p class="message">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
      <div class="url-box">${resetUrl}</div>
      <div class="warning">
        <p class="warning-text">
          ⚠️ <strong>Importante:</strong> Este enlace expira en 1 hora. Si no solicitaste restablecer tu contraseña, ignora este email — tu cuenta está segura.
        </p>
      </div>
      <p class="message"><strong>El equipo de AdoptaPet</strong></p>
    </div>
    <div class="footer">
      <p class="footer-text">© 2025 AdoptaPet. Todos los derechos reservados.</p>
      <p class="footer-text">Ayudando a mascotas a encontrar hogares felices 🏡</p>
    </div>
  </div>
</body>
</html>`;
};

// ─── Enviar verificación ──────────────────────────────────────────────────────
const sendVerificationEmail = async (email, userName, code) => {
  try {
    const html = getVerificationEmailTemplate(userName, code);
    await sendEmail('🐾 Verifica tu email - AdoptaPet', html, email);
    console.log('✅ Email de verificación enviado:', email, '| Código:', code);
    return { success: true, message: 'Email de verificación enviado correctamente' };
  } catch (error) {
    console.error('❌ Error enviando email de verificación:', error.message);
    throw new Error('Error al enviar email de verificación');
  }
};

// ─── Enviar bienvenida ────────────────────────────────────────────────────────
const sendWelcomeEmail = async (email, userName) => {
  try {
    const html = getWelcomeEmailTemplate(userName);
    await sendEmail('🎉 ¡Bienvenido/a a AdoptaPet!', html, email);
    console.log('✅ Email de bienvenida enviado a:', email);
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error.message);
  }
};

// ─── Enviar recuperación de contraseña ───────────────────────────────────────
const sendPasswordResetEmail = async (email, userName, resetUrl) => {
  try {
    const html = getPasswordResetEmailTemplate(userName, resetUrl);
    await sendEmail('🔐 Recupera tu contraseña - AdoptaPet', html, email);
    console.log('✅ Email de recuperación enviado a:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email de recuperación:', error.message);
    throw new Error('Error al enviar email de recuperación');
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendEmail
};