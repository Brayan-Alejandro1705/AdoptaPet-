// =============================================
// RUTAS DE MODERACIÓN - ADOPTAPET
// =============================================
// 
// INSTRUCCIONES DE USO:
// Agrega estas rutas al final de tu archivo postRoutes.js
// ANTES de "module.exports = router;"
//
// Ejemplo:
// const { isAdmin, isSuperAdmin } = require('../middleware/moderationAuth');
// 
// ... (tus rutas existentes) ...
//
// ... (pega aquí las rutas de moderación) ...
//
// module.exports = router;
// =============================================

const { isAdmin, isSuperAdmin } = require('../middleware/moderationAuth');

console.log('🛡️ Configurando rutas de moderación...');

// ============================================
// RUTAS DE MODERACIÓN (SOLO ADMIN/SUPERADMIN)
// ============================================

// 1. OBTENER TODAS LAS PUBLICACIONES (INCLUYENDO ELIMINADAS) - SOLO ADMIN
router.get('/admin/all', auth, isAdmin, async (req, res) => {
  try {
    console.log('📋 ===== OBTENIENDO TODAS LAS PUBLICACIONES (ADMIN) =====');
    console.log('👤 Admin:', req.user.email);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all'; // all, active, deleted, moderated

    // Construir query según el filtro
    let query = {};
    
    if (filter === 'active') {
      query.status = 'active';
    } else if (filter === 'deleted') {
      query.status = 'deleted';
    } else if (filter === 'moderated') {
      query.moderatedBy = { $exists: true, $ne: null };
    }

    console.log('🔍 Filtro aplicado:', filter);
    console.log('🔍 Query:', JSON.stringify(query));

    // Obtener publicaciones
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name nombre email avatar role verified')
      .populate('moderatedBy', 'name nombre email role')
      .populate('deletedBy', 'name nombre email role')
      .lean();

    console.log(`✅ Publicaciones encontradas: ${posts.length}`);

    // Obtener estadísticas
    const totalPosts = await Post.countDocuments(query);
    const activeCount = await Post.countDocuments({ status: 'active' });
    const deletedCount = await Post.countDocuments({ status: 'deleted' });
    const moderatedCount = await Post.countDocuments({ 
      moderatedBy: { $exists: true, $ne: null } 
    });

    console.log('📊 Estadísticas:');
    console.log(`   Total: ${totalPosts}`);
    console.log(`   Activas: ${activeCount}`);
    console.log(`   Eliminadas: ${deletedCount}`);
    console.log(`   Moderadas: ${moderatedCount}`);

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
      message: 'Error al obtener publicaciones',
      error: error.message
    });
  }
});

// 2. MODERAR (ELIMINAR) CUALQUIER PUBLICACIÓN - SOLO ADMIN
router.post('/admin/:postId/moderate', auth, isAdmin, async (req, res) => {
  try {
    console.log('🚫 ===== MODERANDO PUBLICACIÓN =====');
    console.log('📝 Post ID:', req.params.postId);
    console.log('👤 Moderador:', req.user.email);

    const { reason } = req.body;

    const post = await Post.findById(req.params.postId);

    if (!post) {
      console.log('❌ Publicación no encontrada');
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    console.log('📊 Estado anterior:', post.status);
    console.log('👤 Autor del post:', post.author);

    // Marcar como eliminada y agregar información de moderación
    post.status = 'deleted';
    post.moderatedBy = req.userId;
    post.moderatedAt = new Date();
    post.moderationReason = reason || 'Eliminado por moderación';
    
    await post.save();

    console.log('✅ Publicación moderada exitosamente');
    console.log('   Razón:', post.moderationReason);

    // Opcional: Crear notificación al autor
    try {
      const author = await User.findById(post.author);
      if (author && author._id.toString() !== req.userId.toString()) {
        const Notification = require('../models/Notification');
        
        await Notification.create({
          recipient: post.author,
          sender: req.userId,
          type: 'system',
          title: 'Publicación moderada',
          message: `Tu publicación fue removida por un administrador. Razón: ${post.moderationReason}`,
          icon: '⚠️',
          color: 'red',
          relatedId: post._id,
          relatedModel: 'Post'
        });

        console.log('📧 Notificación enviada al autor');
      }
    } catch (notifError) {
      console.error('⚠️ Error enviando notificación:', notifError.message);
    }

    res.json({
      success: true,
      message: 'Publicación moderada exitosamente',
      data: {
        postId: post._id,
        status: post.status,
        moderatedBy: req.user.name || req.user.nombre,
        moderatedAt: post.moderatedAt,
        reason: post.moderationReason
      }
    });

  } catch (error) {
    console.error('❌ Error moderando publicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al moderar publicación',
      error: error.message
    });
  }
});

// 3. RESTAURAR PUBLICACIÓN ELIMINADA - SOLO ADMIN
router.post('/admin/:postId/restore', auth, isAdmin, async (req, res) => {
  try {
    console.log('♻️ ===== RESTAURANDO PUBLICACIÓN =====');
    console.log('📝 Post ID:', req.params.postId);
    console.log('👤 Admin:', req.user.email);

    const post = await Post.findById(req.params.postId);

    if (!post) {
      console.log('❌ Publicación no encontrada');
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    console.log('📊 Estado anterior:', post.status);

    // Restaurar publicación
    post.status = 'active';
    post.restoredBy = req.userId;
    post.restoredAt = new Date();
    
    await post.save();

    console.log('✅ Publicación restaurada exitosamente');

    // Opcional: Notificar al autor
    try {
      const author = await User.findById(post.author);
      if (author && author._id.toString() !== req.userId.toString()) {
        const Notification = require('../models/Notification');
        
        await Notification.create({
          recipient: post.author,
          sender: req.userId,
          type: 'system',
          title: 'Publicación restaurada',
          message: 'Tu publicación ha sido restaurada por un administrador',
          icon: '✅',
          color: 'green',
          relatedId: post._id,
          relatedModel: 'Post',
          actionUrl: `/post/${post._id}`
        });

        console.log('📧 Notificación enviada al autor');
      }
    } catch (notifError) {
      console.error('⚠️ Error enviando notificación:', notifError.message);
    }

    res.json({
      success: true,
      message: 'Publicación restaurada exitosamente',
      data: {
        postId: post._id,
        status: post.status,
        restoredBy: req.user.name || req.user.nombre,
        restoredAt: post.restoredAt
      }
    });

  } catch (error) {
    console.error('❌ Error restaurando publicación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restaurar publicación',
      error: error.message
    });
  }
});

// 4. ELIMINAR PERMANENTEMENTE UNA PUBLICACIÓN - SOLO SUPERADMIN
router.delete('/admin/:postId/permanent', auth, isSuperAdmin, async (req, res) => {
  try {
    console.log('🗑️ ===== ELIMINACIÓN PERMANENTE =====');
    console.log('📝 Post ID:', req.params.postId);
    console.log('👑 SuperAdmin:', req.user.email);

    const post = await Post.findById(req.params.postId);

    if (!post) {
      console.log('❌ Publicación no encontrada');
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    // Eliminar permanentemente
    await Post.findByIdAndDelete(req.params.postId);

    console.log('✅ Publicación eliminada permanentemente');
    console.log('⚠️ Esta acción es IRREVERSIBLE');

    res.json({
      success: true,
      message: 'Publicación eliminada permanentemente',
      data: {
        postId: req.params.postId,
        deletedBy: req.user.name || req.user.nombre
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando permanentemente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar publicación',
      error: error.message
    });
  }
});

// 5. OBTENER ESTADÍSTICAS DE MODERACIÓN - SOLO ADMIN
router.get('/admin/stats', auth, isAdmin, async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de moderación...');

    const stats = {
      total: await Post.countDocuments(),
      active: await Post.countDocuments({ status: 'active' }),
      deleted: await Post.countDocuments({ status: 'deleted' }),
      moderated: await Post.countDocuments({ 
        moderatedBy: { $exists: true, $ne: null } 
      }),
      today: await Post.countDocuments({
        createdAt: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        }
      }),
      thisWeek: await Post.countDocuments({
        createdAt: { 
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        }
      }),
      thisMonth: await Post.countDocuments({
        createdAt: { 
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) 
        }
      })
    };

    console.log('✅ Estadísticas obtenidas:', stats);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

console.log('✅ Rutas de moderación configuradas:');
console.log('   📋 GET    /api/posts/admin/all - Ver todas las publicaciones');
console.log('   🚫 POST   /api/posts/admin/:postId/moderate - Moderar publicación');
console.log('   ♻️  POST   /api/posts/admin/:postId/restore - Restaurar publicación');
console.log('   🗑️  DELETE /api/posts/admin/:postId/permanent - Eliminar permanentemente (SuperAdmin)');
console.log('   📊 GET    /api/posts/admin/stats - Estadísticas de moderación');