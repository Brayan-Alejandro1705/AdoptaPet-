require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando Adoptapet Backend v2.0...');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const services = {
  mongoConnected: false,
  passportLoaded: false,
  socketLoaded: false,
  geminiLoaded: false
};

const uploadsDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Directorio uploads/avatars creado');
} else {
  console.log('✅ Directorio uploads/avatars existe');
}

// ============================================
// 1. CORS (CORREGIDO PARA VERCEL PREVIEW + EXPRESS 5)
// ============================================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://adoptapet.up.railway.app',
      'https://adoptapet-production-9df1.up.railway.app',
      'https://adopta-pet-omega.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    const isVercelPreview = origin && origin.endsWith('.vercel.app');

    if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
      return callback(null, true);
    }

    console.warn('⚠️  Origen bloqueado por CORS:', origin);
    return callback(new Error('No permitido por CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// ✅ CORRECCIÓN CLAVE: regex en lugar de '*' (incompatible con Express 5)
app.options(/(.*)/, cors(corsOptions));

console.log('✅ CORS configurado con soporte para uploads');

// ============================================
// 2. SEGURIDAD
// ============================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());

// ============================================
// 3. PARSERS
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// ARCHIVOS ESTÁTICOS
// ============================================
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cache-Control', 'public, max-age=31536000');
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    if (mimeTypes[ext]) res.setHeader('Content-Type', mimeTypes[ext]);
  }
}));

console.log('✅ Directorio uploads configurado en: /uploads');
console.log('📂 Ruta física:', path.join(__dirname, 'uploads'));

// ============================================
// 4. PROTECCIÓN NOSQL INJECTION
// ============================================
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (let key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
});

console.log('✅ Protección NoSQL Injection activada');

// ============================================
// 5. RATE LIMITING
// ============================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Demasiadas peticiones, intenta más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Demasiados intentos de login, intenta en 15 minutos' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Demasiados uploads, intenta más tarde' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', (req, res, next) => {
  if (req.path.startsWith('/avatar')) return next();
  apiLimiter(req, res, next);
});

// ============================================
// 6. SESIONES
// ============================================
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'adoptapet-secret-2024-change-this',
  resave: false,
  saveUninitialized: false,
  name: 'adoptapet.sid',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
};

if (process.env.NODE_ENV === 'production' && process.env.MONGO_URI) {
  const MongoStore = require('connect-mongo');
  sessionConfig.store = MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    touchAfter: 24 * 3600
  });
}

app.use(session(sessionConfig));

// ============================================
// 7. PASSPORT
// ============================================
const passport = require('passport');

try {
  require('./src/config/passport');
  app.use(passport.initialize());
  app.use(passport.session());
  services.passportLoaded = true;
  console.log('✅ Passport cargado correctamente');
} catch (error) {
  console.error('❌ Error al cargar Passport:', error.message);
  console.log('⚠️  La app continuará sin Google OAuth');
}

// ============================================
// 8. MONGODB
// ============================================
(async () => {
  try {
    const mongoose = require('mongoose');
    mongoose.set('strictQuery', false);
    mongoose.set('autoIndex', true);
    const { connectDB } = require('./src/config/database');
    await connectDB();
    services.mongoConnected = true;
    console.log('✅ MongoDB conectado correctamente');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    console.log('⚠️  La app continuará sin base de datos');
  }
})();

// ============================================
// 9. SOCKET.IO (CHAT TIEMPO REAL)
// ============================================
let io;

try {

  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  services.socketLoaded = true;

  app.set('io', io);

  console.log('✅ Socket.io inicializado correctamente');


  // ===============================
  // USUARIOS CONECTADOS
  // ===============================
  const onlineUsers = new Map();


  io.on("connection", (socket) => {

    console.log("🟢 Usuario conectado:", socket.id);


    // registrar usuario
    socket.on("register", (userId) => {

      onlineUsers.set(userId, socket.id);

      console.log("👤 Usuario registrado en socket:", userId);

    });


    // ===============================
    // MENSAJE EN TIEMPO REAL
    // ===============================
    socket.on("sendMessage", (data) => {

      const { receiverId } = data;

      const receiverSocket = onlineUsers.get(receiverId);

      if (receiverSocket) {

        io.to(receiverSocket).emit("newMessage", data);

      }

    });


    // ===============================
    // USUARIO DESCONECTADO
    // ===============================
    socket.on("disconnect", () => {

      for (let [userId, socketId] of onlineUsers.entries()) {

        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }

      }

      console.log("🔴 Usuario desconectado:", socket.id);

    });

  });

} catch (error) {

  console.error('❌ Error al cargar Socket.io:', error.message);

  console.log('⚠️  El chat no estará disponible');

}

// ============================================
// 10. LOGGING
// ============================================
const logger = require('./src/utils/logger');

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.log.request(req.method, req.path, res.statusCode, duration);
  });
  next();
});

// ============================================
// RUTAS DE ESTADO
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      api: 'operational',
      mongodb: services.mongoConnected ? 'connected' : 'disconnected',
      googleAuth: services.passportLoaded ? 'enabled' : 'disabled',
      socketio: services.socketLoaded ? 'active' : 'inactive',
      gemini: services.geminiLoaded ? 'active' : 'inactive',
      uploads: fs.existsSync(uploadsDir) ? 'enabled' : 'disabled'
    },
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Adoptapet API',
    version: '2.0.0',
    description: 'API para gestión de adopción de mascotas',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      pets: '/api/pets',
      users: '/api/users',
      applications: '/api/applications',
      chat: '/api/chat',
      posts: '/api/posts',
      ai: '/api/ai',
      uploads: '/uploads'
    }
  });
});

// ============================================
// PROXY PARA AVATARS
// ============================================
app.get('/api/avatar/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const axios = require('axios');
    const response = await axios.get(
      `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=100&background=random`,
      { responseType: 'arraybuffer' }
    );
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(response.data);
  } catch (error) {
    res.status(500).send('Error al cargar avatar');
  }
});

// ============================================
// RUTAS DE GOOGLE OAUTH
// ============================================
if (services.passportLoaded) {
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`,
      session: true
    }),
    (req, res) => {
      try {
        if (!req.user) throw new Error('Usuario no autenticado');
        console.log('✅ Usuario autenticado:', req.user.email);

        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { id: req.user._id || req.user.id, email: req.user.email, role: req.user.role || 'adopter' },
          process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025',
          { expiresIn: '7d' }
        );

        const userData = {
          id: req.user._id || req.user.id,
          nombre: req.user.nombre || req.user.name,
          email: req.user.email,
          avatar: req.user.avatar,
          rol: req.user.role || 'adopter'
        };

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendUrl}/home?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        console.log('🔄 Redirigiendo a:', redirectUrl);
        res.redirect(redirectUrl);

      } catch (error) {
        console.error('❌ Error en callback de Google:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?error=server_error`);
      }
    }
  );

  app.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      res.json({
        success: true,
        user: {
          id: req.user._id || req.user.id,
          nombre: req.user.nombre || req.user.name,
          email: req.user.email,
          avatar: req.user.avatar,
          rol: req.user.role || 'adopter'
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'No autenticado' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const email = req.user?.email || 'Usuario desconocido';
    req.logout((err) => {
      if (err) {
        console.error('❌ Error al cerrar sesión:', err);
        return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
      }
      req.session.destroy((err) => {
        if (err) console.error('❌ Error al destruir sesión:', err);
        console.log('👋 Sesión cerrada:', email);
        res.clearCookie('adoptapet.sid');
        res.json({ success: true, message: 'Sesión cerrada correctamente' });
      });
    });
  });

} else {
  app.get('/api/auth/google', (req, res) => {
    res.status(503).json({ success: false, message: 'Google OAuth no disponible. Verifica la configuración.' });
  });
  app.get('/api/auth/me', (req, res) => {
    res.status(503).json({ success: false, message: 'Servicio de autenticación no disponible' });
  });
}

// ============================================
// RUTAS DE AUTENTICACIÓN TRADICIONAL
// ============================================
try {
  console.log('\n🔐 Cargando rutas de autenticación...');
  const authRoutes = require('./src/routes/authRoutes');
  app.use('/api/auth', authLimiter, authRoutes);
  console.log('✅ Rutas de autenticación cargadas correctamente');
  console.log('   📝 POST /api/auth/registro');
  console.log('   🔑 POST /api/auth/login');
  console.log('   ✉️  POST /api/auth/verify-email');
  console.log('   🔄 POST /api/auth/resend-verification');
} catch (error) {
  console.error('❌ ERROR CARGANDO RUTAS DE AUTENTICACIÓN:');
  console.error('   Mensaje:', error.message);
  console.error('   Stack:', error.stack);
}

// ============================================
// RUTAS DE USUARIOS ✅ CORREGIDO
// ============================================
try {
  console.log('\n👤 Cargando rutas de usuarios...');
  const userRoutes = require('./src/routes/userRoutes');
  
  if (!userRoutes) {
    throw new Error('userRoutes no está exportado correctamente');
  }
  
  app.use('/api/users/avatar', uploadLimiter);
  app.use('/api/users', userRoutes);
  console.log('✅ Rutas de usuarios cargadas correctamente');
  console.log('   📋 GET /api/users/profile');
  console.log('   ✏️  PUT /api/users/profile');
  console.log('   📸 POST /api/users/avatar');
  console.log('   🔐 PATCH /api/users/me/password');
  console.log('   ⚙️  GET /api/users/notification-settings');
  console.log('   ⚙️  PUT /api/users/notification-settings');
  console.log('   📝 GET /api/users/me/post-settings');
  console.log('   📝 PUT /api/users/me/post-settings');
} catch (error) {
  console.error('❌ ERROR AL CARGAR RUTAS DE USUARIOS:');
  console.error('   Mensaje:', error.message);
  console.error('   Stack:', error.stack);
  process.exit(1);
}

// ============================================
// RUTAS DE SOLICITUDES DE AMISTAD
// ============================================
try {
  console.log('\n👥 Cargando rutas de solicitudes de amistad...');
  const friendRequestRoutes = require('./src/routes/friendRequestRoutes');
  app.use('/api/friend-requests', friendRequestRoutes);
  console.log('✅ Rutas de solicitudes de amistad cargadas');
  console.log('   📨 POST /api/friend-requests');
  console.log('   ✅ PATCH /api/friend-requests/:id/accept');
  console.log('   ❌ PATCH /api/friend-requests/:id/reject');
} catch (error) {
  console.error('⚠️  Error cargando rutas de solicitudes de amistad:', error.message);
}

// ============================================
// RUTAS DE MASCOTAS
// ============================================
try {
  console.log('\n🐾 Cargando rutas de mascotas...');
  const petRoutes = require('./src/routes/petRoutes');
  app.use('/api/pets', petRoutes);
  console.log('✅ Rutas de mascotas cargadas');
  console.log('   📝 POST /api/pets');
  console.log('   📋 GET /api/pets');
  console.log('   🔍 GET /api/pets/:id');
} catch (error) {
  console.error('⚠️  Error cargando rutas de mascotas:', error.message);
}

// ============================================
// RUTAS DE SOLICITUDES DE ADOPCIÓN
// ============================================
try {
  console.log('\n📋 Cargando rutas de solicitudes de adopción...');
  let applicationRoutes;
  try {
    applicationRoutes = require('./src/routes/applicationRoutes');
  } catch (loadError) {
    // Si el archivo no existe, crear una ruta placeholder
    const express = require('express');
    const placeholderRouter = express.Router();
    placeholderRouter.get('/', (req, res) => {
      res.json({ success: true, message: 'Rutas de solicitudes de adopción no configuradas aún' });
    });
    applicationRoutes = placeholderRouter;
    console.log('   ⏸️  Usando placeholder para solicitudes de adopción');
  }
  
  app.use('/api/applications', applicationRoutes);
  console.log('✅ Rutas de solicitudes de adopción cargadas');
} catch (error) {
  console.error('⚠️  Error cargando rutas de solicitudes:', error.message);
}

// ============================================
// RUTAS DE PUBLICACIONES
// ============================================
try {
  console.log('\n📱 Cargando rutas de publicaciones...');
  const postRoutes = require('./src/routes/postRoutes');
  app.use('/api/posts', postRoutes);
  console.log('✅ Rutas de publicaciones cargadas');
  console.log('   📝 POST /api/posts');
  console.log('   📰 GET /api/posts');
  console.log('   ❤️  POST /api/posts/:id/like');
} catch (error) {
  console.error('❌ ERROR CARGANDO RUTAS DE PUBLICACIONES:', error.message);
  console.error('   Stack:', error.stack);
}

// ============================================
// RUTAS DE CHAT
// ============================================
try {
  console.log('\n💬 Cargando rutas de chat...');
  const chatRoutes = require('./src/routes/chatRoutes');
  app.use('/api/chat', chatRoutes);
  console.log('✅ Rutas de chat cargadas');
  console.log('   📨 GET /api/chat');
  console.log('   💬 POST /api/chat/:id/messages');
} catch (error) {
  console.error('⚠️  Error cargando rutas de chat:', error.message);
}

// ============================================
// RUTAS DE FAVORITOS - ✅ VERSIÓN CORREGIDA
// ============================================
try {
  console.log('\n⭐ Cargando rutas de favoritos...');
  
  let favoritesRoutes;
  try {
    favoritesRoutes = require('./src/routes/favoritos');
    console.log('   📂 Archivo cargado: ./src/routes/favoritos.js');
  } catch (loadError) {
    console.error('   ❌ Error al cargar archivo:', loadError.message);
    throw loadError;
  }
  
  if (!favoritesRoutes) {
    throw new Error('favoritesRoutes es null o undefined - verifica module.exports');
  }
  
  if (typeof favoritesRoutes !== 'object' && typeof favoritesRoutes !== 'function') {
    throw new Error(`favoritesRoutes debe ser un objeto o función, pero es: ${typeof favoritesRoutes}`);
  }
  
  app.use('/api/favoritos', favoritesRoutes);
  console.log('✅ Rutas de favoritos cargadas correctamente');
  console.log('   🔍 GET    /api/favoritos/check/:postId');
  console.log('   ⭐ GET    /api/favoritos');
  console.log('   ⭐ POST   /api/favoritos/:postId');
  console.log('   💔 DELETE /api/favoritos/:postId');
  console.log('   🔍 GET    /api/favoritos/check-pet/:petId');
  console.log('   ⭐ POST   /api/favoritos/pet/:petId');
  console.log('   💔 DELETE /api/favoritos/pet/:petId');
} catch (error) {
  console.error('❌ ERROR CRÍTICO AL CARGAR RUTAS DE FAVORITOS:');
  console.error('   Mensaje:', error.message);
  console.error('   Archivo esperado: ./src/routes/favoritos.js');
  console.error('   Verifica que el archivo exista y tenga: module.exports = router;');
  if (process.env.NODE_ENV === 'development') {
    console.error('   Stack:', error.stack);
  }
  process.exit(1);
}

// ============================================
// RUTAS DE NOTIFICACIONES
// ============================================
try {
  console.log('\n🔔 Cargando rutas de notificaciones...');
  const notificationRoutes = require('./src/routes/Notificationroutes');
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ Rutas de notificaciones cargadas');
} catch (error) {
  console.error('⚠️  Error cargando rutas de notificaciones:', error.message);
}

// ============================================
// RUTAS DE IA - GOOGLE GEMINI
// ============================================
try {
  console.log('\n🤖 Cargando rutas de IA (Google Gemini)...');
  const geminiRoutes = require('./src/routes/geminiRoutes');
  app.use('/api/ai', geminiRoutes);
  services.geminiLoaded = true;
  console.log('✅ Rutas de IA cargadas correctamente');
  console.log('   💬 POST /api/ai/chatbot');
  console.log('   🔍 POST /api/ai/analyze-pet');
  console.log('   🛡️  POST /api/ai/moderate');
  console.log('   ✅ POST /api/ai/validate-posting');
  console.log('   📝 POST /api/ai/generate-description');
  console.log('   🔄 POST /api/ai/check-duplicate');
} catch (error) {
  console.error('⚠️  Error cargando rutas de IA:', error.message);
  console.log('   💡 Verifica que los archivos existan:');
  console.log('      - ./src/routes/geminiRoutes.js');
  console.log('      - ./src/services/geminiService.js');
}

// ============================================
// 404
// ============================================
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    res.status(404).json({
      success: false,
      message: `Endpoint no encontrado: ${req.method} ${req.path}`,
      suggestion: 'Verifica la documentación en /api/info'
    });
  } else {
    next();
  }
});

// ============================================
// MANEJO DE ERRORES GLOBAL
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (process.env.NODE_ENV === 'development') console.error('   Stack:', err.stack);

  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({ success: false, message: 'Acceso denegado por política de CORS', origin: req.headers.origin });
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Error de validación', errors: Object.values(err.errors).map(e => e.message) });
  }
  if (err.name === 'CastError') return res.status(400).json({ success: false, message: 'ID inválido' });
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ success: false, message: `El ${field} ya está registrado` });
  }
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Token inválido' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token expirado' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ success: false, message: 'El archivo es demasiado grande. Máximo 5MB.' });
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return res.status(400).json({ success: false, message: 'Campo de archivo inesperado' });

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log('\n' + '='.repeat(60));
  console.log('✅ ADOPTAPET BACKEND INICIADO CORRECTAMENTE');
  console.log('='.repeat(60));
  console.log(`🚀 Servidor escuchando en: http://${HOST}:${PORT}`);
  console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('\n📊 Estado de servicios:');
  console.log(`   ✅ Express API`);
  console.log(`   ${services.mongoConnected ? '✅' : '⚠️'} MongoDB ${services.mongoConnected ? 'conectado' : 'desconectado'}`);
  console.log(`   ${services.passportLoaded ? '✅' : '⚠️'} Google OAuth ${services.passportLoaded ? 'activo' : 'inactivo'}`);
  console.log(`   ${services.socketLoaded ? '✅' : '⚠️'} Socket.io ${services.socketLoaded ? 'activo' : 'inactivo'}`);
  console.log(`   ${services.geminiLoaded ? '✅' : '⚠️'} Google Gemini ${services.geminiLoaded ? 'activo' : 'inactivo'}`);
  console.log('\n📂 Uploads:');
  console.log(`   URL: http://localhost:${PORT}/uploads`);
  console.log(`   Directorio: ${uploadsDir}`);
  console.log('\n🤖 Inteligencia Artificial:');
  console.log(`   ${process.env.GROQ_API_KEY ? '✅' : '❌'} Groq API Key ${process.env.GROQ_API_KEY ? 'configurada' : 'NO configurada'}`);
  console.log(`   ${process.env.GOOGLE_API_KEY ? '✅' : '❌'} Google Gemini Key ${process.env.GOOGLE_API_KEY ? 'configurada' : 'NO configurada'}`);
  console.log(`   Modelos: llama-3.3-70b-versatile (Groq) + Gemini 1.5 (Google)`);
  console.log('\n📚 Documentación:');
  console.log(`   http://${HOST}:${PORT}/api/info`);
  console.log(`   http://${HOST}:${PORT}/health`);
  console.log('='.repeat(60) + '\n');
});

// ============================================
// CIERRE GRACEFUL
// ============================================
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  Recibida señal de cierre: ${signal}`);
  server.close(async () => {
    console.log('✅ Servidor HTTP cerrado');
    if (services.socketLoaded && io) {
      io.close(() => {
        console.log('✅ Socket.io cerrado');
      });
    }
    if (services.mongoConnected) {
      try {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        console.log('✅ MongoDB desconectado');
      } catch (error) {
        console.error('❌ Error al cerrar MongoDB:', error.message);
      }
    }
    console.log('👋 Adiós!\n');
    process.exit(0);
  });
  setTimeout(() => {
    console.log('❌ Forzando cierre después de timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;