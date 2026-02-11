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

console.log('🚀 Iniciando Adoptapet Backend v2.0...');

const app = express();
const server = http.createServer(app);

const services = {
  mongoConnected: false,
  passportLoaded: false,
  socketLoaded: false
};

const uploadsDir = path.join(__dirname, 'uploads/avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Directorio uploads/avatars creado');
} else {
  console.log('✅ Directorio uploads/avatars existe');
}

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
console.log('✅ CORS configurado');

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

console.log('✅ Directorio uploads configurado');

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

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Demasiadas peticiones' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Demasiados intentos de login' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Demasiados uploads' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', (req, res, next) => {
  if (req.path.startsWith('/avatar')) {
    return next();
  }
  apiLimiter(req, res, next);
});

const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'adoptapet-secret-2024',
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

let passport;

try {
  passport = require('./src/config/passport');
  app.use(passport.initialize());
  app.use(passport.session());
  services.passportLoaded = true;
  console.log('✅ Passport cargado');
} catch (error) {
  console.error('❌ Error Passport:', error.message);
}

(async () => {
  try {
    const mongoose = require('mongoose');
    mongoose.set('strictQuery', false);
    mongoose.set('autoIndex', true);
    
    const { connectDB } = require('./src/config/database');
    await connectDB();
    services.mongoConnected = true;
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error MongoDB:', error.message);
  }
})();

let io;

try {
  const { initializeSocket } = require('./src/utils/socket');
  io = initializeSocket(server);
  services.socketLoaded = true;
  app.set('io', io);
  console.log('✅ Socket.io inicializado');
} catch (error) {
  console.error('❌ Error Socket.io:', error.message);
}

const logger = require('./src/utils/logger');

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.log.request(req.method, req.path, res.statusCode, duration);
  });
  next();
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: 'operational',
      mongodb: services.mongoConnected ? 'connected' : 'disconnected',
      googleAuth: services.passportLoaded ? 'enabled' : 'disabled',
      socketio: services.socketLoaded ? 'active' : 'inactive'
    }
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Adoptapet API',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      pets: '/api/pets',
      users: '/api/users',
      chat: '/api/chat',
      posts: '/api/posts',
      ai: '/api/ai'
    }
  });
});

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
    res.status(500).send('Error avatar');
  }
});

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
        
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
          { id: req.user._id, email: req.user.email, role: req.user.role || 'adopter' },
          process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025',
          { expiresIn: '7d' }
        );
        
        const userData = {
          id: req.user._id,
          nombre: req.user.nombre || req.user.name,
          email: req.user.email,
          avatar: req.user.avatar,
          rol: req.user.role || 'adopter'
        };
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/home?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
      } catch (error) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login?error=server_error`);
      }
    }
  );
}

try {
  const authRoutes = require('./src/routes/authRoutes');
  app.use('/api/auth', authLimiter, authRoutes);
  logger.log.success('Auth cargado');
} catch (error) {
  logger.log.warning('Auth no disponible');
}

try {
  const petRoutes = require('./src/routes/petRoutes');
  app.use('/api/pets', petRoutes);
  logger.log.success('Pets cargado');
} catch (error) {
  logger.log.warning('Pets no disponible');
}

try {
  const userRoutes = require('./src/routes/userRoutes');
  app.use('/api/users/avatar', uploadLimiter);
  app.use('/api/users', userRoutes);
  app.use('/', userRoutes);
  logger.log.success('Users cargado');
} catch (error) {
  logger.log.warning('Users no disponible');
}

try {
  const applicationRoutes = require('./src/routes/applicationRoutes');
  app.use('/api/applications', applicationRoutes);
  logger.log.success('Applications cargado');
} catch (error) {
  logger.log.warning('Applications no disponible');
}

try {
  const postRoutes = require('./src/routes/postRoutes');
  app.use('/api/posts', postRoutes);
  logger.log.success('Posts cargado');
} catch (error) {
  logger.log.warning('Posts no disponible');
}

try {
  const chatRoutes = require('./src/routes/chatRoutes');
  app.use('/api/chat', chatRoutes);
  logger.log.success('Chat cargado');
} catch (error) {
  logger.log.warning('Chat no disponible');
}

try {
  app.use('/api/favoritos', favoritesRoutes);
  logger.log.success('Favoritos cargado');
} catch (error) {
  logger.log.warning('Favoritos no disponible');
}

try {
  const notificationRoutes = require('./src/routes/Notificationroutes');
  app.use('/api/notifications', notificationRoutes);
  logger.log.success('Notifications cargado');
} catch (error) {
  logger.log.warning('Notifications no disponible');
}

// ============================================
// 🤖 RUTAS DE IA CON GROQ - CRÍTICO
// ============================================
try {
  const aiRoutes = require('./src/routes/aiRoutes');
  app.use('/api/ai', aiRoutes);
  logger.log.success('✨ IA cargado con Groq');
  console.log('   💬 POST /api/ai/chat');
  console.log('   🔍 POST /api/ai/identify-breed');
  console.log('   💡 POST /api/ai/advice');
} catch (error) {
  logger.log.warning('⚠️  IA no disponible');
  console.error('❌ Error IA:', error.message);
  console.error('   Stack:', error.stack);
}

app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    res.status(404).json({
      success: false,
      message: `Endpoint no encontrado: ${req.method} ${req.path}`
    });
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Error de validación' });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor'
  });
});

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
  
  console.log('\n🤖 IA Groq:');
  console.log(`   • API Key: ${process.env.GROQ_API_KEY ? '✅' : '❌'}`);
  console.log(`   • Endpoint: http://localhost:${PORT}/api/ai/chat`);
});

const gracefulShutdown = (signal) => {
  logger.showShutdown(signal);
  server.close(async () => {
    if (io) io.close();
    if (services.mongoConnected) {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;