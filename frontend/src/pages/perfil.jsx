import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { friendRequestService } from '../services/friendRequestService';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ✅ FIX 1: No concatenar API si ya es URL completa (Cloudinary)
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  const imageStr = typeof imagePath === 'string' ? imagePath : (imagePath.url || imagePath);
  if (!imageStr) return null;
  if (typeof imageStr === 'string' && (imageStr.startsWith('http://') || imageStr.startsWith('https://'))) {
    return imageStr;
  }
  return `${API}${imageStr.startsWith('/') ? '' : '/'}${imageStr}`;
};

function Perfil() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('publicaciones');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', email: '', bio: '', telefono: '', ubicacion: '' });
  const [notification, setNotification] = useState('');

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const [favoritePosts, setFavoritePosts] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [friendRequests, setFriendRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // ✅ Estado solicitud de amistad
  const [friendRequestStatus, setFriendRequestStatus] = useState('none');
  const [sendingRequest, setSendingRequest] = useState(false);

  const isOwnProfile = !userId;

  useEffect(() => {
    if (isOwnProfile) {
      cargarPerfil();
    } else {
      cargarPerfilAjeno(userId);
      cargarEstadoAmistad(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (!isOwnProfile) return;
    if (activeTab === 'publicaciones' && user) cargarPublicaciones();
    else if (activeTab === 'solicitudes' && user) cargarSolicitudesAmistad();
    else if (activeTab === 'historial' && user) cargarFavoritos();
  }, [activeTab, user]);

  useEffect(() => {
    if (!isOwnProfile && user) cargarPublicacionesAjenas(userId);
  }, [user, userId]);

  const cargarEstadoAmistad = async (id) => {
    try {
      const status = await friendRequestService.checkFriendshipStatus(id);
      setFriendRequestStatus(status || 'none');
    } catch {
      setFriendRequestStatus('none');
    }
  };

  const cargarPerfil = async () => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    try {
      const response = await fetch(`${API}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        if (response.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; return; }
        throw new Error('Error al cargar el perfil');
      }
      const data = await response.json();
      const userData = data.user || data;
      if (userData.avatar && !userData.avatar.startsWith('http')) userData.avatar = `${API}${userData.avatar}`;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      setError(err.message);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.avatar && !userData.avatar.startsWith('http')) userData.avatar = `${API}${userData.avatar}`;
          setUser(userData); setError('');
        } catch {}
      }
    } finally { setLoading(false); }
  };

  const cargarPerfilAjeno = async (id) => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }
    try {
      const response = await fetch(`${API}/api/users/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Usuario no encontrado');
      const data = await response.json();
      const userData = data.user || data;
      if (userData.avatar && !userData.avatar.startsWith('http')) userData.avatar = `${API}${userData.avatar}`;
      setUser(userData);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const cargarPublicaciones = async () => {
    setPostsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/posts/user/my-posts`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success && response.data.data) {
        const postsArray = response.data.data.posts || [];
        setPosts(postsArray); setPostsCount(postsArray.length);
      } else { setPosts([]); setPostsCount(0); }
    } catch { setPosts([]); setPostsCount(0); }
    finally { setPostsLoading(false); }
  };

  const cargarPublicacionesAjenas = async (id) => {
    setPostsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/posts/user/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success && response.data.data) {
        const postsArray = response.data.data.posts || response.data.data || [];
        setPosts(postsArray); setPostsCount(postsArray.length);
      } else { setPosts([]); setPostsCount(0); }
    } catch { setPosts([]); setPostsCount(0); }
    finally { setPostsLoading(false); }
  };

  const cargarFavoritos = async () => {
    setFavoritesLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/favoritos`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) setFavoritePosts(response.data.data || []);
      else setFavoritePosts([]);
    } catch { setFavoritePosts([]); }
    finally { setFavoritesLoading(false); }
  };

  const cargarSolicitudesAmistad = async () => {
    setRequestsLoading(true);
    try {
      const response = await friendRequestService.getReceivedRequests();
      setFriendRequests(response.data || []);
    } catch { setFriendRequests([]); }
    finally { setRequestsLoading(false); }
  };

  // ✅ FIX 2: Nombre correcto del método
  const handleSendFriendRequest = async () => {
    setSendingRequest(true);
    try {
      await friendRequestService.sendFriendRequest(userId);
      setFriendRequestStatus('pending');
      showNotification('✅ Solicitud de amistad enviada');
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      showNotification('❌ Error al enviar la solicitud');
    } finally { setSendingRequest(false); }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await friendRequestService.acceptRequest(requestId);
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      showNotification('✅ Solicitud de amistad aceptada');
    } catch { showNotification('❌ Error al aceptar solicitud'); }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await friendRequestService.rejectRequest(requestId);
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      showNotification('✅ Solicitud rechazada');
    } catch { showNotification('❌ Error al rechazar solicitud'); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta publicación?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/posts/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
      setPosts(prev => prev.filter(post => post._id !== postId));
      setPostsCount(prev => prev - 1);
      showNotification('✅ Publicación eliminada');
    } catch { showNotification('❌ Error al eliminar la publicación'); }
  };

  const handleAvatarClick = () => { fileInputRef.current?.click(); };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { showNotification('❌ Solo se permiten imágenes (JPG, PNG, GIF, WEBP)'); e.target.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { showNotification('❌ La imagen no puede superar los 5MB'); e.target.value = ''; return; }
    setIsUploadingAvatar(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { showNotification('❌ No estás autenticado'); window.location.href = '/login'; return; }
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await fetch(`${API}/api/users/avatar`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const data = await response.json();
      if (response.ok && data.success) {
        const avatarUrl = data.avatar.startsWith('http') ? data.avatar : `${API}${data.avatar}`;
        const updatedUser = { ...user, avatar: avatarUrl };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        showNotification('✅ Foto de perfil actualizada');
      } else { showNotification('❌ ' + (data.message || 'Error al subir la imagen')); }
    } catch { showNotification('❌ Error al subir la imagen'); }
    finally { setIsUploadingAvatar(false); e.target.value = ''; }
  };

  const openEditModal = () => {
    if (user) {
      setEditForm({ nombre: user.nombre || user.name || '', email: user.email || '', bio: user.bio || '', telefono: user.telefono || user.phone || '', ubicacion: user.ubicacion || user.location || '' });
    }
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.nombre || !editForm.email) { showNotification('❌ Nombre y email son obligatorios'); return; }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API}/api/users/profile`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editForm.nombre, bio: editForm.bio, telefono: editForm.telefono, ubicacion: editForm.ubicacion })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const updatedUser = data.user;
        if (updatedUser.avatar && !updatedUser.avatar.startsWith('http')) updatedUser.avatar = `${API}${updatedUser.avatar}`;
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowEditModal(false);
        showNotification('✅ Perfil actualizado correctamente');
      } else { showNotification('❌ ' + (data.message || 'Error al actualizar perfil')); }
    } catch { showNotification('❌ Error al actualizar perfil'); }
  };

  const showNotification = (message) => { setNotification(message); setTimeout(() => setNotification(''), 5000); };

  const formatTimeAgo = (date) => {
    if (!date) return 'reciente';
    try {
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);
      if (seconds < 60) return 'hace un momento';
      if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
      if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
      if (seconds < 2592000) return `hace ${Math.floor(seconds / 86400)} d`;
      return `hace ${Math.floor(seconds / 2592000)} m`;
    } catch { return 'reciente'; }
  };

  const getTypeText = (type) => {
    const types = { story: ' Historia', tip: ' Consejo', adoption: ' Adopción', update: 'Actualización', question: ' Pregunta', celebration: ' Celebración' };
    return types[type] || '📝 Publicación';
  };

  const getAvatarFallback = (name) => `${API}/api/avatar/${encodeURIComponent(name || 'U')}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center"><div className="text-6xl mb-4">🔄</div><p className="text-xl text-gray-600">Cargando perfil...</p></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-4">No se encontró el usuario</h3>
          <button onClick={() => navigate(-1)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold">Volver</button>
        </div>
      </div>
    );
  }

  const userName = user.nombre || user.name || 'Usuario';
  const userEmail = user.email || 'email@ejemplo.com';
  const userBio = user.bio || 'Amante de los animales 🐾';
  const avatarUrl = user.avatar || getAvatarFallback(userName);

  return (
    <div className="min-h-screen bg-gray-100">

      <header className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 shadow-lg sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-semibold transition-all duration-200 hover:-translate-x-1 border border-white/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><polyline points="15 18 9 12 15 6" /></svg>
              Volver
            </button>
            <a href="/" className="text-3xl font-bold text-white tracking-tight">🐾 ADOPTAPET</a>
            <ul className="hidden md:flex space-x-8"></ul>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="bg-gradient-to-r from-purple-400 via-purple-700 to-purple-400 rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="relative px-6 py-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-end">
              <div className="relative group">
                <img key={avatarUrl} src={avatarUrl} alt="Foto de perfil"
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = getAvatarFallback(userName); }}
                />
                {isOwnProfile && (
                  <>
                    <div onClick={handleAvatarClick} className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="text-white text-center">
                        <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs font-semibold">{isUploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}</span>
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleAvatarUpload} className="hidden" disabled={isUploadingAvatar} />
                  </>
                )}
              </div>

              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">{userName}</h1>
                <p className="text-purple-100 mb-2">{userEmail}</p>
                <p className="text-white italic">{userBio}</p>
              </div>

              {isOwnProfile ? (
                <button onClick={openEditModal} className="mt-4 sm:mt-0 bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:bg-purple-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  Editar Perfil
                </button>
              ) : (
                <button
                  onClick={handleSendFriendRequest}
                  disabled={sendingRequest || friendRequestStatus === 'pending' || friendRequestStatus === 'friends'}
                  className="mt-4 sm:mt-0 px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:-translate-y-1 hover:shadow-lg disabled:opacity-70"
                  style={{
                    background: friendRequestStatus === 'pending' ? '#9CA3AF' : friendRequestStatus === 'friends' ? '#10B981' : 'white',
                    color: friendRequestStatus === 'none' ? '#7C3AED' : 'white'
                  }}
                >
                  {sendingRequest ? 'Enviando...' :
                   friendRequestStatus === 'pending' ? '⏳ Solicitud enviada' :
                   friendRequestStatus === 'friends' ? '✅ Amigos' :
                   '👤 Agregar amigo'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button onClick={() => setActiveTab('publicaciones')} className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-colors duration-300 whitespace-nowrap ${activeTab === 'publicaciones' ? 'border-purple-600 bg-purple-50 text-gray-700' : 'border-transparent text-gray-500 hover:bg-gray-50'}`}>
              📱 Publicaciones
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'publicaciones' && (
              <div>
                {postsLoading ? (
                  <div className="text-center py-8"><div className="text-4xl mb-4">🔄</div><p className="text-gray-600">Cargando publicaciones...</p></div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{isOwnProfile ? 'No tienes publicaciones aún' : `${userName} no tiene publicaciones aún`}</h3>
                    {isOwnProfile && (
                      <>
                        <p className="text-gray-600 mb-4">Empieza a compartir historias de mascotas</p>
                        <a href="/publicar" className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold">Crear Publicación</a>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <div key={post._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition">
                        <div className="p-4 flex items-center justify-between border-b">
                          <div className="flex items-center gap-3">
                            <img src={post.author?.avatar || avatarUrl} alt={post.author?.nombre || post.author?.name || userName} className="w-10 h-10 rounded-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = getAvatarFallback(userName); }} />
                            <div>
                              <p className="font-semibold">{post.author?.nombre || post.author?.name || userName}</p>
                              <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                            </div>
                          </div>
                          {isOwnProfile && (
                            <button onClick={() => handleDeletePost(post._id)} className="text-gray-400 hover:text-red-500 transition" title="Eliminar">🗑️</button>
                          )}
                        </div>

                        {/* ✅ FIX 3: usar getImageUrl para imágenes del post */}
                        {(() => {
                          const rawImg = post.media?.images?.[0] || post.images?.[0]?.url || post.images?.[0];
                          const imgUrl = getImageUrl(rawImg);
                          return imgUrl ? (
                            <div className="w-full">
                              <img src={imgUrl} alt="Publicación" className="w-full h-auto max-h-96 object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                            </div>
                          ) : null;
                        })()}

                        <div className="p-4">
                          {post.title && <h3 className="text-lg font-bold mb-2">{post.title}</h3>}
                          {post.content && <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>}
                          <span className="inline-block mt-3 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">{getTypeText(post.type)}</span>
                        </div>
                        <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between text-sm">
                          <span className="text-gray-600">❤️ {post.stats?.likes?.length || post.stats?.likesCount || 0} Me gusta</span>
                          <span className="text-gray-600">💬 {post.stats?.commentsCount || 0} Comentarios</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 text-center mt-12">
        <p>&copy; 2025 AdoptaPet. Todos los derechos reservados. Hecho con ❤️ para las mascotas.</p>
      </footer>

      {showEditModal && isOwnProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">✏️ Editar Perfil</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">&times;</button>
            </div>
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="relative inline-block group">
                  <img key={avatarUrl} src={avatarUrl} alt="Foto de perfil" className="w-32 h-32 rounded-full border-4 border-purple-300 object-cover mx-auto" onError={(e) => { e.target.onerror = null; e.target.src = getAvatarFallback(userName); }} />
                  <div onClick={handleAvatarClick} className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="text-white text-center">
                      <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs">Cambiar</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Click en la imagen para cambiar tu foto</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                <input type="text" value={editForm.nombre} onChange={(e) => setEditForm({...editForm, nombre: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Tu nombre completo" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input type="email" value={editForm.email} disabled className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 outline-none" />
                <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Biografía</label>
                <textarea value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} rows={4} maxLength={200} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none" placeholder="Cuéntanos sobre ti..."></textarea>
                <p className="text-sm text-gray-500 mt-1">{editForm.bio.length}/200 caracteres</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                <input type="tel" value={editForm.telefono} onChange={(e) => setEditForm({...editForm, telefono: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="+57 300 123 4567" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación</label>
                <input type="text" value={editForm.ubicacion} onChange={(e) => setEditForm({...editForm, ubicacion: e.target.value})} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" placeholder="Ciudad, País" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors">Cancelar</button>
                <button onClick={handleSaveProfile} className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all hover:shadow-lg">Guardar Cambios</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">{notification}</div>
      )}
    </div>
  );
}

export default Perfil;