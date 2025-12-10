import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function Perfil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('publicaciones');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: '',
    email: '',
    bio: '',
    telefono: '',
    ubicacion: ''
  });
  const [notification, setNotification] = useState('');
  
  // Estados para publicaciones
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsCount, setPostsCount] = useState(0);

  // Estados para upload de avatar
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    cargarPerfil();
  }, []);

  useEffect(() => {
    if (activeTab === 'publicaciones' && user) {
      cargarPublicaciones();
    }
  }, [activeTab, user]);

  const cargarPerfil = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        throw new Error('Error al cargar el perfil');
      }

      const data = await response.json();
      console.log('📥 Datos del perfil desde backend:', data);
      
      const userData = data.user || data;
      
      // ✅ CORRECCIÓN: Asegurar que el avatar tenga la URL completa
      if (userData.avatar && !userData.avatar.startsWith('http')) {
        userData.avatar = `http://127.0.0.1:5000${userData.avatar}`;
      }
      
      console.log('👤 Usuario cargado:', {
        email: userData.email,
        avatar: userData.avatar
      });
      
      setUser(userData);
      // Actualizar localStorage con los datos frescos del backend
      localStorage.setItem('user', JSON.stringify(userData));
      
    } catch (err) {
      console.error('❌ Error al cargar perfil:', err);
      setError(err.message);
      
      // Fallback: intentar usar datos de localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Asegurar URL completa del avatar
          if (userData.avatar && !userData.avatar.startsWith('http')) {
            userData.avatar = `http://127.0.0.1:5000${userData.avatar}`;
          }
          setUser(userData);
          setError('');
        } catch (parseError) {
          console.error('Error al parsear usuario de localStorage:', parseError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const cargarPublicaciones = async () => {
    setPostsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://127.0.0.1:5000/api/posts/user/my-posts',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log('📦 Respuesta del servidor:', response.data);
      
      if (response.data.success && response.data.data) {
        const postsArray = response.data.data.posts || [];
        console.log('✅ Posts encontrados:', postsArray.length);
        setPosts(postsArray);
        setPostsCount(postsArray.length);
      } else {
        setPosts([]);
        setPostsCount(0);
      }
    } catch (err) {
      console.error('❌ Error al cargar publicaciones:', err);
      setPosts([]);
      setPostsCount(0);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta publicación?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://127.0.0.1:5000/api/posts/${postId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setPosts(prev => prev.filter(post => post._id !== postId));
      setPostsCount(prev => prev - 1);
      showNotification('✅ Publicación eliminada');
    } catch (err) {
      console.error('Error al eliminar:', err);
      showNotification('❌ Error al eliminar la publicación');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    
    if (!file) return;

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      showNotification('❌ Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
      e.target.value = '';
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('❌ La imagen no puede superar los 5MB');
      e.target.value = '';
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        showNotification('❌ No estás autenticado. Por favor inicia sesión.');
        window.location.href = '/login';
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      console.log('📤 Enviando avatar al servidor...');

      const response = await fetch('http://127.0.0.1:5000/api/users/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('📡 Respuesta del servidor:', response.status);

      const data = await response.json();
      console.log('📦 Datos recibidos:', data);

      if (response.ok && data.success) {
        // ✅ Construir URL completa del avatar
        const avatarUrl = data.avatar.startsWith('http') 
          ? data.avatar 
          : `http://127.0.0.1:5000${data.avatar}`;
        
        console.log('🖼️ Nueva URL del avatar:', avatarUrl);
        
        // Actualizar estado del usuario
        const updatedUser = {
          ...user,
          avatar: avatarUrl
        };
        
        setUser(updatedUser);
        
        // ✅ IMPORTANTE: Actualizar localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        showNotification('✅ Foto de perfil actualizada correctamente');
        
        // Forzar recarga de la imagen agregando timestamp
        const img = new Image();
        img.src = avatarUrl + '?t=' + Date.now();
        
      } else {
        showNotification('❌ ' + (data.message || 'Error al subir la imagen'));
      }
    } catch (error) {
      console.error('❌ Error completo:', error);
      showNotification('❌ Error al subir la imagen. Revisa la consola para más detalles.');
    } finally {
      setIsUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const openEditModal = () => {
    if (user) {
      setEditForm({
        nombre: user.nombre || user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        telefono: user.telefono || user.phone || '',
        ubicacion: user.ubicacion || user.location || ''
      });
    }
    setShowEditModal(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (!editForm.nombre || !editForm.email) {
      showNotification('❌ Nombre y email son obligatorios');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://127.0.0.1:5000/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: editForm.nombre,
          bio: editForm.bio,
          telefono: editForm.telefono,
          ubicacion: editForm.ubicacion
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedUser = data.user;
        
        // Asegurar URL completa del avatar
        if (updatedUser.avatar && !updatedUser.avatar.startsWith('http')) {
          updatedUser.avatar = `http://127.0.0.1:5000${updatedUser.avatar}`;
        }
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowEditModal(false);
        showNotification('✅ Perfil actualizado correctamente');
      } else {
        showNotification('❌ ' + (data.message || 'Error al actualizar perfil'));
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      showNotification('❌ Error al actualizar perfil');
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 5000);
  };

  const formatTimeAgo = (date) => {
    if (!date) return 'reciente';
    try {
      const seconds = Math.floor((new Date() - new Date(date)) / 1000);
      if (seconds < 60) return 'hace un momento';
      if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
      if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)} h`;
      if (seconds < 2592000) return `hace ${Math.floor(seconds / 86400)} d`;
      return `hace ${Math.floor(seconds / 2592000)} m`;
    } catch {
      return 'reciente';
    }
  };

  const getTypeText = (type) => {
    const types = {
      story: '📖 Historia',
      tip: '💡 Consejo',
      adoption: '🏠 Adopción',
      update: '📢 Actualización',
      question: '❓ Pregunta',
      celebration: '🎉 Celebración'
    };
    return types[type] || '📝 Publicación';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔄</div>
          <p className="text-xl text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-4">No se encontró el usuario</h3>
          <button 
            onClick={handleLogout}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700">
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  const userName = user.nombre || user.name || 'Usuario';
  const userEmail = user.email || 'email@ejemplo.com';
  const userBio = user.bio || 'Amante de los animales 🐾';
  
  // ✅ CORRECCIÓN: Siempre usar el avatar del usuario si existe
  const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=200&background=random`;
  
  console.log('🖼️ Avatar a mostrar:', avatarUrl);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 shadow-lg sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <a href="/" className="text-3xl font-bold text-white tracking-tight">
              🐾 ADOPTAPET
            </a>
            <ul className="hidden md:flex space-x-8">
              <li><a href="/" className="text-white font-medium hover:-translate-y-1 transition-transform duration-300 inline-block">Inicio</a></li>
              <li>
                <button 
                  onClick={handleLogout}
                  className="text-white font-medium hover:-translate-y-1 transition-transform duration-300 inline-block">
                  Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="h-48 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700"></div>
          
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20">
              <div className="relative group">
                <img 
                  key={avatarUrl} 
                  src={avatarUrl}
                  alt="Foto de perfil" 
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg object-cover"
                  onError={(e) => {
                    console.error('❌ Error al cargar imagen:', avatarUrl);
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=200&background=random`;
                  }}
                  crossOrigin="anonymous"
                />
                
                <div 
                  onClick={handleAvatarClick}
                  className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="text-white text-center">
                    <svg className="w-8 h-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-semibold">
                      {isUploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
                    </span>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
              </div>
              
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{userName}</h1>
                <p className="text-gray-600 mb-2">{userEmail}</p>
                <p className="text-gray-700 italic">{userBio}</p>
              </div>
              
              <button 
                onClick={openEditModal}
                className="mt-4 sm:mt-0 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-2 rounded-full font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                Editar Perfil
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-8 text-center">
              <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105">
                <div className="text-4xl font-bold text-cyan-600 mb-2">8</div>
                <div className="text-sm font-semibold text-gray-700">Favoritos</div>
              </div>
              <div 
                onClick={() => setActiveTab('publicaciones')}
                className="bg-pink-50 rounded-xl p-4 cursor-pointer hover:bg-pink-100 transition">
                <div className="text-3xl font-bold text-pink-600">{postsCount}</div>
                <div className="text-sm text-gray-600">Publicaciones</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('publicaciones')}
              className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-colors duration-300 ${
                activeTab === 'publicaciones' 
                  ? 'border-purple-600 bg-purple-50 text-gray-700' 
                  : 'border-transparent text-gray-500 hover:bg-gray-50'
              }`}>
              📱 Publicaciones
            </button>
            <button 
              onClick={() => setActiveTab('solicitudes')}
              className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-colors duration-300 ${
                activeTab === 'solicitudes' 
                  ? 'border-purple-600 bg-purple-50 text-gray-700' 
                  : 'border-transparent text-gray-500 hover:bg-gray-50'
              }`}>
              📋 Solicitudes
            </button>
            <button 
              onClick={() => setActiveTab('historial')}
              className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-colors duration-300 ${
                activeTab === 'historial' 
                  ? 'border-purple-600 bg-purple-50 text-gray-700' 
                  : 'border-transparent text-gray-500 hover:bg-gray-50'
              }`}>
              🕐 Historial
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'publicaciones' && (
              <div>
                {postsLoading ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🔄</div>
                    <p className="text-gray-600">Cargando publicaciones...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">No tienes publicaciones aún</h3>
                    <p className="text-gray-600 mb-4">Empieza a compartir historias de mascotas</p>
                    <a 
                      href="/publicar"
                      className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600">
                      Crear Publicación
                    </a>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map(post => (
                      <div key={post._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition">
                        <div className="p-4 flex items-center justify-between border-b">
                          <div className="flex items-center gap-3">
                            <img 
                              src={post.author?.avatar || avatarUrl}
                              alt={post.author?.name || userName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                              <p className="font-semibold">{post.author?.name || userName}</p>
                              <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            className="text-gray-400 hover:text-red-500 transition"
                            title="Eliminar publicación"
                          >
                            🗑️
                          </button>
                        </div>

                        {post.images && post.images.length > 0 && (
                          <div className="w-full">
                            <img 
                              src={`http://127.0.0.1:5000${post.images[0].url || post.images[0]}`}
                              alt="Publicación"
                              className="w-full h-auto max-h-96 object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        <div className="p-4">
                          {post.title && (
                            <h3 className="text-lg font-bold mb-2">{post.title}</h3>
                          )}
                          {post.content && (
                            <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                          )}

                          <span className="inline-block mt-3 px-3 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                            {getTypeText(post.type)}
                          </span>

                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {post.tags.map((tag, idx) => (
                                <span key={idx} className="text-sm text-purple-600">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {post.location && (post.location.city || post.location.country) && (
                            <p className="mt-2 text-sm text-gray-500">
                              📍 {post.location.city}{post.location.country && `, ${post.location.country}`}
                            </p>
                          )}
                        </div>

                        <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between text-sm">
                          <span className="text-gray-600">❤️ {post.stats?.likesCount || 0} Me gusta</span>
                          <span className="text-gray-600">💬 {post.stats?.commentsCount || 0} Comentarios</span>
                          <span className="text-gray-600">🔗 {post.stats?.sharesCount || 0} Compartidos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'solicitudes' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-gray-100 transition-all duration-300">
                  <img 
                    src="https://ui-avatars.com/api/?name=Maria+Garcia&size=80&background=random"
                    alt="Usuario" 
                    className="w-16 h-16 rounded-full border-2 border-purple-300"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">María García</h3>
                    <p className="text-gray-600 text-sm">Interesada en adoptar a <span className="font-semibold">Luna</span></p>
                    <p className="text-gray-500 text-xs mt-1">Hace 2 horas</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300">
                      Aceptar
                    </button>
                    <button className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300">
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'historial' && (
              <div className="space-y-4">
                <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">✅</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">Adopción exitosa</h3>
                      <p className="text-gray-700">Michi fue adoptado por Ana Martínez</p>
                      <p className="text-gray-500 text-sm mt-2">15 de Octubre, 2024</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 text-center mt-12">
        <p>&copy; 2025 AdoptaPet. Todos los derechos reservados. Hecho con ❤️ para las mascotas.</p>
      </footer>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">✏️ Editar Perfil</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none">
                &times;
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="relative inline-block group">
                  <img 
                    key={avatarUrl}
                    src={avatarUrl}
                    alt="Foto de perfil" 
                    className="w-32 h-32 rounded-full border-4 border-purple-300 object-cover mx-auto"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=200&background=random`;
                    }}
                  />
                  
                  <div 
                    onClick={handleAvatarClick}
                    className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <div className="text-white text-center">
                      <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs">Cambiar</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Click en la imagen para cambiar tu foto
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                <input 
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input 
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="tu@email.com"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Biografía</label>
                <textarea 
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  rows={4}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  placeholder="Cuéntanos sobre ti..."></textarea>
                <p className="text-sm text-gray-500 mt-1">
                  {editForm.bio.length}/200 caracteres
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                <input 
                  type="tel"
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({...editForm, telefono: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación</label>
                <input 
                  type="text"
                  value={editForm.ubicacion}
                  onChange={(e) => setEditForm({...editForm, ubicacion: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Ciudad, País"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors">
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all hover:shadow-lg">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          {notification}
        </div>
      )}
    </div>
  );
}

export default Perfil;