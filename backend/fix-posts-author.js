require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('./src/models/Post');
const User = require('./src/models/User');

async function fixPosts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar el primer usuario
    const user = await User.findOne();
    
    if (!user) {
      console.log('❌ No hay usuarios en la BD');
      return;
    }

    console.log(`👤 Usuario encontrado: ${user.nombre || user.name}`);

    // Actualizar todos los posts sin autor
    const result = await Post.updateMany(
      { $or: [{ author: null }, { author: { $exists: false } }] },
      { $set: { author: user._id } }
    );

    console.log(`✅ ${result.modifiedCount} posts actualizados con el autor`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixPosts();