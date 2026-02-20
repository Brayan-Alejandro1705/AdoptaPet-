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
    const UserModel = require('../models/User');
    
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
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      console.log('❌ Usuario no encontrado en BD');
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('✅ Usuario autenticado:', {
      id: user._id,
      nombre: user.name,
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

// Importar modelos
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const User = require('../models/User');

// ============================================
// ✅ HELPER: MAPEAR PRIVACIDAD (MODAL) -> VISIBILITY (POST)
// ============================================
// Modal:  publico | amigos | privado
// Post:   public  | friends | private
const mapPrivacidadToVisibility = (priv) => {
  if (priv === 'amigos') return 'friends';
  if (priv === 'privado') return 'private';
  return 'public';
};

// ============================================
// ✅ HELPER: FILTRO DE PRIVACIDAD PARA FEED
// ============================================
const buildVisibilityFilter = (req) => {
  const viewerId = req.userId;
  const friendsIds = req.user?.friends || [];

  return {
    status: 'active',
    $or: [
      { "settings.visibility": "public" },
      { "settings.visibility": { $exists: false } }, // posts antiguos
      { author: viewerId },                          // siempre ves los tuyos
      {
        $and: [
          { "settings.visibility": "friends" },
          { author: { $in: friendsIds } }
        ]
      }
      // private: solo lo ve el autor (ya cubierto por {author: viewerId})
    ]
  };
};

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
      .populate('author', 'name nombre email avatar role verified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments({ 
      author: req.userId,
      status: 'active'
    });

    console.log(`✅ Posts encontrados: ${posts.length}`);
    if (posts.length > 0) {
      console.log('👤 Primer post author:', posts[0].author);
    }

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

// ⭐ NUEVO: OBTENER TODAS LAS PUBLICACIONES (FEED PRINCIPAL) ✅ (CON PRIVACIDAD)
router.get('/', auth, async (req, res) => {
  try {
    console.log('📰 Obteniendo todas las publicaciones...');
    
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = buildVisibilityFilter(req);

    const posts = await Post.find(filter)
      .populate('author', 'name nombre email avatar role verified')
      .populate('comments.user', 'name nombre email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments(filter);

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

// 1. CREAR PUBLICACIÓN (✅ APLICA postSettings DEL USUARIO)
router.post('/', auth, upload.single('imagen'), async (req, res) => {
  try {
    console.log('📝 ===== CREANDO NUEVA PUBLICACIÓN =====');
    console.log('📦 Body:', req.body);
    console.log('📸 Archivo:', req.file ? req.file.filename : 'Sin imagen');
    console.log('👤 UserId:', req.userId);

    const { contenido, tipo, petInfo, disponibleAdopcion } = req.body;

    if (!contenido && !req.file) {
      console.log('❌ Validación fallida: Sin contenido ni imagen');
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar contenido o una imagen'
      });
    }

    // ✅ Defaults desde el usuario (del modal)
    const userPostSettings = req.user?.postSettings || {};
    const defaultVisibility = mapPrivacidadToVisibility(userPostSettings.privacidadPorDefecto);

    const allowCommentsDefault =
      typeof userPostSettings.permitirComentarios === 'boolean'
        ? userPostSettings.permitirComentarios
        : true;

    const allowSharingDefault =
      typeof userPostSettings.permitirCompartir === 'boolean'
        ? userPostSettings.permitirCompartir
        : true;

    // (Opcional) Si algún día mandas visibility desde el front, lo respetas aquí:
    const visibilityFromBody = req.body.visibility; // 'public' | 'friends' | 'private'
    const allowedVisibilities = ['public', 'friends', 'private'];
    const finalVisibility = allowedVisibilities.includes(visibilityFromBody)
      ? visibilityFromBody
      : defaultVisibility;

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
        visibility: finalVisibility,
        allowComments: allowCommentsDefault,
        allowSharing: allowSharingDefault
      }
    };

    // Si tu app usa petInfo / disponibleAdopcion, puedes guardarlos aquí (solo si tu modelo Post lo soporta)
    // if (petInfo) postData.petInfo = petInfo;
    // if (typeof disponibleAdopcion !== 'undefined') postData.disponibleAdopcion = disponibleAdopcion;

    if (req.file) {
      postData.media.images.push(`/uploads/posts/${req.file.filename}`);
      console.log('✅ Imagen agregada:', postData.media.images[0]);
    }

    console.log('💾 Datos del post a guardar:', JSON.stringify(postData, null, 2));

    const newPost = new Post(postData);
    await newPost.save();
    await newPost.populate('author', 'name nombre email avatar role verified');

    console.log('✅ Post creado exitosamente:', newPost._id);

    res.status(201).json({
      success: true,
      message: 'Publicación creada exitosamente',
      data: { post: newPost }
    });

  } catch (error) {
    console.error('❌ ERROR CREANDO POST:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la publicación',
      error: error.message
    });
  }
});

// 2. OBTENER FEED DE PUBLICACIONES ✅ (CON PRIVACIDAD)
router.get('/feed', auth, async (req, res) => {
  try {
    console.log('📰 Obteniendo feed...');
    
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = buildVisibilityFilter(req);

    const posts = await Post.find(filter)
      .populate('author', 'name nombre email avatar role verified')
      .populate('comments.user', 'name nombre email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments(filter);

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

// 3. OBTENER POSTS DE UN USUARIO (NO FILTRA PRIVACIDAD AQUÍ; si quieres lo ajustamos también)
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
      .populate('author', 'name nombre email avatar role verified')
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

// 5. DAR/QUITAR LIKE (✅ CON NOTIFICACIONES CORREGIDAS)
router.post('/:postId/like', auth, async (req, res) => {
  try {
    console.log('❤️ ===== PROCESANDO LIKE =====');
    console.log('📝 Post ID:', req.params.postId);
    console.log('👤 Usuario:', req.userId);
    
    const post = await Post.findById(req.params.postId);

    if (!post) {
      console.log('❌ Post no encontrado');
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    console.log('📊 Post autor:', post.author.toString());
    console.log('📊 Likes actuales:', post.stats.likes.length);

    const likeIndex = post.stats.likes.findIndex(
      like => like.toString() === req.userId.toString()
    );
    
    let liked = false;
    
    if (likeIndex > -1) {
      // QUITAR LIKE
      post.stats.likes.splice(likeIndex, 1);
      liked = false;
      console.log('💔 Like removido');
    } else {
      // AGREGAR LIKE
      post.stats.likes.push(req.userId);
      liked = true;
      console.log('❤️ Like agregado');

      // ✅ CREAR NOTIFICACIÓN (solo si no eres tú mismo)
      console.log('🔍 Verificando si crear notificación...');
      console.log('   Post autor:', post.author.toString());
      console.log('   Usuario actual:', req.userId.toString());
      console.log('   ¿Son diferentes?', post.author.toString() !== req.userId.toString());
      
      if (post.author.toString() !== req.userId.toString()) {
        try {
          const liker = await User.findById(req.userId);
          console.log('👤 Usuario que da like:', liker ? liker.name || liker.nombre : 'NO ENCONTRADO');
          
          const notificationData = {
            recipient: post.author,
            sender: req.userId,
            type: 'like',
            title: 'Le gustó tu publicación',
            message: `A ${liker.name || liker.nombre} le gustó tu publicación`,
            icon: '❤️',
            color: 'pink',
            relatedId: post._id,
            relatedModel: 'Post',
            actionUrl: `/post/${post._id}`
          };
          
          console.log('📝 Datos de notificación:', JSON.stringify(notificationData, null, 2));
          
          const notification = await Notification.create(notificationData);
          console.log('🔔 ✅ Notificación creada con ID:', notification._id);
          
          const verificar = await Notification.findById(notification._id);
          console.log('✅ Verificación en BD:', verificar ? 'GUARDADA' : 'ERROR AL GUARDAR');

          const io = req.app.get('io');
          if (io) {
            io.to(post.author.toString()).emit('nueva-notificacion', {
              ...notification.toObject(),
              sender: {
                _id: liker._id,
                name: liker.name || liker.nombre,
                avatar: liker.avatar
              }
            });
            console.log('📡 Notificación emitida por Socket.io');
          } else {
            console.log('⚠️ Socket.io no disponible');
          }
        } catch (notifError) {
          console.error('⚠️ Error creando notificación:', notifError);
          console.error('   Mensaje:', notifError.message);
          console.error('   Stack:', notifError.stack);
        }
      } else {
        console.log('ℹ️ Es tu propio post, no se crea notificación');
      }
    }

    await post.save();
    console.log('💾 Post guardado con', post.stats.likes.length, 'likes');

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

// 6. AGREGAR COMENTARIO (✅ CON NOTIFICACIONES CORREGIDAS)
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    console.log('💬 ===== AGREGANDO COMENTARIO =====');
    console.log('📝 Post ID:', req.params.postId);
    console.log('👤 Usuario:', req.userId);

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

    if (post.settings?.allowComments === false) {
      return res.status(403).json({
        success: false,
        message: 'Los comentarios están deshabilitados en esta publicación'
      });
    }

    const newComment = {
      user: req.userId,
      content: content.trim(),
      createdAt: new Date()
    };

    if (!post.comments) post.comments = [];
    post.comments.push(newComment);

    if (post.stats) {
      post.stats.commentsCount = post.comments.length;
    }

    await post.save();

    // ✅ CREAR NOTIFICACIÓN (solo si no eres tú mismo)
    console.log('🔍 Verificando si crear notificación...');
    
    if (post.author.toString() !== req.userId.toString()) {
      try {
        const commenter = await User.findById(req.userId);
        console.log('👤 Comentarista:', commenter ? commenter.name || commenter.nombre : 'NO ENCONTRADO');
        
        const notificationData = {
          recipient: post.author,
          sender: req.userId,
          type: 'comment',
          title: 'Nuevo comentario',
          message: `${commenter.name || commenter.nombre} comentó: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          icon: '💬',
          color: 'blue',
          relatedId: post._id,
          relatedModel: 'Post',
          actionUrl: `/post/${post._id}`
        };

        console.log('📝 Datos de notificación:', JSON.stringify(notificationData, null, 2));

        const notification = await Notification.create(notificationData);
        console.log('🔔 ✅ Notificación creada con ID:', notification._id);

        const io = req.app.get('io');
        if (io) {
          io.to(post.author.toString()).emit('nueva-notificacion', {
            ...notification.toObject(),
            sender: {
              _id: commenter._id,
              name: commenter.name || commenter.nombre,
              avatar: commenter.avatar
            }
          });
          console.log('📡 Notificación emitida por Socket.io');
        } else {
          console.log('⚠️ Socket.io no disponible');
        }
      } catch (notifError) {
        console.error('⚠️ Error creando notificación:', notifError);
        console.error('   Mensaje:', notifError.message);
      }
    } else {
      console.log('ℹ️ Es tu propio post, no se crea notificación');
    }

    const savedPost = await Post.findById(req.params.postId)
      .populate('comments.user', 'name nombre email avatar');

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
    res.status(500).json({
      success: false,
      message: 'Error al agregar comentario',
      error: error.message
    });
  }
});

// 6b. OBTENER COMENTARIOS DE UN POST
router.get('/:postId/comments', auth, async (req, res) => {
  try {
    console.log('💬 Obteniendo comentarios del post:', req.params.postId);

    const post = await Post.findById(req.params.postId)
      .populate('comments.user', 'name nombre email avatar')
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

// 6c. ELIMINAR COMENTARIO
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    console.log('🗑️ Eliminando comentario:', req.params.commentId);

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    const commentIndex = post.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

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

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar esta publicación'
      });
    }

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
    post.isEdited = true;
    await post.save();

    await post.populate('author', 'name nombre email avatar role verified');

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

// ============================================
// IMPORTAR MIDDLEWARE DE MODERACIÓN
// ============================================
const { isAdmin, isSuperAdmin } = require('../middleware/moderationAuth');

// ============================================
// RUTAS DE MODERACIÓN (SOLO ADMIN/SUPERADMIN)
// ⚠️ IMPORTANTE: VAN ANTES DE '/:postId'
// ============================================

// 1. OBTENER TODAS LAS PUBLICACIONES (INCLUYENDO ELIMINADAS) - SOLO ADMIN
router.get('/admin/all', auth, isAdmin, async (req, res) => {
  try {
    console.log('📋 ===== OBTENIENDO TODAS LAS PUBLICACIONES (ADMIN) =====');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';

    let query = {};
    if (filter === 'active') query.status = 'active';
    else if (filter === 'deleted') query.status = 'deleted';
    else if (filter === 'moderated') query.moderatedBy = { $exists: true, $ne: null };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name nombre email avatar role verified')
      .populate('moderatedBy', 'name nombre email role')
      .lean();

    const totalPosts = await Post.countDocuments(query);
    const activeCount = await Post.countDocuments({ status: 'active' });
    const deletedCount = await Post.countDocuments({ status: 'deleted' });
    const moderatedCount = await Post.countDocuments({ 
      moderatedBy: { $exists: true, $ne: null } 
    });

    res.json({
      success: true,
      data: {
        posts,
        stats: {
          total: totalPosts,
          active: activeCount,
          deleted: deletedCount,
          moderated: moderatedCount
        },
        pagination: {
          page,
          limit,
          total: totalPosts,
          pages: Math.ceil(totalPosts / limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo publicaciones (admin):', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener publicaciones'
    });
  }
});

// 2. MODERAR PUBLICACIÓN - SOLO ADMIN
router.post('/admin/:postId/moderate', auth, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    post.status = 'deleted';
    post.moderatedBy = req.userId;
    post.moderatedAt = new Date();
    post.moderationReason = reason || 'Eliminado por moderación';
    await post.save();

    res.json({
      success: true,
      message: 'Publicación moderada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error moderando:', error);
    res.status(500).json({
      success: false,
      message: 'Error al moderar publicación'
    });
  }
});

// 3. RESTAURAR PUBLICACIÓN - SOLO ADMIN
router.post('/admin/:postId/restore', auth, isAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    post.status = 'active';
    post.restoredBy = req.userId;
    post.restoredAt = new Date();
    await post.save();

    res.json({
      success: true,
      message: 'Publicación restaurada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error restaurando:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restaurar publicación'
    });
  }
});

// 4. ELIMINAR PERMANENTEMENTE - SOLO SUPERADMIN
router.delete('/admin/:postId/permanent', auth, isSuperAdmin, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.postId);
    res.json({
      success: true,
      message: 'Publicación eliminada permanentemente'
    });
  } catch (error) {
    console.error('❌ Error eliminando permanentemente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar publicación'
    });
  }
});

// 4. OBTENER PUBLICACIÓN POR ID (DEBE IR DESPUÉS DE /admin/*)
router.get('/:postId', auth, async (req, res) => {
  try {
    console.log('📄 Obteniendo post:', req.params.postId);
    
    const post = await Post.findById(req.params.postId)
      .populate('author', 'name nombre email avatar role verified')
      .populate('comments.user', 'name nombre email avatar')
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

console.log('✅ Rutas de posts configuradas con notificaciones automáticas');
console.log('   📝 POST   /api/posts - Crear publicación');
console.log('   📰 GET    /api/posts - TODAS las publicaciones (con privacidad)');
console.log('   📰 GET    /api/posts/feed - Feed de publicaciones (con privacidad)');
console.log('   👤 GET    /api/posts/user/my-posts - Mis publicaciones');
console.log('   👥 GET    /api/posts/user/:userId - Posts de usuario');
console.log('   📄 GET    /api/posts/:postId - Ver publicación');
console.log('   ❤️  POST   /api/posts/:postId/like - Dar like (type: "like")');
console.log('   💔 DELETE /api/posts/:postId/like - Quitar like');
console.log('   💬 POST   /api/posts/:postId/comments - Agregar comentario (type: "comment")');
console.log('   💬 GET    /api/posts/:postId/comments - Ver comentarios');
console.log('   💬 DELETE /api/posts/:postId/comments/:commentId - Borrar comentario');
console.log('   🗑️  DELETE /api/posts/:postId - Eliminar');
console.log('   ✏️  PUT    /api/posts/:postId - Editar');
console.log('✅ Rutas de moderación configuradas');

module.exports = router;
