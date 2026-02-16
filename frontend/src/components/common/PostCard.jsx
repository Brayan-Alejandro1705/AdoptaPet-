import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit2, Star } from 'lucide-react';

// ===== AVATAR FALLBACK LOCAL (sin peticiones externas) =====
const generateAvatarSVG = (name = 'U') => {
    const initials = name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    // Colores basados en el nombre para que sea consistente
    const colors = ['#4F46E5','#7C3AED','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#8B5CF6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const bg = colors[Math.abs(hash) % colors.length];

    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'>
        <circle cx='50' cy='50' r='50' fill='${bg}'/>
        <text x='50' y='62' text-anchor='middle' font-size='38' font-family='Arial,sans-serif' font-weight='bold' fill='#FFFFFF'>${initials}</text>
    </svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const PostCard = ({ post, currentUser, onDelete, onLike, onComment, onEdit }) => {
    // ===== DEBUGGING TEMPORAL =====
    console.log('🔍 PostCard - Post completo:', post);
    console.log('👤 PostCard - Post author:', post.author);
    console.log('📝 author.name:', post.author?.name);
    console.log('📝 author.nombre:', post.author?.nombre);
    
    // ===== VALIDACIÓN =====
    if (!post) {
        console.error('PostCard: post es null o undefined');
        return null;
    }

    if (!currentUser) {
        console.error('PostCard: currentUser es null o undefined');
        return null;
    }

    // ===== ESTADO =====
    const [isFavorite, setIsFavorite] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [commentsCount, setCommentsCount] = useState(0);

    // ===== FUNCIÓN HELPER PARA AVATARS =====
    const getAvatarUrl = (user) => {
        if (!user) return generateAvatarSVG('U');

        if (user.avatar?.startsWith('http')) {
            return user.avatar;
        }

        if (user.avatar) {
            return `http://127.0.0.1:5000${user.avatar}`;
        }

        // Fallback local, sin petición externa
        const name = user.name || user.nombre || 'User';
        return generateAvatarSVG(name);
    };

    // ===== FUNCIÓN HELPER PARA IMÁGENES =====
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;

        if (imagePath.startsWith('http')) {
            return imagePath;
        }

        if (imagePath.startsWith('/')) {
            return `http://localhost:5000${imagePath}`;
        }

        return `http://localhost:5000/${imagePath}`;
    };

    // ===== OBTENER IMÁGENES DEL POST =====
    const getPostImages = () => {
        if (post.media?.images && Array.isArray(post.media.images) && post.media.images.length > 0) {
            return post.media.images;
        }

        if (post.images && Array.isArray(post.images) && post.images.length > 0) {
            return post.images;
        }

        return [];
    };

    const postImages = getPostImages();

    // ===== INICIALIZAR DATOS =====
    useEffect(() => {
        if (post.stats) {
            setLikesCount(post.stats.likesCount || post.stats.likes?.length || 0);
            setCommentsCount(post.stats.commentsCount || 0);
        }

        if (Array.isArray(post.stats?.likes) && post.stats.likes.length > 0) {
            const currentUserId = currentUser._id || currentUser.id || currentUser;
            const liked = post.stats.likes.some(like => {
                if (!like) return false;
                const likeUserId = like?.user?._id || like?.user || like;
                return String(likeUserId) === String(currentUserId);
            });
            setIsLiked(liked);

            if (!post.stats?.likesCount) {
                setLikesCount(post.stats.likes.length);
            }
        }

        if (Array.isArray(post.comments)) {
            if (!post.stats?.commentsCount) {
                setCommentsCount(post.comments.length);
            }
        }
    }, [post, currentUser]);

    // ===== VERIFICAR SI EL POST ESTÁ EN FAVORITOS =====
    useEffect(() => {
        const checkFavorite = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token || !post._id) return;

                const response = await fetch(`http://127.0.0.1:5000/api/favoritos/check/${post._id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();
                if (data.success) {
                    setIsFavorite(data.isFavorite);
                }
            } catch (error) {
                console.error('Error verificando favorito:', error);
            }
        };

        checkFavorite();
    }, [post._id]);

    // ===== UTILIDADES =====
    const formatTimeAgo = (date) => {
        if (!date) return 'hace un momento';
        try {
            const seconds = Math.floor((new Date() - new Date(date)) / 1000);
            if (seconds < 60) return 'hace un momento';
            if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
            if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
            if (seconds < 2592000) return `hace ${Math.floor(seconds / 86400)} d`;
            return `hace ${Math.floor(seconds / 2592000)} m`;
        } catch {
            return 'hace un momento';
        }
    };

    const getPostTypeIcon = (type) => {
        const icons = {
            story: '📖',
            tip: '💡',
            adoption: '🏠',
            update: '📢',
            question: '❓',
            celebration: '🎉'
        };
        return icons[type] || '📝';
    };

    // ===== VERIFICAR PROPIETARIO =====
    const authorId = post.author?._id || post.author;
    const currentUserId = currentUser._id || currentUser.id || currentUser;
    const isOwner = String(authorId) === String(currentUserId);

    // ===== HANDLERS =====
    const handleFavorite = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Debes iniciar sesión');
                return;
            }

            const method = isFavorite ? 'DELETE' : 'POST';
            const response = await fetch(`http://127.0.0.1:5000/api/favoritos/${post._id}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setIsFavorite(!isFavorite);
                alert(isFavorite ? '💔 Quitado de favoritos' : '⭐ Agregado a favoritos');
            }
        } catch (error) {
            console.error('Error con favorito:', error);
            alert('Error al procesar favorito');
        }
    };

    const handleLike = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Debes iniciar sesión para dar like');
                return;
            }

            const response = await fetch(`http://127.0.0.1:5000/api/posts/${post._id}/like`, {
                method: isLiked ? 'DELETE' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                setIsLiked(!isLiked);
                setLikesCount(data.data.likesCount);
                if (onLike) onLike(post._id, !isLiked);
            } else {
                console.error('Error en like:', data.message);
            }
        } catch (error) {
            console.error('Error al dar like:', error);
            alert('Error al dar like. Inténtalo de nuevo.');
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Debes iniciar sesión para comentar');
                return;
            }

            const response = await fetch(`http://127.0.0.1:5000/api/posts/${post._id}/comments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: commentText })
            });

            const data = await response.json();

            if (data.success) {
                setCommentText('');
                setCommentsCount(data.data.commentsCount);
                if (onComment) onComment(post._id, data.data.comment);
                alert('Comentario agregado exitosamente');
            } else {
                alert(data.message || 'Error al agregar comentario');
            }
        } catch (error) {
            console.error('Error al comentar:', error);
            alert('Error al agregar comentario. Inténtalo de nuevo.');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de eliminar esta publicación?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://127.0.0.1:5000/api/posts/${post._id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                if (onDelete) onDelete(post._id);
                alert('Publicación eliminada exitosamente');
            } else {
                alert(data.message || 'Error al eliminar publicación');
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar publicación');
        }
    };

    // ===== RENDER =====
    return (
        <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <img
                        src={getAvatarUrl(post.author)}
                        alt={post.author?.nombre || post.author?.name || 'Usuario'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                        onError={(e) => {
                            e.target.onError = null;
                            const name = post.author?.nombre || post.author?.name || 'U';
                            e.target.src = generateAvatarSVG(name);
                        }}
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                                {post.author?.nombre || post.author?.name || 'Usuario'}
                            </h3>
                            {post.author?.verified?.email && (
                                <span className="text-blue-500 text-sm">✓</span>
                            )}
                            <span className="text-xs">
                                {getPostTypeIcon(post.type)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            {formatTimeAgo(post.createdAt)}
                            {post.isEdited && ' (editado)'}
                        </p>
                    </div>
                </div>

                {/* Menú de 3 puntos - SIEMPRE visible */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-20 border">
                                {/* Favorito - SIEMPRE visible */}
                                <button
                                    onClick={() => {
                                        setShowMenu(false);
                                        handleFavorite();
                                    }}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
                                >
                                    <span className="text-lg">{isFavorite ? '⭐' : '☆'}</span>
                                    {isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                                </button>

                                {/* Editar y Eliminar - SOLO si eres el dueño */}
                                {isOwner && (
                                    <>
                                        {onEdit && (
                                            <button
                                                onClick={() => {
                                                    setShowMenu(false);
                                                    onEdit(post);
                                                }}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm border-t"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Editar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                handleDelete();
                                            }}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 text-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Eliminar
                                        </button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                <p className="text-gray-800 whitespace-pre-wrap break-words">
                    {post.content || 'Sin contenido'}
                </p>

                {/* Tags */}
                {Array.isArray(post.tags) && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {post.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* IMÁGENES */}
            {postImages.length > 0 && (
                <div className={`grid gap-1 ${
                    postImages.length === 1 ? 'grid-cols-1' :
                    postImages.length === 2 ? 'grid-cols-2' :
                    postImages.length === 3 ? 'grid-cols-3' :
                    'grid-cols-2'
                }`}>
                    {postImages.slice(0, 4).map((image, index) => {
                        const imageUrl = getImageUrl(image.url || image);

                        return (
                            <div key={index} className="relative overflow-hidden bg-gray-100">
                                <img
                                    src={imageUrl}
                                    alt={`Imagen ${index + 1}`}
                                    className="w-full h-64 object-cover"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<div class="w-full h-64 flex items-center justify-center bg-gray-200 text-gray-500"><span>Error cargando imagen</span></div>';
                                    }}
                                />
                                {index === 3 && postImages.length > 4 && (
                                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                        <span className="text-white text-2xl font-bold">
                                            +{postImages.length - 4}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Stats */}
            <div className="px-4 py-3 border-t border-gray-200 flex justify-between text-sm text-gray-600">
                <span className="font-medium">{likesCount} me gusta</span>
                <span className="font-medium">{commentsCount} comentarios</span>
            </div>

            {/* Actions */}
            <div className="px-4 py-2 flex items-center justify-around border-t border-gray-200">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition ${
                        isLiked ? 'text-red-500' : 'text-gray-600'
                    }`}
                >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="font-medium text-sm">Me gusta</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium text-sm">Comentar</span>
                </button>

                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition">
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium text-sm">Compartir</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                    {/* Comment Form */}
                    <form onSubmit={handleComment} className="mt-4 flex gap-2">
                        <img
                            src={getAvatarUrl(currentUser)}
                            alt="Tu avatar"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                                e.target.onError = null;
                                e.target.src = generateAvatarSVG(currentUser?.nombre || currentUser?.name || 'U');
                            }}
                        />
                        <div className="flex-1 flex gap-2">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Escribe un comentario..."
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500 text-sm"
                            />
                            <button
                                type="submit"
                                disabled={!commentText.trim()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                Enviar
                            </button>
                        </div>
                    </form>

                    {/* Comments List */}
                    {Array.isArray(post.comments) && post.comments.length > 0 && (
                        <div className="mt-4 space-y-3">
                            {post.comments.map((comment) => (
                                <div key={comment._id || Math.random()} className="flex gap-2">
                                    <img
                                        src={getAvatarUrl(comment.user)}
                                        alt={comment.user?.nombre || comment.user?.name || 'Usuario'}
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                        onError={(e) => {
                                            e.target.onError = null;
                                            e.target.src = generateAvatarSVG(comment.user?.nombre || comment.user?.name || 'U');
                                        }}
                                    />
                                    <div className="flex-1 bg-white rounded-lg px-3 py-2 shadow-sm">
                                        <h4 className="font-semibold text-sm text-gray-900">
                                            {comment.user?.nombre || comment.user?.name || 'Usuario'}
                                        </h4>
                                        <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatTimeAgo(comment.createdAt)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostCard;