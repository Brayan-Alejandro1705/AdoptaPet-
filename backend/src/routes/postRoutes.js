const express = require('express');
const router = express.Router();

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

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      console.log('❌ Usuario no encontrado en BD');
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    console.log('✅ Usuario autenticado:', { id: user._id, nombre: user.name, email: user.email });

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
      { "settings.visibility": { $exists: false } },
      { author: viewerId },
      {
        $and: [
          { "settings.visibility": "friends" },
          { author: { $in: friendsIds } }
        ]
      }
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

// ⭐ OBTENER TODAS LAS PUBLICACIONES (FEED PRINCIPAL) ✅ (CON PRIVACIDAD)
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

// ✅ CREAR PUBLICACIÓN — SIN multer, acepta JSON con URLs de Cloudinary
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 ===== CREANDO NUEVA PUBLICACIÓN =====');
    console.log('📦 Body recibido:', req.body);
    console.log('👤 UserId:', req.userId);

    const { contenido, tipo, petInfo, disponibleAdopcion } = req.body;

    const imageUrls = Array.isArray(req.body.imagenes) ? req.body.imagenes : [];
    const videoUrl = req.body.videos || null;
    
    console.log('🖼️ URLs de imágenes recibidas:', imageUrls);
    console.log('🎥 URL de video recibida:', videoUrl);

    if (!contenido?.trim() && imageUrls.length === 0 && !videoUrl) {
      console.log('❌ Validación fallida: Sin contenido ni media');
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar contenido o una imagen/video'
      });
    }

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

    const visibilityFromBody = req.body.visibility;
    const allowedVisibilities = ['public', 'friends', 'private'];
    const finalVisibility = allowedVisibilities.includes(visibilityFromBody)
      ? visibilityFromBody
      : defaultVisibility;

    const postData = {
      author: req.userId,
      content: contenido?.trim() || '',
      type: tipo || 'update',
      status: 'active',
      media: { images: [], videos: [] },
      comments: [],
      stats: { likes: [], commentsCount: 0, shares: 0, views: 0 },
      settings: {
        visibility: finalVisibility,
        allowComments: allowCommentsDefault,
        allowSharing: allowSharingDefault
      }
    };

    if (imageUrls.length > 0) {
      // IA Moderación de Contenido Inapropiado
      const { moderateImage } = require('../services/geminiService');
      for (const imgUrl of imageUrls) {
          try {
              console.log(`🔍 Moderando imagen vía Gemini: ${imgUrl}`);
              const modResult = await moderateImage(imgUrl);
              if (modResult.success && !modResult.moderation.isAppropriate) {
                  console.log(`❌ Imagen rechazada: ${modResult.moderation.reason}`);
                  return res.status(400).json({
                      success: false,
                      message: 'No puedes publicar esta imagen. Ha sido bloqueada por la Inteligencia Artificial por la siguiente razón: ' + modResult.moderation.reason
                  });
              }
          } catch (err) {
              console.error('⚠️ Error al moderar la imagen con IA:', err);
          }
      }
      postData.media.images = imageUrls;
      console.log('✅ Imágenes Cloudinary agregadas:', postData.media.images);
    }

    if (videoUrl) {
      postData.media.videos = [videoUrl];
      console.log('✅ Video Cloudinary agregado:', videoUrl);
    }

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
        pagination: { page, limit, total: totalPosts, pages: Math.ceil(totalPosts / limit) }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo feed:', error);
    res.status(500).json({ success: false, message: 'Error al obtener publicaciones' });
  }
});

// 3. OBTENER POSTS DE UN USUARIO
router.get('/user/:userId', auth, async (req, res) => {
  try {
    console.log('📋 Obteniendo posts del usuario:', req.params.userId);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: req.params.userId, status: 'active' })
      .populate('author', 'name nombre email avatar role verified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments({ author: req.params.userId, status: 'active' });

    console.log(`✅ Posts encontrados: ${posts.length}`);

    res.json({
      success: true,
      data: {
        posts,
        pagination: { page, limit, total: totalPosts, pages: Math.ceil(totalPosts / limit) }
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

// 5. DAR/QUITAR LIKE ✅ (CON notificationSettings)
router.post('/:postId/like', auth, async (req, res) => {
  try {
    console.log('❤️ ===== PROCESANDO LIKE =====');
    console.log('📝 Post ID:', req.params.postId);
    console.log('👤 Usuario:', req.userId);

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    }

    const likeIndex = post.stats.likes.findIndex(
      like => like.toString() === req.userId.toString()
    );

    let liked = false;

    if (likeIndex > -1) {
      post.stats.likes.splice(likeIndex, 1);
      liked = false;
      console.log('💔 Like removido');
    } else {
      post.stats.likes.push(req.userId);
      liked = true;
      console.log('❤️ Like agregado');

      if (post.author.toString() !== req.userId.toString()) {
        try {
          const [liker, postAuthor] = await Promise.all([
            User.findById(req.userId),
            User.findById(post.author).select('notificationSettings')
          ]);

          // ✅ VERIFICAR si el autor tiene likes activados
          const likesEnabled = postAuthor?.notificationSettings?.likes !== false;

          if (likesEnabled) {
            const notification = await Notification.create({
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
            });

            const io = req.app.get('io');
            if (io) {
              io.to(post.author.toString()).emit('nueva-notificacion', {
                ...notification.toObject(),
                sender: { _id: liker._id, name: liker.name || liker.nombre, avatar: liker.avatar }
              });
            }
            console.log('🔔 Notificación de like creada:', notification._id);
          } else {
            console.log('🔕 Usuario desactivó notificaciones de likes — omitida');
          }
        } catch (notifError) {
          console.error('⚠️ Error creando notificación de like:', notifError);
        }
      }
    }

    await post.save();

    res.json({
      success: true,
      message: liked ? 'Like agregado' : 'Like removido',
      data: { liked, likesCount: post.stats.likes.length }
    });
  } catch (error) {
    console.error('❌ Error con like:', error);
    res.status(500).json({ success: false, message: 'Error al procesar like' });
  }
});

// 5b. QUITAR LIKE (DELETE)
router.delete('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    }

    post.stats.likes = post.stats.likes.filter(
      like => like.toString() !== req.userId.toString()
    );

    await post.save();

    res.json({
      success: true,
      message: 'Like removido',
      data: { unliked: true, likesCount: post.stats.likes.length }
    });
  } catch (error) {
    console.error('❌ Error quitando like:', error);
    res.status(500).json({ success: false, message: 'Error al quitar like' });
  }
});

// 6. AGREGAR COMENTARIO ✅ (CON notificationSettings)
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    console.log('💬 ===== AGREGANDO COMENTARIO =====');

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'El comentario no puede estar vacío' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    }

    if (post.settings?.allowComments === false) {
      return res.status(403).json({ success: false, message: 'Los comentarios están deshabilitados en esta publicación' });
    }

    if (!post.comments) post.comments = [];
    post.comments.push({ user: req.userId, content: content.trim(), createdAt: new Date() });
    if (post.stats) post.stats.commentsCount = post.comments.length;

    await post.save();

    if (post.author.toString() !== req.userId.toString()) {
      try {
        const [commenter, postAuthor] = await Promise.all([
          User.findById(req.userId),
          User.findById(post.author).select('notificationSettings')
        ]);

        // ✅ VERIFICAR si el autor tiene comentarios activados
        const commentsEnabled = postAuthor?.notificationSettings?.comments !== false;

        if (commentsEnabled) {
          const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
          const notification = await Notification.create({
            recipient: post.author,
            sender: req.userId,
            type: 'comment',
            title: 'Nuevo comentario',
            message: `${commenter.name || commenter.nombre} comentó: "${preview}"`,
            icon: '💬',
            color: 'blue',
            relatedId: post._id,
            relatedModel: 'Post',
            actionUrl: `/post/${post._id}`
          });

          const io = req.app.get('io');
          if (io) {
            io.to(post.author.toString()).emit('nueva-notificacion', {
              ...notification.toObject(),
              sender: { _id: commenter._id, name: commenter.name || commenter.nombre, avatar: commenter.avatar }
            });
          }
          console.log('🔔 Notificación de comentario creada:', notification._id);
        } else {
          console.log('🔕 Usuario desactivó notificaciones de comentarios — omitida');
        }
      } catch (notifError) {
        console.error('⚠️ Error creando notificación de comentario:', notifError);
      }
    }

    const savedPost = await Post.findById(req.params.postId)
      .populate('comments.user', 'name nombre email avatar');

    const savedComment = savedPost.comments[savedPost.comments.length - 1];

    res.status(201).json({
      success: true,
      message: 'Comentario agregado exitosamente',
      data: { comment: savedComment, commentsCount: savedPost.comments.length }
    });
  } catch (error) {
    console.error('❌ Error agregando comentario:', error);
    res.status(500).json({ success: false, message: 'Error al agregar comentario', error: error.message });
  }
});

// 6b. OBTENER COMENTARIOS DE UN POST
router.get('/:postId/comments', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('comments.user', 'name nombre email avatar')
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    }

    res.json({
      success: true,
      data: { comments: post.comments || [], commentsCount: post.comments?.length || 0 }
    });
  } catch (error) {
    console.error('❌ Error obteniendo comentarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener comentarios' });
  }
});

// 6c. ELIMINAR COMENTARIO
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    }

    const commentIndex = post.comments.findIndex(
      c => c._id.toString() === req.params.commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: 'Comentario no encontrado' });
    }

    const isCommentAuthor = post.comments[commentIndex].user.toString() === req.userId.toString();
    const isPostAuthor = post.author.toString() === req.userId.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar este comentario' });
    }

    post.comments.splice(commentIndex, 1);
    if (post.stats) post.stats.commentsCount = post.comments.length;

    await post.save();

    res.json({
      success: true,
      message: 'Comentario eliminado exitosamente',
      data: { commentsCount: post.comments.length }
    });
  } catch (error) {
    console.error('❌ Error eliminando comentario:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar comentario' });
  }
});

// 7. ELIMINAR PUBLICACIÓN
router.delete('/:postId', auth, async (req, res) => {
  try {
    console.log('🗑️ Eliminando post:', req.params.postId);
    
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar esta publicación' });
    }

    post.status = 'deleted';
    await post.save();

    res.json({ success: true, message: 'Publicación eliminada exitosamente' });
  } catch (error) {
    console.error('❌ Error eliminando post:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar la publicación' });
  }
});

// 8. EDITAR POST
router.put('/:postId', auth, async (req, res) => {
  try {
    console.log('✏️ Editando post:', req.params.postId);
    
    const { contenido, content } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    }

    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para editar esta publicación' });
    }

    const newContent = contenido || content;
    if (!newContent || !newContent.trim()) {
      return res.status(400).json({ success: false, message: 'El contenido no puede estar vacío' });
    }

    post.content = newContent;
    post.isEdited = true;
    await post.save();

    await post.populate('author', 'name nombre email avatar role verified');

    res.json({
      success: true,
      message: 'Publicación editada exitosamente',
      data: { post }
    });
  } catch (error) {
    console.error('❌ Error editando post:', error);
    res.status(500).json({ success: false, message: 'Error al editar la publicación' });
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
    const moderatedCount = await Post.countDocuments({ moderatedBy: { $exists: true, $ne: null } });

    res.json({
      success: true,
      data: {
        posts,
        stats: { total: totalPosts, active: activeCount, deleted: deletedCount, moderated: moderatedCount },
        pagination: { page, limit, total: totalPosts, pages: Math.ceil(totalPosts / limit) }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo publicaciones (admin):', error);
    res.status(500).json({ success: false, message: 'Error al obtener publicaciones' });
  }
});

// 2. MODERAR PUBLICACIÓN - SOLO ADMIN
router.post('/admin/:postId/moderate', auth, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    }

    post.status = 'deleted';
    post.moderatedBy = req.userId;
    post.moderatedAt = new Date();
    post.moderationReason = reason || 'Eliminado por moderación';
    await post.save();

    res.json({ success: true, message: 'Publicación moderada exitosamente' });
  } catch (error) {
    console.error('❌ Error moderando:', error);
    res.status(500).json({ success: false, message: 'Error al moderar publicación' });
  }
});

// 3. RESTAURAR PUBLICACIÓN - SOLO ADMIN
router.post('/admin/:postId/restore', auth, isAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    }

    post.status = 'active';
    post.restoredBy = req.userId;
    post.restoredAt = new Date();
    await post.save();

    res.json({ success: true, message: 'Publicación restaurada exitosamente' });
  } catch (error) {
    console.error('❌ Error restaurando:', error);
    res.status(500).json({ success: false, message: 'Error al restaurar publicación' });
  }
});

// 4. ELIMINAR PERMANENTEMENTE - SOLO SUPERADMIN
router.delete('/admin/:postId/permanent', auth, isSuperAdmin, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.postId);
    res.json({ success: true, message: 'Publicación eliminada permanentemente' });
  } catch (error) {
    console.error('❌ Error eliminando permanentemente:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar publicación' });
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
      return res.status(404).json({ success: false, message: 'Publicación no encontrada' });
    }

    res.json({ success: true, data: { post } });
  } catch (error) {
    console.error('❌ Error obteniendo post:', error);
    res.status(500).json({ success: false, message: 'Error al obtener la publicación' });
  }
});

console.log('✅ Rutas de posts configuradas con notificaciones automáticas');
console.log('   📝 POST   /api/posts - Crear publicación (Cloudinary URLs vía JSON)');
console.log('   📰 GET    /api/posts - TODAS las publicaciones (con privacidad)');
console.log('   📰 GET    /api/posts/feed - Feed de publicaciones (con privacidad)');
console.log('   👤 GET    /api/posts/user/my-posts - Mis publicaciones');
console.log('   👥 GET    /api/posts/user/:userId - Posts de usuario');
console.log('   📄 GET    /api/posts/:postId - Ver publicación');
console.log('   ❤️  POST   /api/posts/:postId/like - Dar like (con notificationSettings)');
console.log('   💔 DELETE /api/posts/:postId/like - Quitar like');
console.log('   💬 POST   /api/posts/:postId/comments - Agregar comentario (con notificationSettings)');
console.log('   💬 GET    /api/posts/:postId/comments - Ver comentarios');
console.log('   💬 DELETE /api/posts/:postId/comments/:commentId - Borrar comentario');
console.log('   🗑️  DELETE /api/posts/:postId - Eliminar');
console.log('   ✏️  PUT    /api/posts/:postId - Editar');
console.log('✅ Rutas de moderación configuradas');

module.exports = router;