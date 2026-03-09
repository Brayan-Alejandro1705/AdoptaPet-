import { useState, useEffect } from 'react';
import axios from 'axios';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Favoritos() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    cargarFavoritos();
  }, []);

  const cargarFavoritos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/favoritos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setFavorites(response.data.data || []);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('❌ Error al cargar favoritos:', err);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id) => {
    setRemovingId(id);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/favoritos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeout(() => {
        setFavorites(prev => prev.filter(post => post._id !== id));
        setRemovingId(null);
      }, 500);
      showNotification('Eliminado de favoritos 💔');
    } catch (err) {
      console.error('Error al eliminar favorito:', err);
      setRemovingId(null);
      showNotification('❌ Error al eliminar favorito');
    }
  };

  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
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
    } catch { return 'reciente'; }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-8">
      <Header />

      <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

          {/* SIDEBAR */}
          <div className="hidden md:block md:col-span-3">
            <Sidebar />
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <main className="col-span-1 md:col-span-9">

            <div className="flex items-center gap-3 mb-5">
              <span className="text-4xl">❤️</span>
              <h2 className="text-2xl md:text-3xl font-bold bg-black bg-clip-text text-transparent">
                Mis Favoritos
              </h2>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔄</div>
                <p className="text-gray-600">Cargando favoritos...</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
                <div className="text-8xl mb-4">💔</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No tienes favoritos aún</h3>
                <p className="text-gray-600 mb-6">Explora y guarda las publicaciones que más te gusten</p>
                <a
                  href="/adoptar"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Explorar mascotas
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.map(post => (
                  <div
                    key={post._id}
                    className={`bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all ${
                      removingId === post._id ? 'opacity-0 scale-95' : ''
                    }`}
                    style={{ transition: 'opacity 0.5s, transform 0.5s' }}
                  >
                    {/* Header del post */}
                    <div className="p-4 flex items-center justify-between border-b">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.author?.avatar || `${API}/api/avatar/${encodeURIComponent(post.author?.nombre || post.author?.name || 'U')}`}
                          alt={post.author?.nombre || post.author?.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.nombre || 'U')}&background=random`; }}
                        />
                        <div>
                          <p className="font-semibold">{post.author?.nombre || post.author?.name || 'Usuario'}</p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                        </div>
                      </div>
                      {/* Botón quitar favorito */}
                      <button
                        onClick={() => handleRemoveFavorite(post._id)}
                        className="text-red-400 hover:text-red-600 transition text-2xl"
                        title="Quitar de favoritos"
                      >
                        💔
                      </button>
                    </div>

                    {/* Imagen del post */}
                    {post.media?.images && post.media.images.length > 0 && (
                      <img
                        src={`${API}${post.media.images[0]}`}
                        alt="Publicación"
                        className="w-full h-auto max-h-96 object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      />
                    )}
                    {!post.media?.images && post.images && post.images.length > 0 && (
                      <img
                        src={`${API}${post.images[0].url || post.images[0]}`}
                        alt="Publicación"
                        className="w-full h-auto max-h-96 object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                      />
                    )}

                    {/* Contenido */}
                    <div className="p-4">
                      {post.title && <h3 className="text-lg font-bold mb-2">{post.title}</h3>}
                      {post.content && <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between text-sm">
                      <span className="text-gray-600">❤️ {post.stats?.likes?.length || post.stats?.likesCount || 0} Me gusta</span>
                      <span className="text-gray-600">💬 {post.stats?.commentsCount || 0} Comentarios</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      <BottomNav />

      <style>{`
        @keyframes fade-out {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.8); }
        }
        .animate-fade-out {
          animation: fade-out 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}