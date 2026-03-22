const express = require('express');
const router = express.Router();

// Middleware de autenticación mejorado
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No autorizado - Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const UserModel = require('../models/User');
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'adoptapet_secreto_super_seguro_2025');
    } catch (jwtError) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }

    req.userId = decoded.id;
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Error en auth middleware:', error);
    return res.status(401).json({ success: false, message: 'Error de autenticación' });
  }
};

// Importar modelos
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const User = require('../models/User');

// ============================================
// ✅ HELPERS
// ============================================

const mapPrivacidadToVisibility = (priv) => {
  if (priv === 'amigos') return 'friends';
  if (priv === 'privado') return 'private';
  return 'public';
};

const buildVisibilityFilter = (req) => {
  const viewerId = req.userId;
  const friendsIds = req.user?.friends || [];

  return {
    status: { $ne: 'deleted' }, // No mostrar eliminados
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

// 1. MIS PUBLICACIONES
router.get('/user/my-posts', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ author: req.userId, status: 'active' })
      .populate('author', 'name nombre email avatar role verified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments({ author: req.userId, status: 'active' });

    res.json({
      success: true,
      data: {
        posts,
        pagination: { page, limit, total: totalPosts, pages: Math.ceil(totalPosts / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener tus publicaciones' });
  }
});

// 2. FEED PRINCIPAL
router.get('/', auth, async (req, res) => {
  try {
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

    res.json({
      success: true,
      data: { posts, pagination: { page, limit, total: totalPosts, pages: Math.ceil(totalPosts / limit) } }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener publicaciones' });
  }
});

// 2b. FEED ALTERNATIVO (alias)
router.get('/feed', auth, async (req, res) => {
  try {
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
    res.json({ success: true, data: { posts, pagination: { page, limit, total: totalPosts } } });
  } catch (error) { res.status(500).json({ success: false }); }
});

// 3. POSTS DE UN USUARIO ESPECÍFICO
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.params.userId, status: 'active' })
      .populate('author', 'name nombre email avatar role verified')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: { posts } });
  } catch (error) { res.status(500).json({ success: false }); }
});

// 4. CREAR PUBLICACIÓN
router.post('/', auth, async (req, res) => {
  try {
    const { contenido, tipo, imagenes, videos, visibility } = req.body;
    const imageUrls = Array.isArray(imagenes) ? imagenes : [];
    const videoUrl = videos || null;

    if (!contenido?.trim() && imageUrls.length === 0 && !videoUrl) {
      return res.status(400).json({ success: false, message: 'Debes proporcionar contenido o media' });
    }

    const postData = {
      author: req.userId,
      content: contenido?.trim() || '',
      type: tipo || 'update',
      media: { images: imageUrls, videos: videoUrl ? [videoUrl] : [] },
      settings: {
        visibility: visibility || 'public',
        allowComments: true,
        allowSharing: true
      }
    };

    const newPost = new Post(postData);
    await newPost.save();
    await newPost.populate('author', 'name nombre email avatar role verified');

    res.status(201).json({ success: true, data: { post: newPost } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear la publicación' });
  }
});

// 5. LIKE / UNLIKE ✅ OPTIMIZADO
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.userId;

    const existing = await Post.findOne({ _id: postId, 'stats.likes': userId }, { _id: 1 }).lean();
    let updatedPost;
    let liked;

    if (existing) {
      updatedPost = await Post.findByIdAndUpdate(postId, 
        { $pull: { 'stats.likes': userId }, $inc: { 'stats.likesCount': -1 } },
        { new: true, select: 'stats.likesCount author' }).lean();
      liked = false;
    } else {
      updatedPost = await Post.findByIdAndUpdate(postId, 
        { $addToSet: { 'stats.likes': userId }, $inc: { 'stats.likesCount': 1 } },
        { new: true, select: 'stats.likesCount author' }).lean();
      liked = true;
    }

    const likesCount = updatedPost.stats?.likesCount ?? 0;
    res.json({ success: true, data: { liked, likesCount } });

    // Notificación en background
    if (liked && updatedPost.author.toString() !== userId.toString()) {
      setImmediate(async () => {
        try {
          const [liker, postAuthor] = await Promise.all([
            User.findById(userId).select('name nombre avatar').lean(),
            User.findById(updatedPost.author).select('notificationSettings').lean()
          ]);
          if (postAuthor?.notificationSettings?.likes !== false) {
            const notification = await Notification.create({
              recipient: updatedPost.author, sender: userId, type: 'like',
              title: 'Le gustó tu publicación', message: `A ${liker?.name || liker?.nombre || 'alguien'} le gustó tu publicación`,
              icon: '❤️', relatedId: postId, relatedModel: 'Post', actionUrl: `/post/${postId}`
            });
            const io = req.app.get('io');
            if (io) io.to(updatedPost.author.toString()).emit('nueva-notificacion', { ...notification.toObject(), sender: liker });
          }
        } catch (e) {}
      });
    }
  } catch (err) { res.status(500).json({ success: false }); }
});

router.delete('/:postId/like', auth, async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.postId, 
      { $pull: { 'stats.likes': req.userId }, $inc: { 'stats.likesCount': -1 } },
      { new: true, select: 'stats.likesCount' }).lean();
    res.json({ success: true, data: { likesCount: updatedPost.stats?.likesCount || 0 } });
  } catch (err) { res.status(500).json({ success: false }); }
});

// 6. COMENTARIOS
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false });

    const updatedPost = await Post.findByIdAndUpdate(req.params.postId, 
      { 
        $push: { comments: { user: req.userId, content: content.trim(), createdAt: new Date() } },
        $inc: { 'stats.commentsCount': 1 }
      },
      { new: true }).populate('comments.user', 'name nombre avatar');

    const newComment = updatedPost.comments[updatedPost.comments.length - 1];
    res.status(201).json({ success: true, data: { comment: newComment, commentsCount: updatedPost.stats.commentsCount } });

    // Notificación... (omitida por brevedad en background similar a like)
  } catch (err) { res.status(500).json({ success: false }); }
});

// 6b. ELIMINAR COMENTARIO ✅
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ success: false });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false });

    // Solo autor del comentario o autor del post
    if (comment.user.toString() !== req.userId && post.author.toString() !== req.userId) {
      return res.status(403).json({ success: false });
    }

    const removedCount = 1;
    await Post.findByIdAndUpdate(req.params.postId, {
      $pull: { comments: { _id: req.params.commentId } },
      $inc: { 'stats.commentsCount': -removedCount }
    });

    res.json({ success: true, message: 'Comentario eliminado' });
  } catch (err) { res.status(500).json({ success: false }); }
});

// 6c. RESPONDER A COMENTARIO (REPLIES) ✅ NUEVO
router.post('/:postId/comments/:commentId/replies', auth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ success: false });

    const post = await Post.findOneAndUpdate(
      { _id: req.params.postId, "comments._id": req.params.commentId },
      { 
        $push: { "comments.$.replies": { user: req.userId, content: content.trim(), createdAt: new Date() } }
      },
      { new: true }
    ).populate('comments.replies.user', 'name nombre avatar');

    if (!post) return res.status(404).json({ success: false });

    const comment = post.comments.id(req.params.commentId);
    const newReply = comment.replies[comment.replies.length - 1];

    res.status(201).json({ success: true, data: { reply: newReply } });
  } catch (err) { res.status(500).json({ success: false }); }
});

// 6d. ELIMINAR RESPUESTA ✅ NUEVO
router.delete('/:postId/comments/:commentId/replies/:replyId', auth, async (req, res) => {
  try {
    const post = await Post.findOneAndUpdate(
      { _id: req.params.postId, "comments._id": req.params.commentId },
      { $pull: { "comments.$.replies": { _id: req.params.replyId } } },
      { new: true }
    );
    if (!post) return res.status(404).json({ success: false });
    res.json({ success: true, message: 'Respuesta eliminada' });
  } catch (err) { res.status(500).json({ success: false }); }
});

// 7. REPORTAR PUBLICACIÓN ✅ NUEVO
router.post('/:postId/report', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await Post.findByIdAndUpdate(req.params.postId, {
      $addToSet: { reports: { reporter: req.userId, reason: reason || 'Inapropiado', createdAt: new Date() } },
      $inc: { 'stats.reportsCount': 1 }
    }, { new: true });
    
    if (!post) return res.status(404).json({ success: false });

    // Si tiene muchos reportes, marcar como 'reported' automáticamente
    if (post.stats.reportsCount >= 5) {
      post.status = 'reported';
      await post.save();
    }

    res.json({ success: true, message: 'Reporte enviado' });
  } catch (err) { res.status(500).json({ success: false }); }
});

// 8. OBTENER POST POR ID
router.get('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('author', 'name nombre avatar role verified')
      .populate('comments.user', 'name nombre avatar')
      .populate('comments.replies.user', 'name nombre avatar')
      .lean();
    if (!post) return res.status(404).json({ success: false, message: 'No encontrado' });
    res.json({ success: true, data: { post } });
  } catch (err) { res.status(500).json({ success: false }); }
});

// 9. ELIMINAR POST (AUTOR)
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId, author: req.userId });
    if (!post) return res.status(404).json({ success: false });
    post.status = 'deleted';
    await post.save();
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
});

// 10. EDITAR POST
router.put('/:postId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findOneAndUpdate(
      { _id: req.params.postId, author: req.userId },
      { content, isEdited: true },
      { new: true }
    ).populate('author', 'name nombre avatar');
    if (!post) return res.status(404).json({ success: false });
    res.json({ success: true, data: { post } });
  } catch (err) { res.status(500).json({ success: false }); }
});

module.exports = router;