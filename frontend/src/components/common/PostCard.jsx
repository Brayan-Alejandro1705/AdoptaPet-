import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreVertical, Trash2, Edit2, X, Globe, Smile, Send, Search, Copy, Check } from 'lucide-react';

const PURPLE   = '#7C3AED';
const PINK     = '#EC4899';
const GRADIENT = `linear-gradient(135deg, ${PURPLE}, ${PINK})`;

const generateAvatarSVG = (name = 'U') => {
    const initials = name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
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

const API_BASE   = 'http://127.0.0.1:5000';
const APP_ORIGIN = 'http://localhost:3000';
const buildPostLink = (postId) => `${APP_ORIGIN}/?post=${postId}`;

// ===== SHARE MODAL =====
const ShareModal = ({ post, currentUser, onClose }) => {
    const [shareText, setShareText]       = useState('');
    const [chats, setChats]               = useState([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [search, setSearch]             = useState('');
    const [sending, setSending]           = useState(null);
    const [sentTo, setSentTo]             = useState([]);
    const [sharing, setSharing]           = useState(false);
    const [shared, setShared]             = useState(false);
    const [copied, setCopied]             = useState(false);

    const token    = localStorage.getItem('token');
    const postLink = buildPostLink(post._id);

    const authorName   = post?.author?.nombre || post?.author?.name || 'Usuario';
    const authorAvatar = post?.author?.avatar
        ? (post.author.avatar.startsWith('http') ? post.author.avatar : `${API_BASE}${post.author.avatar}`)
        : generateAvatarSVG(authorName);

    const sharerName   = currentUser?.nombre || currentUser?.name || 'Tú';
    const sharerAvatar = (() => {
        if (!currentUser) return generateAvatarSVG('U');
        if (currentUser.avatar?.startsWith('http')) return currentUser.avatar;
        if (currentUser.avatar) return `${API_BASE}${currentUser.avatar}`;
        return generateAvatarSVG(sharerName);
    })();

    const snippet = (post?.content || '').slice(0, 100);

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res  = await fetch(`${API_BASE}/api/chat`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                setChats(Array.isArray(data) ? data : []);
            } catch { setChats([]); }
            finally  { setLoadingChats(false); }
        };
        if (token) fetchChats(); else setLoadingChats(false);
    }, [token]);

    const buildChatMessage = () => {
        const intro = shareText.trim() ? `"${shareText.trim()}"\n\n` : '';
        return `📌 ${intro}${sharerName} compartió: ${snippet}\n\n🔗 Ver publicación: ${postLink}`;
    };

    const handleCopyLink = async () => {
        try { await navigator.clipboard.writeText(postLink); }
        catch {
            const el = document.createElement('textarea');
            el.value = postLink; document.body.appendChild(el); el.select();
            document.execCommand('copy'); document.body.removeChild(el);
        }
        setCopied(true); setTimeout(() => setCopied(false), 2000);
    };

    const handleSendToChat = async (chat) => {
        const chatId = chat.id || chat._id;
        if (sentTo.includes(chatId)) return;
        setSending(chatId);
        try {
            const res = await fetch(`${API_BASE}/api/chat/${chatId}/messages`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: buildChatMessage() })
            });
            if (res.ok) setSentTo(prev => [...prev, chatId]);
            else alert('No se pudo enviar el mensaje');
        } catch { alert('Error de conexión'); }
        finally  { setSending(null); }
    };

    const handleShareFeed = async () => {
        setSharing(true);
        try {
            await fetch(`${API_BASE}/api/posts`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: shareText ? `${shareText}\n\n🔗 ${postLink}` : `📌 Publicación compartida\n\n🔗 ${postLink}`,
                    sharedPostId: post._id, type: 'share'
                })
            });
        } catch { }
        setShared(true); setSharing(false); setTimeout(() => onClose(), 1600);
    };

    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };
    const filteredChats  = chats.filter(c => (c.name || '').toLowerCase().includes(search.toLowerCase()));

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={handleBackdrop}
        >
            {/* En móvil aparece como sheet desde abajo; en desktop como modal centrado */}
            <div
                className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-white"
                style={{ maxHeight: '92vh' }}
            >
                {/* Header */}
                <div className="relative flex items-center justify-center py-4 flex-shrink-0" style={{ background: GRADIENT }}>
                    {/* Handle bar solo en móvil */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/40 rounded-full sm:hidden" />
                    <h2 className="text-base font-bold text-white tracking-wide">Compartir publicación</h2>
                    <button
                        onClick={onClose}
                        className="absolute right-4 w-9 h-9 rounded-full flex items-center justify-center transition"
                        style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1">

                    {/* Preview */}
                    <div className="mx-3 mt-3 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50">
                            <img src={sharerAvatar} alt={sharerName}
                                className="w-8 h-8 rounded-full object-cover border-2"
                                style={{ borderColor: PURPLE }}
                                onError={e => { e.target.src = generateAvatarSVG(sharerName); }} />
                            <div>
                                <p className="font-semibold text-sm text-gray-900">{sharerName}</p>
                                <div className="flex items-center gap-1">
                                    <Globe className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-400">Público</span>
                                </div>
                            </div>
                        </div>

                        <div className="px-3 py-2 relative bg-white">
                            <textarea
                                value={shareText}
                                onChange={e => setShareText(e.target.value)}
                                placeholder="Di algo sobre esto..."
                                rows={2}
                                className="w-full resize-none outline-none text-sm placeholder-gray-400 text-gray-800 bg-white pr-7"
                            />
                            <Smile className="absolute right-4 bottom-3 w-5 h-5 text-gray-400 cursor-pointer hover:text-yellow-400 transition" />
                        </div>

                        <div className="mx-3 mb-3 rounded-xl overflow-hidden bg-gray-50"
                             style={{ border: '1px solid #e5e7eb', borderLeft: `4px solid ${PURPLE}` }}>
                            <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                                <img src={authorAvatar} alt={authorName}
                                    className="w-7 h-7 rounded-full object-cover"
                                    onError={e => { e.target.src = generateAvatarSVG(authorName); }} />
                                <div>
                                    <p className="font-semibold text-xs text-gray-900">{authorName}</p>
                                    <p className="text-xs text-gray-400">Publicación original</p>
                                </div>
                            </div>
                            <p className="px-3 pb-2 text-xs text-gray-700">
                                {snippet}{snippet.length === 100 ? '…' : ''}
                            </p>
                            <div className="px-3 pb-3">
                                <a href={postLink} target="_blank" rel="noopener noreferrer"
                                   className="text-xs underline break-all" style={{ color: PURPLE }}>
                                    {postLink}
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Link copiable */}
                    <div className="mx-3 mt-2.5">
                        <div className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 bg-gray-50">
                            <span className="flex-1 text-xs truncate select-all cursor-text" style={{ color: PURPLE }}>
                                {postLink}
                            </span>
                            <button
                                onClick={handleCopyLink}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0 transition text-white"
                                style={{ background: copied ? '#16a34a' : GRADIENT }}
                            >
                                {copied ? <><Check className="w-3 h-3" /> Copiado</> : <><Copy className="w-3 h-3" /> Copiar</>}
                            </button>
                        </div>
                    </div>

                    {/* Compartir en feed */}
                    <div className="px-3 py-2.5 flex justify-end">
                        {shared ? (
                            <span className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold">✓ ¡Compartido!</span>
                        ) : (
                            <button
                                onClick={handleShareFeed}
                                disabled={sharing}
                                className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition hover:opacity-90 disabled:opacity-60"
                                style={{ background: GRADIENT }}
                            >
                                {sharing ? 'Compartiendo…' : 'Compartir ahora'}
                            </button>
                        )}
                    </div>

                    <div className="mx-3 border-t border-gray-200" />

                    {/* Messenger */}
                    <div className="px-3 py-3">
                        <h3 className="font-semibold text-sm text-gray-800 mb-2.5 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: GRADIENT }}>✉</span>
                            Enviar en Messenger
                        </h3>

                        <div className="flex items-center gap-2 px-3 py-2 rounded-full mb-2.5 bg-gray-100 border border-gray-200">
                            <Search className="w-4 h-4 flex-shrink-0 text-gray-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar conversaciones…"
                                className="bg-transparent outline-none text-sm flex-1 placeholder-gray-400 text-gray-700"
                            />
                        </div>

                        {loadingChats ? (
                            <div className="flex justify-center py-6">
                                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: PURPLE }} />
                            </div>
                        ) : filteredChats.length === 0 ? (
                            <p className="text-center text-xs py-4 text-gray-400">
                                {search ? 'Sin resultados' : 'No tienes conversaciones aún'}
                            </p>
                        ) : (
                            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                {filteredChats.map(chat => {
                                    const chatId    = chat.id || chat._id;
                                    const isSent    = sentTo.includes(chatId);
                                    const isLoading = sending === chatId;
                                    return (
                                        <div key={chatId} className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 transition">
                                            <div className="relative flex-shrink-0">
                                                <img
                                                    src={chat.avatar || generateAvatarSVG(chat.name || 'U')}
                                                    alt={chat.name || 'Usuario'}
                                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                    onError={e => { e.target.src = generateAvatarSVG(chat.name || 'U'); }}
                                                />
                                                {chat.online && (
                                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate text-gray-900">{chat.name || 'Usuario'}</p>
                                                {chat.lastMessage && (
                                                    <p className="text-xs truncate text-gray-400">{chat.lastMessage}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleSendToChat(chat)}
                                                disabled={isSent || isLoading}
                                                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition text-white"
                                                style={{
                                                    background: isSent ? '#16a34a' : GRADIENT,
                                                    opacity: isLoading ? 0.7 : 1,
                                                    cursor: isSent ? 'default' : 'pointer'
                                                }}
                                            >
                                                {isLoading ? (
                                                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                                ) : isSent ? <>✓ Enviado</> : <><Send className="w-3 h-3" /> Enviar</>}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Espacio extra en móvil para el safe area */}
                    <div className="h-4 sm:h-0" />
                </div>
            </div>
        </div>
    );
};


// ===== POST CARD =====
const PostCard = ({ post, currentUser, onDelete, onLike, onComment, onEdit }) => {
    if (!post)        { console.error('PostCard: post es null o undefined'); return null; }
    if (!currentUser) { console.error('PostCard: currentUser es null o undefined'); return null; }

    const author = post.author || { nombre: 'Usuario eliminado', name: 'Usuario eliminado', avatar: null, verified: { email: false } };

    const [isFavorite, setIsFavorite]         = useState(false);
    const [showComments, setShowComments]     = useState(false);
    const [commentText, setCommentText]       = useState('');
    const [showMenu, setShowMenu]             = useState(false);
    const [isLiked, setIsLiked]               = useState(false);
    const [likesCount, setLikesCount]         = useState(0);
    const [commentsCount, setCommentsCount]   = useState(0);
    const [showShareModal, setShowShareModal] = useState(false);
    const [lightbox, setLightbox]             = useState(null);

    const getAvatarUrl = (user) => {
        if (!user) return generateAvatarSVG('U');
        if (user.avatar?.startsWith('http')) return user.avatar;
        if (user.avatar) return `${API_BASE}${user.avatar}`;
        return generateAvatarSVG(user.name || user.nombre || 'User');
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:5000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    };

    const getPostImages = () => {
        if (post.media?.images?.length > 0) return post.media.images;
        if (post.images?.length > 0) return post.images;
        return [];
    };

    const postImages = getPostImages();

    useEffect(() => {
        if (post.stats) {
            setLikesCount(post.stats.likesCount || post.stats.likes?.length || 0);
            setCommentsCount(post.stats.commentsCount || 0);
        }
        if (Array.isArray(post.stats?.likes) && post.stats.likes.length > 0) {
            const uid = currentUser._id || currentUser.id || currentUser;
            const liked = post.stats.likes.some(like => {
                if (!like) return false;
                return String(like?.user?._id || like?.user || like) === String(uid);
            });
            setIsLiked(liked);
            if (!post.stats?.likesCount) setLikesCount(post.stats.likes.length);
        }
        if (Array.isArray(post.comments) && !post.stats?.commentsCount) setCommentsCount(post.comments.length);
    }, [post, currentUser]);

    useEffect(() => {
        const checkFavorite = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token || !post._id) return;
                const res  = await fetch(`${API_BASE}/api/favoritos/check/${post._id}`, { headers: { Authorization: `Bearer ${token}` } });
                const data = await res.json();
                if (data.success) setIsFavorite(data.isFavorite);
            } catch { }
        };
        checkFavorite();
    }, [post._id]);

    const formatTimeAgo = (date) => {
        if (!date) return 'hace un momento';
        try {
            const s = Math.floor((new Date() - new Date(date)) / 1000);
            if (s < 60) return 'hace un momento';
            if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
            if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
            if (s < 2592000) return `hace ${Math.floor(s / 86400)} d`;
            return `hace ${Math.floor(s / 2592000)} m`;
        } catch { return 'hace un momento'; }
    };

    const getPostTypeIcon = (type) => {
        const icons = { story:'📖', tip:'💡', adoption:'🏠', update:'📢', question:'❓', celebration:'🎉' };
        return icons[type] || '📝';
    };

    const authorId      = post.author?._id || null;
    const currentUserId = currentUser._id || currentUser.id || currentUser;
    const isOwner       = authorId !== null && String(authorId) === String(currentUserId);

    const handleFavorite = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) { alert('Debes iniciar sesión'); return; }
            const res  = await fetch(`${API_BASE}/api/favoritos/${post._id}`, { method: isFavorite ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) { setIsFavorite(!isFavorite); alert(isFavorite ? '💔 Quitado de favoritos' : '⭐ Agregado a favoritos'); }
        } catch { alert('Error al procesar favorito'); }
    };

    const handleLike = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) { alert('Debes iniciar sesión para dar like'); return; }
            const res  = await fetch(`${API_BASE}/api/posts/${post._id}/like`, { method: isLiked ? 'DELETE' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
            const data = await res.json();
            if (data.success) { setIsLiked(!isLiked); setLikesCount(data.data.likesCount); if (onLike) onLike(post._id, !isLiked); }
        } catch { alert('Error al dar like.'); }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            const token = localStorage.getItem('token');
            if (!token) { alert('Debes iniciar sesión para comentar'); return; }
            const res  = await fetch(`${API_BASE}/api/posts/${post._id}/comments`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ content: commentText }) });
            const data = await res.json();
            if (data.success) { setCommentText(''); setCommentsCount(data.data.commentsCount); if (onComment) onComment(post._id, data.data.comment); }
            else alert(data.message || 'Error al agregar comentario');
        } catch { alert('Error al agregar comentario.'); }
    };

    const handleDelete = async () => {
        if (!window.confirm('¿Estás seguro de eliminar esta publicación?')) return;
        try {
            const token = localStorage.getItem('token');
            const res  = await fetch(`${API_BASE}/api/posts/${post._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) { if (onDelete) onDelete(post._id); }
            else alert(data.message || 'Error al eliminar publicación');
        } catch { alert('Error al eliminar publicación'); }
    };

    // Altura dinámica de imágenes según cantidad
    const getImageHeight = (count) => {
        if (count === 1) return 'h-48 sm:h-72';
        return 'h-36 sm:h-52';
    };

    return (
        <>
            <div id={`post-${post._id}`} className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden border border-gray-100">

                {/* Header del post */}
                <div className="p-3 sm:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <img src={getAvatarUrl(author)} alt={author.nombre || author.name || 'Usuario'}
                             className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-100"
                             onError={e => { e.target.onError = null; e.target.src = generateAvatarSVG(author.nombre || author.name || 'U'); }} />
                        <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                                    {author.nombre || author.name || 'Usuario eliminado'}
                                </h3>
                                {author.verified?.email && <span className="text-blue-500 text-xs">✓</span>}
                                <span className="text-xs">{getPostTypeIcon(post.type)}</span>
                            </div>
                            <p className="text-xs text-gray-500">
                                {formatTimeAgo(post.createdAt)}{post.isEdited && ' · editado'}
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 rounded-full transition">
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                        </button>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg z-20 border border-gray-100 overflow-hidden">
                                    <button onClick={() => { setShowMenu(false); handleFavorite(); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                                        <span>{isFavorite ? '⭐' : '☆'}</span>
                                        {isFavorite ? 'Quitar favorito' : 'Agregar favorito'}
                                    </button>
                                    {isOwner && (
                                        <>
                                            {onEdit && (
                                                <button onClick={() => { setShowMenu(false); onEdit(post); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm border-t border-gray-100">
                                                    <Edit2 className="w-4 h-4" /> Editar
                                                </button>
                                            )}
                                            <button onClick={() => { setShowMenu(false); handleDelete(); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600 text-sm border-t border-gray-100">
                                                <Trash2 className="w-4 h-4" /> Eliminar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Contenido texto */}
                <div className="px-3 sm:px-4 pb-3">
                    <p className="text-gray-800 whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
                        {post.content || 'Sin contenido'}
                    </p>
                    {Array.isArray(post.tags) && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {post.tags.map((tag, i) => (
                                <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Imágenes */}
                {postImages.length > 0 && (
                    <div className={`grid gap-0.5 ${
                        postImages.length === 1 ? 'grid-cols-1' :
                        postImages.length === 2 ? 'grid-cols-2' :
                        postImages.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
                    }`}>
                        {postImages.slice(0, 4).map((image, index) => {
                            const imageUrl = getImageUrl(image.url || image);
                            return (
                                <div
                                    key={index}
                                    className={`relative overflow-hidden bg-gray-100 cursor-zoom-in ${getImageHeight(postImages.length)}`}
                                    onClick={() => setLightbox({ images: postImages.map(img => getImageUrl(img.url || img)), index })}
                                >
                                    <img
                                        src={imageUrl}
                                        alt={`Imagen ${index + 1}`}
                                        className="w-full h-full object-cover hover:opacity-90 transition"
                                        onError={e => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-xs">Error cargando imagen</div>';
                                        }}
                                    />
                                    {index === 3 && postImages.length > 4 && (
                                        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                                            <span className="text-white text-xl font-bold">+{postImages.length - 4}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Contador likes/comentarios */}
                <div className="px-3 sm:px-4 py-2 border-t border-gray-100 flex justify-between text-xs sm:text-sm text-gray-500">
                    <span>{likesCount} me gusta</span>
                    <span>{commentsCount} comentarios</span>
                </div>

                {/* Botones acción */}
                <div className="px-1 py-1 flex items-center border-t border-gray-100">
                    <button
                        onClick={handleLike}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-gray-50 transition ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
                    >
                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="font-medium text-xs sm:text-sm">Me gusta</span>
                    </button>
                    <button
                        onClick={() => setShowComments(!showComments)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition"
                    >
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-medium text-xs sm:text-sm">Comentar</span>
                    </button>
                    <button
                        onClick={() => setShowShareModal(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg hover:bg-gray-50 text-gray-600 transition"
                    >
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="font-medium text-xs sm:text-sm">Compartir</span>
                    </button>
                </div>

                {/* Sección comentarios */}
                {showComments && (
                    <div className="px-3 sm:px-4 pb-4 border-t border-gray-100 bg-gray-50">
                        {/* Input comentario */}
                        <form onSubmit={handleComment} className="mt-3 flex gap-2 items-start">
                            <img
                                src={getAvatarUrl(currentUser)}
                                alt="Tu avatar"
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
                                onError={e => { e.target.onError = null; e.target.src = generateAvatarSVG(currentUser?.nombre || currentUser?.name || 'U'); }}
                            />
                            <div className="flex-1 flex flex-col gap-2">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder="Escribe un comentario..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-purple-400 text-sm bg-white"
                                />
                                {/* Botón enviar solo aparece si hay texto — evita overflow */}
                                {commentText.trim() && (
                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-4 py-1.5 text-white rounded-full text-xs font-semibold"
                                            style={{ background: GRADIENT }}
                                        >
                                            Enviar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </form>

                        {/* Lista de comentarios */}
                        {Array.isArray(post.comments) && post.comments.length > 0 && (
                            <div className="mt-3 space-y-2.5">
                                {post.comments.map(comment => (
                                    <div key={comment._id || Math.random()} className="flex gap-2">
                                        <img
                                            src={getAvatarUrl(comment.user)}
                                            alt={comment.user?.nombre || 'Usuario'}
                                            className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
                                            onError={e => { e.target.onError = null; e.target.src = generateAvatarSVG(comment.user?.nombre || comment.user?.name || 'U'); }}
                                        />
                                        <div className="flex-1 bg-white rounded-xl px-3 py-2 shadow-sm">
                                            <h4 className="font-semibold text-xs text-gray-900">
                                                {comment.user?.nombre || comment.user?.name || 'Usuario'}
                                            </h4>
                                            <p className="text-sm text-gray-800 mt-0.5 break-words">{comment.content}</p>
                                            <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(comment.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showShareModal && <ShareModal post={post} currentUser={currentUser} onClose={() => setShowShareModal(false)} />}

            {/* LIGHTBOX */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 transition z-10"
                        onClick={() => setLightbox(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {lightbox.images.length > 1 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full">
                            {lightbox.index + 1} / {lightbox.images.length}
                        </div>
                    )}

                    {lightbox.images.length > 1 && (
                        <button
                            className="absolute left-2 sm:left-4 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 transition z-10 text-2xl font-bold"
                            onClick={e => { e.stopPropagation(); setLightbox(prev => ({ ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length })); }}
                        >‹</button>
                    )}

                    <img
                        src={lightbox.images[lightbox.index]}
                        alt={`Imagen ${lightbox.index + 1}`}
                        className="max-h-[85vh] max-w-[95vw] sm:max-w-[90vw] object-contain rounded-lg shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />

                    {lightbox.images.length > 1 && (
                        <button
                            className="absolute right-2 sm:right-4 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-white hover:bg-opacity-20 transition z-10 text-2xl font-bold"
                            onClick={e => { e.stopPropagation(); setLightbox(prev => ({ ...prev, index: (prev.index + 1) % prev.images.length })); }}
                        >›</button>
                    )}

                    {lightbox.images.length > 1 && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {lightbox.images.map((img, i) => (
                                <button
                                    key={i}
                                    onClick={e => { e.stopPropagation(); setLightbox(prev => ({ ...prev, index: i })); }}
                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 transition"
                                    style={{ borderColor: i === lightbox.index ? '#fff' : 'transparent', opacity: i === lightbox.index ? 1 : 0.5 }}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default PostCard;