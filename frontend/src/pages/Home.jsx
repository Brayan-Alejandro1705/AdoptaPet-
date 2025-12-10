import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import RightSidebar from '../components/common/RightSidebar';
import BottomNav from '../components/layout/BottomNav';
import PostCard from '../components/common/PostCard';
import PostModal from '../components/common/PostModal';
import FeaturedPetsMobile from '../components/common/FeaturedPetsMobile';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // ✅ NUEVO: Estados para las publicaciones del backend
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ CAPTURAR TOKEN Y USUARIO DE GOOGLE OAUTH
  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        
        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        console.log('✅ Usuario autenticado con Google:', userData);
        
        // Limpiar la URL (eliminar token y user de la URL)
        navigate('/Home', { replace: true });
        
      } catch (error) {
        console.error('❌ Error al procesar datos de autenticación:', error);
      }
    }
  }, [searchParams, navigate]);

  // ✅ NUEVO: Obtener usuario actual
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error al obtener usuario:', error);
      }
    }
  }, []);

  // ✅ NUEVO: Cargar publicaciones del backend
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
          console.log('✅ Publicaciones cargadas:', data.data.posts);
          setPosts(data.data.posts || []);
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
  }, []); // Se ejecuta una vez al montar el componente

  // ✅ NUEVO: Handlers para PostCard
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

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 text-gray-800 pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto pt-4 md:pt-6 px-3 md:px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          <div className="hidden md:block md:col-span-3">
            <Sidebar onOpenModal={() => setIsModalOpen(true)} />
          </div>

          <main className="col-span-1 md:col-span-6 space-y-4 md:space-y-6">
            
            {/* ✅ NUEVO: Estado de carga */}
            {loading && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-600">Cargando publicaciones...</p>
              </div>
            )}

            {/* ✅ NUEVO: Estado de error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <p className="font-semibold">⚠️ Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* ✅ NUEVO: Mostrar publicaciones del backend */}
            {!loading && !error && posts.length === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  No hay publicaciones aún
                </h3>
                <p className="text-gray-600 mb-6">
                  Sé el primero en compartir algo con la comunidad
                </p>
                <button 
                  onClick={() => navigate('/publicar')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Crear publicación
                </button>
              </div>
            )}

            {/* ✅ ACTUALIZADO: Mostrar publicaciones reales */}
            {!loading && !error && posts.length > 0 && posts.map(post => (
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

          <div className="hidden md:block md:col-span-3">
            <RightSidebar />
          </div>
          
        </div>
      </div>

      <BottomNav onOpenModal={() => setIsModalOpen(true)} />
      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}