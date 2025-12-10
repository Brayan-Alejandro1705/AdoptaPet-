// backend/src/scripts/activateAllUsers.js

require('dotenv').config({ path: '../.env' }); // Cargar variables de entorno
const mongoose = require('mongoose');
const User = require('../models/User');

// Usar la misma URI que el backend (de las variables de entorno)
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: No se encontró MONGODB_URI en las variables de entorno');
  console.log('💡 Asegúrate de tener un archivo .env con la variable MONGODB_URI o MONGO_URI');
  process.exit(1);
}

async function activateAllUsers() {
  try {
    console.log('🔌 Conectando a MongoDB Atlas...');
    
    // Ocultar la contraseña en el log
    const safeUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//*****:*****@');
    console.log('📍 URI:', safeUri);
    
    await mongoose.connect(MONGODB_URI);
    
    console.log('✅ Conectado a MongoDB Atlas exitosamente');
    console.log('🗃️  Base de datos:', mongoose.connection.name);
    console.log('');
    
    console.log('🔄 Activando todas las cuentas de usuario...');
    
    const result = await User.updateMany(
      {},
      { 
        $set: { 
          status: 'active',
          'verified.email': true
        } 
      }
    );
    
    console.log('');
    console.log('📊 RESULTADOS:');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Usuarios encontrados: ${result.matchedCount}`);
    console.log(`🔄 Usuarios actualizados: ${result.modifiedCount}`);
    
    const activeUsers = await User.countDocuments({ status: 'active' });
    const totalUsers = await User.countDocuments();
    
    console.log('');
    console.log('📈 ESTADO ACTUAL:');
    console.log('═══════════════════════════════════════');
    console.log(`👥 Total de usuarios: ${totalUsers}`);
    console.log(`✅ Usuarios activos: ${activeUsers}`);
    console.log(`❌ Usuarios inactivos: ${totalUsers - activeUsers}`);
    
    if (totalUsers > 0) {
      // Mostrar algunos usuarios
      const users = await User.find()
        .select('name email status verified.email role')
        .limit(10);
      
      console.log('');
      console.log('👤 USUARIOS ACTIVADOS (muestra):');
      console.log('═══════════════════════════════════════');
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   📧 Status: ${user.status}`);
        console.log(`   ✅ Email verificado: ${user.verified.email ? 'Sí' : 'No'}`);
        console.log(`   🎭 Rol: ${user.role}`);
        console.log('');
      });
    } else {
      console.log('');
      console.log('⚠️  No se encontraron usuarios en la base de datos');
      console.log('💡 Asegúrate de que:');
      console.log('   1. Estás conectado a la base de datos correcta');
      console.log('   2. Ya has registrado usuarios en la aplicación');
    }
    
    console.log('🎉 ¡Proceso completado exitosamente!');
    
  } catch (error) {
    console.error('');
    console.error('❌ ERROR:');
    console.error('═══════════════════════════════════════');
    console.error(error.message);
    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
  } finally {
    console.log('');
    console.log('🔌 Cerrando conexión a MongoDB...');
    await mongoose.connection.close();
    console.log('✅ Conexión cerrada');
    console.log('');
    process.exit(0);
  }
}

console.log('');
console.log('🚀 SCRIPT: ACTIVAR TODAS LAS CUENTAS DE USUARIO');
console.log('═══════════════════════════════════════════════');
console.log('');

activateAllUsers();
