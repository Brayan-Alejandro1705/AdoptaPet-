const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear carpeta uploads si no existe
const uploadsDir = path.join(__dirname, '../../uploads/posts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Carpeta uploads/posts creada');
}

// Configuración de multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes'));
  }
});

// Middleware de autenticación mejorado
const auth = async (req, res, next) => {
  try {
    console.log('🔐 ===== VERIFICANDO AUTENTICACIÓN =====');
    console.log('📍 Ruta:', req.method, req.path);
    
    const authHeader = req.headers.authorization;
    console.log('📋 Authorization header:', authHeader ? '✅ Presente' : '❌ Ausente');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ Token no proporcionado o formato incorrecto');
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token no proporcionado'
      });
    }

    const token = authHeader.split(' ')[1];
    console.log('🔑 Token extraído:', token.substring(0, 20) + '...');

    const jwt = require('jsonwebtoken');
    const User = require('../models/User');
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025');
      console.log('✅ Token verificado. User ID:', decoded.id);
    } catch (jwtError) {
      console.error('❌ Error verificando token:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Buscar usuario en BD
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('❌ Usuario no encontrado en BD');
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('✅ Usuario autenticado:', {
      id: user._id,
      nombre: user.nombre || user.name,
      email: user.email
    });

    req.userId = decoded.id;
    req.user = user;
    console.log('🎉 Autenticación exitosa\n');
    next();
  } catch (error) {
    console.error('❌ Error en auth middleware:', error);
    return res.status(401).json({
      success: false,
      message: 'Error de autenticación',
      error: error.message
    });
  }
};

// Importar modelo
const Post = require('../models/Post');

// ============================================
// RUTAS DE POSTS
// ============================================

// ⭐ RUTA ESPECIAL: MIS PUBLICACIONES (DEBE IR PRIMERO)
router.get('/user/my-posts', auth, async (req, res) => {
  try {
    console.log('📝 Obteniendo MIS publicaciones...');
    console.log('👤 UserId:', req.userId);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      author: req.userId,
      status: 'active'
    })
      .populate('author', 'nombre email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments({ 
      author: req.userId,
      status: 'active'
    });

    console.log(`✅ Posts encontrados: ${posts.length}`);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo mis posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus publicaciones',
      error: error.message
    });
  }
});

// ⭐ NUEVO: OBTENER TODAS LAS PUBLICACIONES (FEED PRINCIPAL)
router.get('/', auth, async (req, res) => {
  try {
    console.log('📰 Obteniendo todas las publicaciones...');
    
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ status: 'active' })
      .populate('author', 'nombre email avatar role')
      .populate('comments.user', 'nombre email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments({ status: 'active' });

    console.log(`✅ Posts encontrados: ${posts.length}`);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener publicaciones',
      error: error.message
    });
  }
});

// 1. CREAR PUBLICACIÓN (CORREGIDO PARA TU MODELO)
router.post('/', auth, upload.single('imagen'), async (req, res) => {
  try {
    console.log('📝 ===== CREANDO NUEVA PUBLICACIÓN =====');
    console.log('📦 Body:', req.body);
    console.log('📸 Archivo:', req.file ? req.file.filename : 'Sin imagen');
    console.log('👤 UserId:', req.userId);

    const { contenido, tipo, petInfo, disponibleAdopcion } = req.body;

    // Validación básica
    if (!contenido && !req.file) {
      console.log('❌ Validación fallida: Sin contenido ni imagen');
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar contenido o una imagen'
      });
    }

    // Crear objeto de publicación según TU modelo
    const postData = {
      author: req.userId,
      content: contenido || '',
      type: tipo || 'update',
      status: 'active',
      media: {
        images: [],
        videos: []
      },
      comments: [],
      stats: {
        likes: [],
        commentsCount: 0,
        shares: 0,
        views: 0
      },
      settings: {
        visibility: 'public',
        allowComments: true,
        allowSharing: true
      }
    };

    // Si hay imagen, agregarla al array de images
    if (req.file) {
      postData.media.images.push(`/uploads/posts/${req.file.filename}`);
      console.log('✅ Imagen agregada:', postData.media.images[0]);
    }

    // Si hay info de mascota, parsearla
    if (petInfo) {
      try {
        const parsedPetInfo = typeof petInfo === 'string' ? JSON.parse(petInfo) : petInfo;
        console.log('🐾 Info de mascota:', parsedPetInfo);
      } catch (e) {
        console.error('❌ Error parsing petInfo:', e);
      }
    }

    console.log('💾 Datos del post a guardar:', JSON.stringify(postData, null, 2));

    // Crear el post
    const newPost = new Post(postData);
    await newPost.save();

    // Poblar información del autor
    await newPost.populate('author', 'nombre email avatar role');

    console.log('✅ Post creado exitosamente:', newPost._id);

    res.status(201).json({
      success: true,
      message: 'Publicación creada exitosamente',
      data: { post: newPost }
    });

  } catch (error) {
    console.error('❌ ERROR CREANDO POST:', error);
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error al crear la publicación',
      error: error.message
    });
  }
});

// 2. OBTENER FEED DE PUBLICACIONES
router.get('/feed', auth, async (req, res) => {
  try {
    console.log('📰 Obteniendo feed...');
    
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ status: 'active' })
      .populate('author', 'nombre email avatar role')
      .populate('comments.user', 'nombre email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments({ status: 'active' });

    console.log(`✅ Posts en feed: ${posts.length}`);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo feed:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener publicaciones'
    });
  }
});

// 3. OBTENER POSTS DE UN USUARIO
router.get('/user/:userId', auth, async (req, res) => {
  try {
    console.log('📋 Obteniendo posts del usuario:', req.params.userId);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ 
      author: req.params.userId,
      status: 'active'
    })
      .populate('author', 'nombre email avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments({ 
      author: req.params.userId,
      status: 'active'
    });

    console.log(`✅ Posts encontrados: ${posts.length}`);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo posts del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener publicaciones del usuario',
      error: error.message
    });
  }
});

// 4. OBTENER PUBLICACIÓN POR ID
router.get('/:postId', auth, async (req, res) => {
  try {
    console.log('📄 Obteniendo post:', req.params.postId);
    
    const post = await Post.findById(req.params.postId)
      .populate('author', 'nombre email avatar role')
      .populate('comments.user', 'nombre email avatar')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    console.log('✅ Post encontrado');

    res.json({
      success: true,
      data: { post }
    });
  } catch (error) {
    console.error('❌ Error obteniendo post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la publicación'
    });
  }
});

// 5. DAR/QUITAR LIKE
router.post('/:postId/like', auth, async (req, res) => {
  try {
    console.log('❤️ Like en post:', req.params.postId);
    
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar si ya dio like
    const likeIndex = post.stats.likes.findIndex(
      like => like.toString() === req.userId.toString()
    );
    
    let liked = false;
    
    if (likeIndex > -1) {
      // Remover like
      post.stats.likes.splice(likeIndex, 1);
      liked = false;
      console.log('💔 Like removido');
    } else {
      // Agregar like
      post.stats.likes.push(req.userId);
      liked = true;
      console.log('❤️ Like agregado');
    }

    await post.save();

    res.json({
      success: true,
      message: liked ? 'Like agregado' : 'Like removido',
      data: { 
        liked,
        likesCount: post.stats.likes.length
      }
    });
  } catch (error) {
    console.error('❌ Error con like:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar like'
    });
  }
});

// 5b. QUITAR LIKE (DELETE)
router.delete('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Remover like
    post.stats.likes = post.stats.likes.filter(
      like => like.toString() !== req.userId.toString()
    );

    await post.save();

    res.json({
      success: true,
      message: 'Like removido',
      data: { 
        unliked: true,
        likesCount: post.stats.likes.length
      }
    });
  } catch (error) {
    console.error('❌ Error quitando like:', error);
    res.status(500).json({
      success: false,
      message: 'Error al quitar like'
    });
  }
});

// ===== 6. AGREGAR COMENTARIO =====
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    console.log('💬 Agregando comentario al post:', req.params.postId);
    console.log('👤 Usuario:', req.userId);
    console.log('📦 Body:', req.body);

    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El comentario no puede estar vacío'
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar que el post permita comentarios
    if (post.settings?.allowComments === false) {
      return res.status(403).json({
        success: false,
        message: 'Los comentarios están deshabilitados en esta publicación'
      });
    }

    // Crear objeto de comentario
    const newComment = {
      user: req.userId,
      content: content.trim(),
      createdAt: new Date()
    };

    // Si el modelo tiene comments como array, agregar directamente
    // Si no existe el array, crearlo
    if (!post.comments) {
      post.comments = [];
    }

    post.comments.push(newComment);

    // Actualizar contador de comentarios en stats
    if (post.stats) {
      post.stats.commentsCount = post.comments.length;
    }

    await post.save();

    // Poblar info del usuario del comentario nuevo
    // El comentario nuevo es el último del array
    const savedPost = await Post.findById(req.params.postId)
      .populate('comments.user', 'nombre email avatar');

    const savedComment = savedPost.comments[savedPost.comments.length - 1];

    console.log('✅ Comentario agregado exitosamente');

    res.status(201).json({
      success: true,
      message: 'Comentario agregado exitosamente',
      data: {
        comment: savedComment,
        commentsCount: savedPost.comments.length
      }
    });
  } catch (error) {
    console.error('❌ Error agregando comentario:', error);
    console.error('   Mensaje:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al agregar comentario',
      error: error.message
    });
  }
});

// ===== 6b. OBTENER COMENTARIOS DE UN POST =====
router.get('/:postId/comments', auth, async (req, res) => {
  try {
    console.log('💬 Obteniendo comentarios del post:', req.params.postId);

    const post = await Post.findById(req.params.postId)
      .populate('comments.user', 'nombre email avatar')
      .lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    console.log(`✅ Comentarios encontrados: ${post.comments?.length || 0}`);

    res.json({
      success: true,
      data: {
        comments: post.comments || [],
        commentsCount: post.comments?.length || 0
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo comentarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios'
    });
  }
});

// ===== 6c. ELIMINAR COMENTARIO =====
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    console.log('🗑️ Eliminando comentario:', req.params.commentId, 'del post:', req.params.postId);

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Buscar el comentario
    const commentIndex = post.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    // Solo el autor del comentario o el autor del post puede eliminarlo
    const isCommentAuthor = post.comments[commentIndex].user.toString() === req.userId.toString();
    const isPostAuthor = post.author.toString() === req.userId.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este comentario'
      });
    }

    post.comments.splice(commentIndex, 1);

    if (post.stats) {
      post.stats.commentsCount = post.comments.length;
    }

    await post.save();

    console.log('✅ Comentario eliminado');

    res.json({
      success: true,
      message: 'Comentario eliminado exitosamente',
      data: {
        commentsCount: post.comments.length
      }
    });
  } catch (error) {
    console.error('❌ Error eliminando comentario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar comentario'
    });
  }
});

// 7. ELIMINAR PUBLICACIÓN
router.delete('/:postId', auth, async (req, res) => {
  try {
    console.log('🗑️ Eliminando post:', req.params.postId);
    
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar que el usuario sea el autor
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta publicación'
      });
    }

    // Cambiar estado a deleted
    post.status = 'deleted';
    await post.save();

    console.log('✅ Post eliminado');

    res.json({
      success: true,
      message: 'Publicación eliminada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error eliminando post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la publicación'
    });
  }
});

// 8. EDITAR POST
router.put('/:postId', auth, async (req, res) => {
  try {
    console.log('✏️ Editando post:', req.params.postId);
    
    const { contenido, content } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Verificar que el usuario sea el autor
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar esta publicación'
      });
    }

    const newContent = contenido || content;

    if (!newContent || !newContent.trim()) {
      return res.status(400).json({
        success: false,
        message: 'El contenido no puede estar vacío'
      });
    }

    post.content = newContent;
    await post.save();

    await post.populate('author', 'nombre email avatar role');

    console.log('✅ Post editado');

    res.json({
      success: true,
      message: 'Publicación editada exitosamente',
      data: { post }
    });
  } catch (error) {
    console.error('❌ Error editando post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al editar la publicación'
    });
  }
});

console.log('✅ Rutas de posts configuradas correctamente');
console.log('   📝 POST   /api/posts - Crear publicación');
console.log('   📰 GET    /api/posts - TODAS las publicaciones');
console.log('   📰 GET    /api/posts/feed - Feed de publicaciones');
console.log('   👤 GET    /api/posts/user/my-posts - Mis publicaciones');
console.log('   👥 GET    /api/posts/user/:userId - Posts de usuario');
console.log('   📄 GET    /api/posts/:postId - Ver publicación');
console.log('   ❤️  POST   /api/posts/:postId/like - Dar like');
console.log('   💔 DELETE /api/posts/:postId/like - Quitar like');
console.log('   💬 POST   /api/posts/:postId/comments - Agregar comentario');
console.log('   💬 GET    /api/posts/:postId/comments - Ver comentarios');
console.log('   💬 DELETE /api/posts/:postId/comments/:commentId - Borrar comentario');
console.log('   🗑️  DELETE /api/posts/:postId - Eliminar');
console.log('   ✏️  PUT    /api/posts/:postId - Editar');

module.exports = router;