// =============================================
// SCRIPT PARA CREAR SUPERADMINISTRADOR - ADOPTAPET
// =============================================

require('dotenv').config();
const mongoose = require('mongoose');

console.log('👑 ===== CREANDO SUPERADMINISTRADOR =====\n');

const createSuperAdmin = async () => {
  try {
    // Conectar a MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI no está configurado en .env');
      process.exit(1);
    }

    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Conectado a MongoDB\n');

    // Importar modelo de usuario
    const User = require('../src/models/User');

    // Verificar si ya existe un superadmin
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });

    if (existingSuperAdmin) {
      console.log('⚠️  Ya existe un superadministrador en el sistema');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', existingSuperAdmin.email);
      console.log('👤 Nombre:', existingSuperAdmin.name);
      console.log('🎭 Rol:', existingSuperAdmin.role);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('Si quieres crear otro, edita el script y cambia el email.');
      process.exit(0);
    }

    // Datos del superadmin
    const email = 'superadmin@adoptapet.com';
    const password = 'SuperAdmin123!';
    const name = 'Super Administrador';

    console.log('📝 Creando superadministrador con datos por defecto:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Contraseña:', password);
    console.log('👤 Nombre:', name);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      console.log('⚠️  Ya existe un usuario con ese email');
      console.log('🔄 Actualizando rol a superadmin...\n');
      
      existingUser.role = 'superadmin';
      await existingUser.save();
      
      console.log('✅ ¡Usuario actualizado a superadmin!\n');
    } else {
      // Crear nuevo superadmin
      const superAdmin = new User({
        name,
        email,
        password,
        role: 'superadmin',
        authProvider: 'local',
        verified: {
          email: true,
          phone: false,
          shelter: false
        },
        status: 'active'
      });

      await superAdmin.save();
      console.log('✅ ¡Superadministrador creado exitosamente!\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUPERADMINISTRADOR CONFIGURADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Contraseña:', password);
    console.log('👑 Rol: superadmin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('📱 Accede al panel de admin en: http://localhost:3000/admin');
    console.log('\n👋 ¡Listo!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error al crear superadministrador:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Ejecutar
createSuperAdmin();