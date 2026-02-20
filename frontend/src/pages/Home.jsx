import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import RightSidebar from '../components/common/RightSidebar';
import BottomNav from '../components/layout/BottomNav';
import PostCard from '../components/common/PostCard';
import FeaturedPetsMobile from '../components/common/FeaturedPetsMobile';

export default function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Capturar token de Google OAuth
  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        navigate('/Home', { replace: true });
      } catch (error) {
        console.error('❌ Error al procesar datos de autenticación:', error);
      }
    }
  }, [searchParams, navigate]);

  // Scroll al post si viene con ?post=ID en la URL
  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId) {
      setTimeout(() => {
        const el = document.getElementById(`post-${postId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.outline = '3px solid #7C3AED';
          el.style.borderRadius = '8px';
          setTimeout(() => { el.style.outline = ''; }, 2500);
        }
      }, 1000);
    }
  }, [searchParams, posts]);

  // Obtener usuario actual
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (error) {
        console.error('Error al obtener usuario:', error);
      }
    }
  }, []);

  // Cargar publicaciones
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Debes iniciar sesión para ver las publicaciones');
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:5000/api/posts', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setPosts(data.data.posts || []);
          console.log('✅ Publicaciones cargadas:', data.data.posts);
        } else {
          setError(data.message || 'Error al cargar publicaciones');
        }
      } catch (error) {
        console.error('❌ Error al cargar publicaciones:', error);
        setError('Error de conexión con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDelete = (postId) => {
    setPosts(posts.filter(post => post._id !== postId));
  };

  const handleLike = (postId, isLiked) => {
    setPosts(posts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          stats: {
            ...post.stats,
            likesCount: isLiked
              ? (post.stats?.likesCount || 0) + 1
              : (post.stats?.likesCount || 1) - 1
          }
        };
      }
      return post;
    }));
  };

  const handleComment = (postId, comment) => {
    setPosts(posts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          comments: [...(post.comments || []), comment],
          stats: {
            ...post.stats,
            commentsCount: (post.stats?.commentsCount || 0) + 1
          }
        };
      }
      return post;
    }));
  };

  // Navegar a publicar en lugar de abrir modal viejo
  const handleOpenPublicar = () => navigate('/publicar');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800">
      <Header />

      <Sidebar onOpenModal={handleOpenPublicar} />

      <div className="md:ml-64 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto pt-4 md:pt-6 px-3 md:px-6">
          <div className="flex gap-6">

            {/* Feed principal */}
            <main className="flex-1 min-w-0 space-y-3 md:space-y-4">

              {loading && (
                <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
                  <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mb-3"></div>
                  <p className="text-gray-500 text-sm">Cargando publicaciones...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  <p className="font-semibold text-sm">⚠️ Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {!loading && !error && posts.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
                  <div className="text-5xl mb-3">📝</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">No hay publicaciones aún</h3>
                  <p className="text-gray-500 text-sm mb-5">Sé el primero en compartir algo con la comunidad</p>
                  <button
                    onClick={handleOpenPublicar}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all text-sm"
                  >
                    Crear publicación
                  </button>
                </div>
              )}

              {!loading && !error && posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={currentUser}
                  onDelete={handleDelete}
                  onLike={handleLike}
                  onComment={handleComment}
                />
              ))}

              <FeaturedPetsMobile />
            </main>

            {/* RightSidebar */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-20">
                <RightSidebar />
              </div>
            </aside>

          </div>
        </div>
      </div>

      <BottomNav onOpenModal={handleOpenPublicar} />
      {/* PostModal eliminado — ahora se usa /publicar */}
    </div>
  );
}