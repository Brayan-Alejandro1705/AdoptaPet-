import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, deleted, moderated
  const [stats, setStats] = useState({ total: 0, active: 0, deleted: 0, moderated: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Verificar autenticación y permisos
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) {
      alert('Debes iniciar sesión');
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setCurrentUser(userData);

      // Verificar si es admin o superadmin
      if (userData.role !== 'admin' && userData.role !== 'superadmin') {
        alert('No tienes permisos de administrador');
        navigate('/');
      }
    } catch (error) {
      console.error('Error al obtener usuario:', error);
      navigate('/login');
    }
  }, [navigate]);

  // Cargar publicaciones
  useEffect(() => {
    if (currentUser) {
      fetchPosts();
    }
  }, [filter, currentPage, currentUser]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/posts/admin/all?filter=${filter}&page=${currentPage}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        setPosts(data.data.posts);
        setStats(data.data.stats);
        setTotalPages(data.data.pagination.pages);
      } else {
        alert('Error al cargar publicaciones: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleModeratePost = async (postId) => {
    const reason = prompt('¿Razón de la moderación? (opcional)');

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/posts/admin/${postId}/moderate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason: reason || 'Moderado por administrador' })
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Publicación moderada exitosamente');
        fetchPosts();
      } else {
        alert(data.message || 'Error al moderar publicación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al moderar publicación');
    }
  };

  const handleRestorePost = async (postId) => {
    if (!confirm('¿Deseas restaurar esta publicación?')) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/posts/admin/${postId}/restore`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Publicación restaurada exitosamente');
        fetchPosts();
      } else {
        alert(data.message || 'Error al restaurar publicación');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al restaurar publicación');
    }
  };

  const handlePermanentDelete = async (postId) => {
    const confirmation = prompt(
      'Esta acción es IRREVERSIBLE. Escribe "ELIMINAR PERMANENTEMENTE" para confirmar:'
    );

    if (confirmation !== 'ELIMINAR PERMANENTEMENTE') {
      alert('Acción cancelada');
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/posts/admin/${postId}/permanent`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        alert('Publicación eliminada permanentemente');
        fetchPosts();
      } else {
        alert(data.message || 'Error al eliminar permanentemente');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar permanentemente');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Cargando panel de administración...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">🛡️ Panel de Moderación</h1>
              <p className="text-purple-100">
                Administrador: {currentUser?.name || currentUser?.nombre} 
                <span className="ml-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                  {currentUser?.role === 'superadmin' ? '👑 SuperAdmin' : '🛡️ Admin'}
                </span>
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-all"
            >
              ← Volver al inicio
            </button>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.total}</div>
              <div className="text-sm text-purple-100">Total</div>
            </div>
            <div className="bg-green-500/30 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.active}</div>
              <div className="text-sm text-green-100">Activas</div>
            </div>
            <div className="bg-red-500/30 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.deleted}</div>
              <div className="text-sm text-red-100">Eliminadas</div>
            </div>
            <div className="bg-orange-500/30 backdrop-blur-md rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{stats.moderated}</div>
              <div className="text-sm text-orange-100">Moderadas</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-3">
            {['all', 'active', 'deleted', 'moderated'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  filter === f
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' && '📋 Todas'}
                {f === 'active' && '✅ Activas'}
                {f === 'deleted' && '❌ Eliminadas'}
                {f === 'moderated' && '🚫 Moderadas'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de publicaciones */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-xl text-gray-600">No hay publicaciones para mostrar</p>
            </div>
          ) : (
            posts.map(post => (
              <div
                key={post._id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-2xl ${
                  post.status === 'deleted' ? 'border-2 border-red-500' : ''
                }`}
              >
                {/* Header del post */}
                <div className="p-6 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <img
                        src={post.author?.avatar || 'https://via.placeholder.com/50'}
                        alt={post.author?.name || post.author?.nombre}
                        className="w-12 h-12 rounded-full border-2 border-purple-500"
                      />
                      <div>
                        <h3 className="font-bold text-lg">
                          {post.author?.name || post.author?.nombre}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    {post.status === 'deleted' && (
                      <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-semibold">
                        ❌ ELIMINADA
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenido del post */}
                <div className="p-6">
                  <p className="text-gray-700 mb-4">{post.content}</p>

                  {/* Imágenes */}
                  {post.media?.images && post.media.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {post.media.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={`http://localhost:5000${img}`}
                          alt="Post"
                          className="rounded-lg w-full h-48 object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {/* Estadísticas */}
                  <div className="flex gap-6 text-sm text-gray-600 py-4 border-t border-b">
                    <span>❤️ {post.stats?.likes?.length || 0} likes</span>
                    <span>💬 {post.comments?.length || 0} comentarios</span>
                  </div>

                  {/* Información de moderación */}
                  {post.moderationReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                      <p className="text-red-700 font-semibold mb-1">
                        🚫 Razón de moderación:
                      </p>
                      <p className="text-red-600">{post.moderationReason}</p>
                      {post.moderatedBy && (
                        <p className="text-sm text-red-500 mt-2">
                          Moderado por: {post.moderatedBy.name || post.moderatedBy.nombre}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-3 mt-6">
                    {post.status !== 'deleted' ? (
                      <button
                        onClick={() => handleModeratePost(post._id)}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        🚫 Moderar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRestorePost(post._id)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        ♻️ Restaurar
                      </button>
                    )}

                    {currentUser?.role === 'superadmin' && (
                      <button
                        onClick={() => handlePermanentDelete(post._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                      >
                        🗑️ Eliminar Permanentemente
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8 bg-white rounded-xl shadow-lg p-4">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
              }`}
            >
              ← Anterior
            </button>
            <span className="text-gray-700 font-semibold">
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
              }`}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}