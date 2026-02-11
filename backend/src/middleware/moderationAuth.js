// =============================================
// MIDDLEWARE DE MODERACIÓN - ADOPTAPET
// =============================================

const User = require('../models/User');

console.log('🛡️ Cargando middleware de moderación...');

// =============================================
// VERIFICAR SI ES ADMINISTRADOR
// =============================================

exports.isAdmin = async (req, res, next) => {
  try {
    console.log('🔐 ===== VERIFICANDO PERMISOS DE ADMIN =====');
    
    if (!req.user) {
      console.log('❌ No hay usuario autenticado');
      return res.status(401).json({
        success: false,
        message: 'No autenticado. Por favor inicia sesión.'
      });
    }

    console.log('👤 Usuario:', req.user.email);
    console.log('🎭 Rol actual:', req.user.role);

    // Verificar si el rol es admin o superadmin
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      console.log('❌ Acceso denegado. Se requiere rol de administrador.');
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }

    console.log('✅ Permisos de administrador verificados');
    next();
  } catch (error) {
    console.error('❌ Error verificando permisos de admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar permisos'
    });
  }
};

// =============================================
// VERIFICAR SI ES SUPERADMINISTRADOR
// =============================================

exports.isSuperAdmin = async (req, res, next) => {
  try {
    console.log('🔐 ===== VERIFICANDO PERMISOS DE SUPERADMIN =====');
    
    if (!req.user) {
      console.log('❌ No hay usuario autenticado');
      return res.status(401).json({
        success: false,
        message: 'No autenticado. Por favor inicia sesión.'
      });
    }

    console.log('👤 Usuario:', req.user.email);
    console.log('🎭 Rol actual:', req.user.role);

    // Solo superadmin puede acceder
    if (req.user.role !== 'superadmin') {
      console.log('❌ Acceso denegado. Se requiere rol de superadministrador.');
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de superadministrador.'
      });
    }

    console.log('✅ Permisos de superadministrador verificados');
    next();
  } catch (error) {
    console.error('❌ Error verificando permisos de superadmin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar permisos'
    });
  }
};

// =============================================
// VERIFICAR SI PUEDE MODERAR CONTENIDO
// =============================================

exports.canModerate = async (req, res, next) => {
  try {
    console.log('🔐 ===== VERIFICANDO PERMISOS DE MODERACIÓN =====');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    // Admin y superadmin pueden moderar
    const canModerate = ['admin', 'superadmin'].includes(req.user.role);

    if (!canModerate) {
      console.log('❌ Usuario sin permisos de moderación');
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para moderar contenido'
      });
    }

    console.log('✅ Permisos de moderación verificados');
    req.isModerator = true;
    next();
  } catch (error) {
    console.error('❌ Error verificando permisos de moderación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar permisos'
    });
  }
};

console.log('✅ Middleware de moderación cargado');
console.log('   🛡️ isAdmin - Verificar admin o superadmin');
console.log('   👑 isSuperAdmin - Verificar solo superadmin');
console.log('   🔧 canModerate - Verificar permisos de moderación');