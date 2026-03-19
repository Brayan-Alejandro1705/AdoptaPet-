// =============================================
// CONTROLADOR DE PUBLICACIONES
// =============================================

const Post = require('../models/Post');
const User = require('../models/User');
const { moderateImage } = require('../services/geminiService');

console.log('📝 Controlador de publicaciones cargado');

// =============================================
// CREAR PUBLICACIÓN
// =============================================

exports.createPost = async (req, res) => {
    try {
        console.log('📝 Creando nueva publicación...');
        
        const { content, type, tags, visibility, relatedPet, location } = req.body;
        
        // Validar contenido
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El contenido es obligatorio'
            });
        }
        
        // Crear publicación
        const postData = {
            author: req.user._id,
            content: content.trim(),
            type: type || 'story',
            visibility: visibility || 'public',
            tags: tags ? tags.map(tag => tag.toLowerCase().trim()) : [],
        };
        
        // Agregar mascota relacionada si existe
        if (relatedPet) {
            postData.relatedPet = relatedPet;
        }
        
        // Agregar ubicación si existe
        if (location) {
            postData.location = location;
        }
        
        // Agregar imágenes si existen (deberían venir procesadas de Cloudinary)
        if (req.body.images && Array.isArray(req.body.images)) {
            // IA Moderación de Contenido Inapropiado
            for (const imgUrl of req.body.images) {
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
            postData.images = req.body.images;
        }
        
        // Agregar video si existe
        if (req.body.video) {
            postData.video = req.body.video;
        }
        
        const post = await Post.create(postData);
        
        // Actualizar contador de posts del usuario
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { 'stats.postsCount': 1 }
        });
        
        // Popular el autor
        await post.populate('author', 'name avatar role verified');
        
        console.log(`✅ Publicación creada: ${post._id}`);
        
        res.status(201).json({
            success: true,
            message: 'Publicación creada exitosamente',
            data: { post }
        });
        
    } catch (error) {
        console.error('❌ Error al crear publicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la publicación',
            error: error.message
        });
    }
};

// =============================================
// OBTENER FEED (timeline personal)
// =============================================

exports.getFeed = async (req, res) => {
    try {
        console.log('📰 Obteniendo feed...');
        
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type || null;
        
        const posts = await Post.getUserFeed(req.user._id, {
            page,
            limit,
            type
        });
        
        const totalPosts = await Post.countDocuments({
            status: 'active',
            $or: [
                { visibility: 'public' },
                { author: req.user._id }
            ]
        });
        
        res.status(200).json({
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
        console.error('❌ Error al obtener feed:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el feed',
            error: error.message
        });
    }
};

// =============================================
// OBTENER PUBLICACIONES DE UN USUARIO
// =============================================

exports.getUserPosts = async (req, res) => {
    try {
        console.log(`📋 Obteniendo publicaciones del usuario ${req.params.userId}`);
        
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        // Verificar si el usuario existe
        const user = await User.findById(userId);
        if (!user) {
            console.log('❌ Usuario no encontrado:', userId);
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        console.log('✅ Usuario encontrado:', user.name);
        
        // Construir query según privacidad
        const query = {
            author: userId,
            status: 'active'
        };
        
        // Si no es el mismo usuario, respetar privacidad
        if (req.user && req.user._id.toString() !== userId) {
            query.visibility = { $in: ['public', 'followers'] };
        }
        
        console.log('🔍 Query:', JSON.stringify(query));
        
        const posts = await Post.find(query)
            .sort({ isPinned: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('author', 'name avatar role verified')
            .populate('relatedPet', 'name species photos')
            .lean(); // Convertir a objeto plano
        
        console.log(`📝 Posts encontrados: ${posts.length}`);
        
        const totalPosts = await Post.countDocuments(query);
        
        res.status(200).json({
            success: true,
            data: {
                posts,
                user: {
                    id: user._id,
                    name: user.name,
                    avatar: user.avatar,
                    role: user.role
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
        console.error('❌ Error al obtener publicaciones del usuario:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las publicaciones',
            error: error.message
        });
    }
};

// =============================================
// OBTENER UNA PUBLICACIÓN
// =============================================

exports.getPost = async (req, res) => {
    try {
        console.log(`📄 Obteniendo publicación ${req.params.postId}`);
        
        const post = await Post.findById(req.params.postId)
            .populate('author', 'name avatar role verified bio')
            .populate('relatedPet', 'name species breed age photos status')
            .populate('comments.user', 'name avatar role verified');
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }
        
        // Verificar privacidad
        if (post.visibility === 'private' && 
            post.author._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver esta publicación'
            });
        }
        
        // Incrementar vistas
        await post.incrementViews();
        
        res.status(200).json({
            success: true,
            data: { post }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener publicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la publicación',
            error: error.message
        });
    }
};

// =============================================
// ACTUALIZAR PUBLICACIÓN
// =============================================

exports.updatePost = async (req, res) => {
    try {
        console.log(`✏️ Actualizando publicación ${req.params.postId}`);
        
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }
        
        // Verificar que sea el autor
        if (post.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar esta publicación'
            });
        }
        
        const { content, tags, visibility, type } = req.body;
        
        if (content) post.content = content;
        if (tags) post.tags = tags.map(tag => tag.toLowerCase().trim());
        if (visibility) post.visibility = visibility;
        if (type) post.type = type;
        
        post.isEdited = true;
        post.editedAt = new Date();
        
        await post.save();
        await post.populate('author', 'name avatar role verified');
        
        console.log(`✅ Publicación actualizada: ${post._id}`);
        
        res.status(200).json({
            success: true,
            message: 'Publicación actualizada exitosamente',
            data: { post }
        });
        
    } catch (error) {
        console.error('❌ Error al actualizar publicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la publicación',
            error: error.message
        });
    }
};

// =============================================
// ELIMINAR PUBLICACIÓN
// =============================================

exports.deletePost = async (req, res) => {
    try {
        console.log(`🗑️ Eliminando publicación ${req.params.postId}`);
        
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }
        
        // Verificar que sea el autor o admin
        if (post.author.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar esta publicación'
            });
        }
        
        // Soft delete
        post.status = 'deleted';
        await post.save();
        
        // Actualizar contador del usuario
        await User.findByIdAndUpdate(post.author, {
            $inc: { 'stats.postsCount': -1 }
        });
        
        console.log(`✅ Publicación eliminada: ${post._id}`);
        
        res.status(200).json({
            success: true,
            message: 'Publicación eliminada exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error al eliminar publicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la publicación',
            error: error.message
        });
    }
};

// =============================================
// DAR LIKE A PUBLICACIÓN
// =============================================

exports.likePost = async (req, res) => {
    try {
        console.log(`❤️ Like en publicación ${req.params.postId}`);
        
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }
        
        const result = await post.addLike(req.user._id);
        
        res.status(200).json({
            success: true,
            message: result.liked ? 'Like agregado' : 'Ya habías dado like',
            data: {
                liked: result.liked,
                likesCount: result.count
            }
        });
        
    } catch (error) {
        console.error('❌ Error al dar like:', error);
        res.status(500).json({
            success: false,
            message: 'Error al dar like',
            error: error.message
        });
    }
};

// =============================================
// QUITAR LIKE
// =============================================

exports.unlikePost = async (req, res) => {
    try {
        console.log(`💔 Unlike en publicación ${req.params.postId}`);
        
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }
        
        const result = await post.removeLike(req.user._id);
        
        res.status(200).json({
            success: true,
            message: 'Like removido',
            data: {
                unliked: result.unliked,
                likesCount: result.count
            }
        });
        
    } catch (error) {
        console.error('❌ Error al quitar like:', error);
        res.status(500).json({
            success: false,
            message: 'Error al quitar like',
            error: error.message
        });
    }
};

// =============================================
// COMENTAR PUBLICACIÓN
// =============================================

exports.commentPost = async (req, res) => {
    try {
        console.log(`💬 Comentario en publicación ${req.params.postId}`);
        
        const { content } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El contenido del comentario es obligatorio'
            });
        }
        
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }
        
        const comment = await post.addComment(req.user._id, content);
        
        // Popular el usuario del comentario
        await post.populate('comments.user', 'name avatar role verified');
        
        res.status(201).json({
            success: true,
            message: 'Comentario agregado exitosamente',
            data: {
                comment: post.comments[post.comments.length - 1],
                commentsCount: post.stats.commentsCount
            }
        });
        
    } catch (error) {
        console.error('❌ Error al comentar:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar comentario',
            error: error.message
        });
    }
};

// =============================================
// ELIMINAR COMENTARIO
// =============================================

exports.deleteComment = async (req, res) => {
    try {
        console.log(`🗑️ Eliminando comentario ${req.params.commentId}`);
        
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }
        
        const comment = post.comments.id(req.params.commentId);
        
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comentario no encontrado'
            });
        }
        
        // Verificar que sea el autor del comentario o admin
        if (comment.user.toString() !== req.user._id.toString() && 
            req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para eliminar este comentario'
            });
        }
        
        await post.removeComment(req.params.commentId);
        
        res.status(200).json({
            success: true,
            message: 'Comentario eliminado exitosamente',
            data: {
                commentsCount: post.stats.commentsCount
            }
        });
        
    } catch (error) {
        console.error('❌ Error al eliminar comentario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar comentario',
            error: error.message
        });
    }
};

// =============================================
// COMPARTIR PUBLICACIÓN
// =============================================

exports.sharePost = async (req, res) => {
    try {
        console.log(`🔄 Compartiendo publicación ${req.params.postId}`);
        
        const post = await Post.findById(req.params.postId);
        
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Publicación no encontrada'
            });
        }
        
        const result = await post.addShare(req.user._id);
        
        res.status(200).json({
            success: true,
            message: 'Publicación compartida exitosamente',
            data: {
                shared: result.shared,
                sharesCount: result.count
            }
        });
        
    } catch (error) {
        console.error('❌ Error al compartir:', error);
        res.status(500).json({
            success: false,
            message: 'Error al compartir publicación',
            error: error.message
        });
    }
};

// =============================================
// OBTENER TRENDING (tendencias)
// =============================================

exports.getTrending = async (req, res) => {
    try {
        console.log('🔥 Obteniendo publicaciones en tendencia...');
        
        const days = parseInt(req.query.days) || 7;
        const limit = parseInt(req.query.limit) || 10;
        
        const posts = await Post.getTrending(days, limit);
        
        res.status(200).json({
            success: true,
            data: {
                posts,
                period: `${days} días`
            }
        });
        
    } catch (error) {
        console.error('❌ Error al obtener trending:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener publicaciones en tendencia',
            error: error.message
        });
    }
};

// =============================================
// BUSCAR PUBLICACIONES
// =============================================

exports.searchPosts = async (req, res) => {
    try {
        console.log(`🔍 Buscando publicaciones: "${req.query.q}"`);
        
        const searchTerm = req.query.q;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        
        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                message: 'Debes proporcionar un término de búsqueda'
            });
        }
        
        const posts = await Post.searchPosts(searchTerm, { page, limit });
        
        res.status(200).json({
            success: true,
            data: {
                posts,
                searchTerm,
                pagination: { page, limit }
            }
        });
        
    } catch (error) {
        console.error('❌ Error al buscar publicaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar publicaciones',
            error: error.message
        });
    }
};

console.log('✅ Controlador de publicaciones listo');