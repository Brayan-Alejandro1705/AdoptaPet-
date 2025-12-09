// =============================================
// APLICACIÓN PRINCIPAL - Adoptapet BACKEND
// =============================================

require('dotenv').config(); // Cargar variables de entorno PRIMERO
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {connectDB} = require('./config/database');
const { globalErrorHandler, AppError } = require('./middleware/errorHandler');

console.log('🚀 Iniciando Adoptapet Backend...');

// Crear aplicación Express
const app = express();

// =============================================
// MIDDLEWARE DE LOGGING (solo en desarrollo)
// =============================================
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`📡 ${timestamp} - ${method} ${url} - IP: ${ip}`);
    next();
  });
}

// =============================================
// CONFIGURACIÓN CORS
// =============================================
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : [
      'http://localhost:3000',      // React
      'http://127.0.0.1:3000',      // Live Server
      'http://localhost:8080',      // Webpack
      'http://localhost:5173',      // Vite
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// =============================================
// MIDDLEWARE DE PARSEO
// =============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// =============================================
// CONECTAR A MONGODB ATLAS
// =============================================
connectDB();

// =============================================
// RUTAS DE LA API
// =============================================

// Ruta raíz - Información general
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🐾 Adoptapet API funcionando correctamente',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: '/api/v1/auth',
      pets: '/api/v1/pets',
      shelters: '/api/v1/shelters'
    }
  });
});

// Ruta de salud básica
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Adoptapet Backend está funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Ruta de health detallado
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStates = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting'
  };

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    service: 'Adoptapet API',
    version: process.env.APP_VERSION || '1.0.0',
    database: {
      status: dbStates[mongoose.connection.readyState],
      name: mongoose.connection.nombre || 'No conectado'
    },
    uptime: `${Math.floor(process.uptime())} segundos`
  });
});

// Rutas principales
const authRoutes = require('../src/routes/authRoutes');
const userRoutes = require('../src/routes/userRoutes');  
const petRoutes = require('../src/routes/petRoutes');
const shelterRoutes = require('../src/routes/shelterRoutes');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/pets', petRoutes);
app.use('/api/v1/shelters', shelterRoutes);

// TODO: Agregar más rutas aquí
// app.use('/api/v1/adoptions', adoptionRoutes);
// app.use('/api/v1/posts', postRoutes);
// app.use('/api/v1/comments', commentRoutes);

// =============================================
// MANEJO DE RUTAS NO ENCONTRADAS
// =============================================
app.use((req, res, next) => {
  next(new AppError(`No se puede encontrar ${req.originalUrl} en este servidor`, 404));
});

// =============================================
// MIDDLEWARE GLOBAL DE MANEJO DE ERRORES
// =============================================
app.use(globalErrorHandler);

module.exports = app;

