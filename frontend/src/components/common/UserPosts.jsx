import React, { useState, useEffect } from 'react';
import { Loader2, Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit2 } from 'lucide-react';

// ============================================
// COMPONENTE POST CARD (INLINE)
// ============================================
const PostCard = ({ post, currentUser, onDelete, onLike }) => {
    // Validación básica
    if (!post) {
        console.error('Post es null o undefined');
        return null;
    }

    if (!currentUser) {
        console.error('CurrentUser es null o undefined');
        return null;
    }

    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [commentsCount, setCommentsCount] = useState(0);

    // Inicializar contadores de forma segura
    useEffect(() => {
        if (post.stats) {
            setLikesCount(post.stats.likesCount || 0);
            setCommentsCount(post.stats.commentsCount || 0);
        }

        // Verificar si el usuario ya dio like
        if (Array.isArray(post.likes) && post.likes.length > 0) {
            const currentUserId = currentUser._id || currentUser.id;
            const liked = post.likes.some(like => {
                const likeUserId = like?.user?._id || like?.user || like;
                return String(likeUserId) === String(currentUserId);
            });
            setIsLiked(liked);
            setLikesCount(post.likes.length);
        }
    }, [post, currentUser]);

    // Formatear tiempo
    const formatTimeAgo = (date) => {
        if (!date) return 'hace un momento';
        try {
            const seconds = Math.floor((new Date() - new Date(date)) / 1000);
            if (seconds < 60) return 'hace un momento';
            if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
            if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
            return `hace ${Math.floor(seconds / 86400)} d`;
        } catch {
            return 'hace un momento';
        }
    };

    // Handler de like
    const handleLike = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/${post._id}/like`, {
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
            }
        } catch (error) {
            console.error('Error al dar like:', error);
        }
    };

    // Handler de comentario
    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/${post._id}/comments`, {
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
                alert('Comentario agregado');
            }
        } catch (error) {
            console.error('Error al comentar:', error);
        }
    };

    // Handler de eliminar
    const handleDelete = async () => {
        if (!window.confirm('¿Eliminar esta publicación?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/${post._id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                if (onDelete) onDelete(post._id);
                alert('Publicación eliminada');
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
        }
    };

    // Verificar si es el propietario
    const authorId = post.author?._id || post.author;
    const currentUserId = currentUser._id || currentUser.id;
    const isOwner = String(authorId) === String(currentUserId);

    return (
        <div className="bg-white rounded-lg shadow-md mb-4">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img
                        src={post.author?.avatar || 'https://ui-avatars.com/api/?name=User'}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=U'}
                    />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                                {post.author?.name || 'Usuario'}
                            </span>
                            {post.author?.verified?.email && (
                                <span className="text-blue-500 text-sm"></span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            {formatTimeAgo(post.createdAt)}
                            {post.isEdited && ' (editado)'}
                        </p>
                    </div>
                </div>

                {isOwner && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                        </button>

                        {showMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setShowMenu(false)}
                                />
                                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg z-20 border">
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
                                </div>
                            </>
                        )}
                    </div>
                )}
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

            {/* Images */}
            {Array.isArray(post.images) && post.images.length > 0 && (
                <div className={`grid gap-1 ${
                    post.images.length === 1 ? 'grid-cols-1' :
                    post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                }`}>
                    {post.images.slice(0, 4).map((img, index) => (
                        <img
                            key={index}
                            src={img.url || img}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-64 object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="px-4 py-3 border-t border-gray-200 flex justify-between text-sm text-gray-600">
                <span className="font-medium">{likesCount} me gusta</span>
                <span className="font-medium">{commentsCount} comentarios</span>
            </div>

            {/* Actions */}
            <div className="px-4 py-2 flex justify-around border-t border-gray-200">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition ${
                        isLiked ? 'text-red-500' : 'text-gray-600'
                    }`}
                >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">Me gusta</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Comentar</span>
                </button>

                <button className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition">
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium">Compartir</span>
                </button>
            </div>

            {/* Comments Section */}
            {showComments && (
                <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                    <form onSubmit={handleComment} className="mt-4 flex gap-2">
                        <img
                            src={currentUser?.avatar || 'https://ui-avatars.com/api/?name=U'}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full"
                        />
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Escribe un comentario..."
                            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 text-sm"
                        >
                            Enviar
                        </button>
                    </form>

                    {Array.isArray(post.comments) && post.comments.length > 0 && (
                        <div className="mt-4 space-y-3">
                            {post.comments.map((comment, i) => (
                                <div key={comment._id || i} className="flex gap-2">
                                    <img
                                        src={comment.user?.avatar || 'https://ui-avatars.com/api/?name=U'}
                                        alt="Avatar"
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <div className="flex-1 bg-white rounded-lg px-3 py-2">
                                        <span className="font-semibold text-sm">
                                            {comment.user?.name || 'Usuario'}
                                        </span>
                                        <p className="text-sm text-gray-800">{comment.content}</p>
                                        <span className="text-xs text-gray-500">
                                            {formatTimeAgo(comment.createdAt)}
                                        </span>
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

// ============================================
// COMPONENTE PRINCIPAL: USER POSTS
// ============================================
const UserPosts = ({ userId, currentUser }) => {
    console.log('🔷 UserPosts renderizado');
    console.log('UserId:', userId);
    console.log('CurrentUser:', currentUser);
    
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (userId) {
            loadPosts();
        }
    }, [userId]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('token');
            
            console.log('🔍 Cargando posts...');
            console.log('Token:', token ? '✅ Existe' : '❌ NO EXISTE');
            console.log('UserId:', userId);
            
            if (!token) {
                setError('No estás autenticado');
                setLoading(false);
                return;
            }

            // Validar que userId sea válido
            if (!userId || userId === 'my-posts' || userId === 'undefined') {
                console.error('❌ userId inválido:', userId);
                setError('ID de usuario inválido');
                setLoading(false);
                return;
            }

            const url = `/api/posts/user/${userId}?page=${page}&limit=10`;
            console.log('URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                throw new Error(`Error ${response.status}`);
            }

            const data = await response.json();
            
            console.log('✅ Data recibida:', data);
            console.log('📝 Posts:', data.data?.posts?.length || 0);

            if (data.success) {
                const receivedPosts = data.data.posts || [];
                console.log('Posts a mostrar:', receivedPosts);
                setPosts(receivedPosts);
                setHasMore(data.data.pagination?.page < data.data.pagination?.pages);
            } else {
                setError(data.message || 'Error al cargar publicaciones');
            }
        } catch (err) {
            console.error('💥 Error:', err);
            setError(err.message || 'Error al cargar las publicaciones');
        } finally {
            setLoading(false);
        }
    };

    const handlePostDeleted = (postId) => {
        setPosts(posts.filter(post => post._id !== postId));
    };

    const handleLike = (postId, isLiked) => {
        console.log('Like actualizado:', postId, isLiked);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600">Cargando publicaciones...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-600 mb-2">❌ {error}</p>
                <button
                    onClick={loadPosts}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                <p className="text-gray-600 text-lg mb-2">📝 No hay publicaciones aún</p>
                <p className="text-gray-500 text-sm">
                    {currentUser?._id === userId 
                        ? '¡Sé el primero en compartir algo!' 
                        : 'Este usuario no ha publicado nada todavía'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {posts.map((post) => (
                <PostCard
                    key={post._id}
                    post={post}
                    currentUser={currentUser}
                    onDelete={handlePostDeleted}
                    onLike={handleLike}
                />
            ))}

            {hasMore && (
                <div className="text-center py-4">
                    <button
                        onClick={() => {
                            setPage(page + 1);
                            loadPosts();
                        }}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                        Cargar más publicaciones
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserPosts;