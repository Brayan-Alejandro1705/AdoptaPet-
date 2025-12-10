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
const favoritesRoutes = require("./src/routes/favoritos");

// ============================================
// INICIALIZACIÓN
// ============================================
console.log('🚀 Iniciando Adoptapet Backend v2.0...');

const app = express();
const server = http.createServer(app);

// Estado de servicios
const services = {
  mongoConnected: false,
  passportLoaded: false,
  socketLoaded: false
};

// ============================================
// CREAR DIRECTORIO DE UPLOADS
// ============================================
const uploadsDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Directorio uploads/avatars creado');
} else {
  console.log('✅ Directorio uploads/avatars existe');
}

// ============================================
// 1. CORS - CONFIGURACIÓN MEJORADA
// ============================================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    
    // Permitir requests sin origin (como Postman, mobile apps, etc.)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todos en desarrollo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
console.log('✅ CORS configurado con soporte para uploads');

// ============================================
// HEADERS ADICIONALES PARA ARCHIVOS
// ============================================
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  next();
});

// ============================================
// 2. SEGURIDAD - CONFIGURACIÓN AJUSTADA
// ============================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());

// ============================================
// 3. PARSERS
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// SERVIR ARCHIVOS ESTÁTICOS - MEJORADO
// ============================================
// Middleware específico para servir uploads con headers CORS correctos
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cache-Control', 'public, max-age=31536000');
  res.header('Content-Type', 'image/jpeg'); // Por defecto, se ajustará según el archivo
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Establecer el tipo MIME correcto según la extensión
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
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
  message: { 
    success: false, 
    message: 'Demasiadas peticiones, intenta más tarde' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { 
    success: false, 
    message: 'Demasiados intentos de login, intenta en 15 minutos' 
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter más permisivo para uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 uploads cada 15 minutos
  message: { 
    success: false, 
    message: 'Demasiados uploads, intenta más tarde' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

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
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
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
let passport;

try {
  passport = require('./src/config/passport');
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
// 9. SOCKET.IO
// ============================================
let io;

try {
  const { initializeSocket } = require('./src/utils/socket');
  io = initializeSocket(server);
  services.socketLoaded = true;
  app.set('io', io);
  console.log('✅ Socket.io inicializado correctamente');
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
  const health = {
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
      uploads: fs.existsSync(uploadsDir) ? 'enabled' : 'disabled'
    },
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  };
  
  res.status(200).json(health);
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Adoptapet API',
    version: '2.0.0',
    description: 'API para gestión de adopción de mascotas',
    documentation: '/api/docs',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      pets: '/api/pets',
      users: '/api/users',
      applications: '/api/applications',
      chat: '/api/chat',
      posts: '/api/posts',
      uploads: '/uploads'
    }
  });
});

app.get('/test/config', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    config: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000,
      passport: services.passportLoaded ? '✅ Cargado' : '❌ NO cargado',
      mongodb: services.mongoConnected ? '✅ Conectado' : '❌ Desconectado',
      socketio: services.socketLoaded ? '✅ Activo' : '❌ Inactivo',
      session: '✅ Configurado',
      uploads: fs.existsSync(uploadsDir) ? '✅ Habilitado' : '❌ Deshabilitado',
      uploadPath: uploadsDir,
      googleClientId: process.env.GOOGLE_CLIENT_ID ? '✅ Configurado' : '❌ NO configurado',
      googleSecret: process.env.GOOGLE_CLIENT_SECRET ? '✅ Configurado' : '❌ NO configurado',
      jwtSecret: process.env.JWT_SECRET ? '✅ Configurado' : '❌ NO configurado',
      mongoUri: process.env.MONGO_URI ? '✅ Configurado' : '❌ NO configurado'
    }
  });
});

// ============================================
// RUTAS DE GOOGLE OAUTH
// ============================================
if (services.passportLoaded) {
  app.get('/auth/google', 
    passport.authenticate('google', { 
      scope: ['profile', 'email']
    })
  );

  app.get('/auth/google/callback', 
    passport.authenticate('google', { 
      failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`,
      session: true
    }),
    (req, res) => {
      try {
        if (!req.user) {
          throw new Error('Usuario no autenticado');
        }
        
        console.log('✅ Usuario autenticado:', req.user.email);
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { 
            id: req.user._id || req.user.id, 
            email: req.user.email,
            role: req.user.role || 'adopter'
          },
          process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025',
          { expiresIn: '7d' }
        );
        
        const userData = {
          id: req.user._id || req.user.id,
          nombre: req.user.nombre,
          email: req.user.email,
          avatar: req.user.avatar,
          rol: req.user.role || 'adopter'
        };
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectUrl = `${frontendUrl}/Home?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`;
        
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
          nombre: req.user.nombre,
          email: req.user.email,
          avatar: req.user.avatar,
          rol: req.user.role || 'adopter'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }
  });

  app.post('/auth/logout', (req, res) => {
    const email = req.user?.email || 'Usuario desconocido';
    
    req.logout((err) => {
      if (err) {
        console.error('❌ Error al cerrar sesión:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error al cerrar sesión' 
        });
      }
      
      req.session.destroy((err) => {
        if (err) {
          console.error('❌ Error al destruir sesión:', err);
        }
        
        console.log('👋 Sesión cerrada:', email);
        res.clearCookie('adoptapet.sid');
        res.json({ 
          success: true, 
          message: 'Sesión cerrada correctamente' 
        });
      });
    });
  });

} else {
  app.get('/auth/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth no disponible. Verifica la configuración.'
    });
  });
  
  app.get('/api/auth/me', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Servicio de autenticación no disponible'
    });
  });
}

// ============================================
// RUTAS DE AUTENTICACIÓN TRADICIONAL
// ============================================
try {
  const authRoutes = require('./src/routes/authRoutes');
  app.use('/api/auth', authLimiter, authRoutes);
  logger.log.success('Rutas de autenticación tradicional cargadas');
} catch (error) {
  logger.log.warning('Rutas de autenticación tradicional no disponibles');
}

// ============================================
// RUTAS DE LA APLICACIÓN
// ============================================
try {
  const petRoutes = require('./src/routes/petRoutes');
  app.use('/api/pets', petRoutes);
  logger.log.success('Rutas de mascotas cargadas');
} catch (error) {
  logger.log.warning('Rutas de mascotas no disponibles');
}

try {
  const userRoutes = require('./src/routes/userRoutes');
  // Aplicar rate limiter específico para uploads de avatars
  app.use('/api/users/avatar', uploadLimiter);
  app.use('/api/users', userRoutes);
  // También agregar soporte para /profile sin /api
  app.use('/', userRoutes);
  logger.log.success('Rutas de usuarios cargadas');
} catch (error) {
  logger.log.warning('Rutas de usuarios no disponibles');
  console.error('Error detallado:', error.message);
}

try {
  const applicationRoutes = require('./src/routes/applicationRoutes');
  app.use('/api/applications', applicationRoutes);
  logger.log.success('Rutas de solicitudes cargadas');
} catch (error) {
  logger.log.warning('Rutas de solicitudes no disponibles');
}

try {
  const postRoutes = require('./src/routes/postRoutes');
  app.use('/api/posts', postRoutes);
  logger.log.success('Rutas de posts cargadas');
} catch (error) {
  logger.log.warning('Rutas de posts no disponibles');
  console.error('Error detallado:', error.message);
}

try {
  const chatRoutes = require('./src/routes/chatRoutes');
  app.use('/api/chat', chatRoutes);
  logger.log.success('Rutas de chat cargadas');
} catch (error) {
  logger.log.warning('Rutas de chat no disponibles');
  console.error('Error detallado:', error.message);
}

try {
  app.use('/api/favoritos', favoritesRoutes);
  logger.log.success('Rutas de favoritos cargadas');
} catch (error) {
  logger.log.warning('Rutas de favoritos no disponibles');
}

// ============================================
// MANEJO DE ERRORES 404
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

// ==========================================
// RUTA DE REDIRECCIÓN POST-LOGIN GOOGLE
// ==========================================
app.get('/Home', (req, res) => {
  const { token, user } = req.query;
  
  console.log('🏠 Redirigiendo después del login de Google');
  console.log('   Token:', token ? '✅' : '❌');
  console.log('   User:', user ? '✅' : '❌');
  
  if (!token || !user) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/login?error=missing_credentials`);
  }

  try {
    const userData = JSON.parse(decodeURIComponent(user));
    console.log('✅ Usuario válido:', userData.email);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/home?token=${token}&user=${user}`;
    
    console.log('🔄 Redirigiendo a frontend:', redirectUrl);
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=invalid_data`);
  }
});

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES GLOBAL
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  if (process.env.NODE_ENV === 'development') {
    console.error('   Stack:', err.stack);
  }
  
  if (err.message === 'No permitido por CORS') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado por política de CORS',
      origin: req.headers.origin
    });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID inválido'
    });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `El ${field} ya está registrado`
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado'
    });
  }
  
  // Error de Multer (upload de archivos)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'El archivo es demasiado grande. Máximo 5MB.'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Campo de archivo inesperado'
    });
  }
  
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
  logger.showStartupBanner({
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
    passportLoaded: services.passportLoaded,
    mongoConnected: services.mongoConnected,
    socketLoaded: services.socketLoaded
  });
  
  console.log('\n📂 Uploads configurado:');
  console.log(`   • URL: http://localhost:${PORT}/uploads`);
  console.log(`   • Directorio: ${uploadsDir}`);
});

// ============================================
// CIERRE GRACEFUL
// ============================================
const gracefulShutdown = (signal) => {
  logger.showShutdown(signal);
  
  server.close(async () => {
    logger.log.success('Servidor HTTP cerrado');
    
    if (services.socketLoaded && io) {
      io.close(() => {
        logger.log.success('Socket.io cerrado');
      });
    }
    
    if (services.mongoConnected) {
      try {
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.log.success('MongoDB desconectado');
      } catch (error) {
        logger.log.error('Error al cerrar MongoDB', error);
      }
    }
    
    console.log('👋 Adiós!\n');
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.log.warning('Forzando cierre después de timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;