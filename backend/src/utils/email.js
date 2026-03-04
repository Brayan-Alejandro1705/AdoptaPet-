// backend/src/utils/email.js
const sendEmail = async (subject, message, send_to, sent_from, reply_to) => {
  try {
    const payload = {
      from: {
        email: process.env.EMAIL_USER || sent_from || "noreply@adoptapet.com",
        name: "AdoptaPet Team",
      },
      to: [
        {
          email: send_to,
        },
      ],
      subject: subject,
      html: message,
    };

    if (reply_to) {
      payload.reply_to = {
        email: reply_to,
        name: "Reply",
      };
    }

    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
        Authorization: `Bearer ${process.env.API_TOKEN_MAILERSEND}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("❌ MailerSend API Error Details:", errorData);
      throw new Error(`MailerSend HTTP Error: ${response.status} ${response.statusText}`);
    }

    console.log("✅ Email enviado exitosamente a:", send_to);
    return { success: true };
  } catch (err) {
    console.error("❌ Error enviando email:", err.message);
    throw new Error("Error al enviar email");
  }
};

// Generar código de verificación de 6 dígitos
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Plantilla HTML para email de verificación
const getVerificationEmailTemplate = (userName, code) => {
  return `
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
    .social-icons {
      margin: 20px 0;
    }
    .social-icon {
      display: inline-block;
      margin: 0 10px;
      font-size: 24px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <div class="logo">🐾</div>
      <h1 class="header-title">AdoptaPet</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <p class="greeting">¡Hola ${userName}! 👋</p>
      
      <p class="message">
        ¡Bienvenido/a a AdoptaPet! Estamos emocionados de tenerte en nuestra comunidad de amantes de los animales. 🎉
      </p>

      <p class="message">
        Para completar tu registro y comenzar a ayudar a mascotas a encontrar un hogar, por favor verifica tu dirección de correo electrónico usando el siguiente código:
      </p>

      <!-- Código de verificación -->
      <div class="code-container">
        <div class="code-label">Tu código de verificación</div>
        <div class="code">${code}</div>
      </div>

      <p class="message">
        Ingresa este código en la aplicación para activar tu cuenta.
      </p>

      <!-- Advertencia -->
      <div class="warning">
        <p class="warning-text">
          ⚠️ <strong>Importante:</strong> Este código expira en 15 minutos. Si no solicitaste este código, puedes ignorar este email de forma segura.
        </p>
      </div>

      <p class="message">
        Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
      </p>

      <p class="message" style="margin-top: 30px;">
        ¡Gracias por unirte a nuestra misión de encontrar hogares amorosos para mascotas! ❤️
      </p>

      <p class="message">
        <strong>El equipo de AdoptaPet</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="social-icons">
        <a href="#" class="social-icon">📧</a>
        <a href="#" class="social-icon">📱</a>
        <a href="#" class="social-icon">🌐</a>
      </div>
      <p class="footer-text">© 2025 AdoptaPet. Todos los derechos reservados.</p>
      <p class="footer-text">Ayudando a mascotas a encontrar hogares felices 🏡</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Plantilla HTML para email de bienvenida
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
      <p class="message">
        ¡Tu email ha sido verificado exitosamente! 🎊 Ahora eres parte oficial de nuestra comunidad de amantes de los animales.
      </p>
      <p class="message">
        Con tu cuenta verificada, ahora puedes:
      </p>
      <ul class="message">
        <li>🏠 Publicar mascotas en adopción</li>
        <li>❤️ Guardar tus favoritos</li>
        <li>💬 Chatear con otros usuarios</li>
        <li>📱 Compartir historias y fotos</li>
        <li>🌟 Solicitar adopciones</li>
      </ul>
      <p class="message">
        ¡Estamos emocionados de tenerte con nosotros en esta misión de ayudar a las mascotas a encontrar hogares amorosos!
      </p>
      <div style="text-align: center;">
        <a href="https://adopta-pet-omega.vercel.app" class="button">Ir a AdoptaPet</a>
      </div>
      <p class="message" style="margin-top: 30px;">
        ¡Gracias por unirte! 🐾
      </p>
      <p class="message">
        <strong>El equipo de AdoptaPet</strong>
      </p>
    </div>
    <div class="footer">
      <p>© 2025 AdoptaPet. Todos los derechos reservados.</p>
      <p>Ayudando a mascotas a encontrar hogares felices 🏡</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Enviar email de verificación
const sendVerificationEmail = async (email, userName, code) => {
  try {
    const htmlTemplate = getVerificationEmailTemplate(userName, code);
    
    await sendEmail(
      "🐾 Verifica tu email - AdoptaPet",
      htmlTemplate,
      email,
      process.env.EMAIL_USER || "noreply@adoptapet.com",
      null
    );

    console.log('✅ Email de verificación enviado:', email);
    console.log('   🔢 Código:', code);
    
    return {
      success: true,
      message: "Email de verificación enviado correctamente"
    };
  } catch (error) {
    console.error('❌ Error enviando email de verificación:', error.message);
    throw new Error('Error al enviar email de verificación');
  }
};

// Enviar email de bienvenida (después de verificación exitosa)
const sendWelcomeEmail = async (email, userName) => {
  try {
    const htmlTemplate = getWelcomeEmailTemplate(userName);
    
    await sendEmail(
      "🎉 ¡Bienvenido/a a AdoptaPet!",
      htmlTemplate,
      email,
      process.env.EMAIL_USER || "noreply@adoptapet.com",
      null
    );

    console.log('✅ Email de bienvenida enviado a:', email);
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error.message);
    // No lanzar error para no interrumpir el flujo
  }
};

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendEmail
};