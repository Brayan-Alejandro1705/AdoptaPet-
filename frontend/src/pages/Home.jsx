import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import RightSidebar from '../components/common/RightSidebar';

import PostCard from '../components/common/PostCard';


export default function Home() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Capturar token de Google OAuth (CORREGIDO)
  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    
    if (token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        // Usa window.location.href en lugar de navigate para limpiar completamente la URL
        window.location.href = '/home';
      } catch (error) {
        console.error('❌ Error al procesar datos de autenticación:', error);
      }
    }
  }, []);

  // Scroll al post si viene con ?post=ID en la URL
  useEffect(() => {
    const postId = searchParams.get('post');
    if (postId) {
      setTimeout(() => {
        const el = document.getElementById(`post-${postId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.outline = '3px solid #E07B39';
          el.style.borderRadius = '12px';
          setTimeout(() => { el.style.outline = ''; }, 2500);
        }
      }, 1000);
    }
  }, [searchParams, posts]);

  // Obtener usuario actual
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setCurrentUser(JSON.parse(userStr)); }
      catch (error) { console.error('Error al obtener usuario:', error); }
    }
  }, []);

  // Cargar publicaciones
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) { setError('Debes iniciar sesión para ver las publicaciones'); setLoading(false); return; }

        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        const response = await fetch(`${API_BASE}/api/posts`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setPosts(data.data.posts || []);
        } else {
          setError(data.message || 'Error al cargar publicaciones');
        }
      } catch (error) {
        setError('Error de conexión con el servidor');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const handleDelete = (postId) => setPosts(posts.filter(post => post._id !== postId));

  const handleLike = (postId, isLiked) => {
    setPosts(posts.map(post => {
      if (post._id === postId) {
        const currentLikes = post.stats?.likes || [];
        const uid = currentUser?._id || currentUser?.id;
        
        let newLikes = [...currentLikes];
        if (isLiked) {
          if (!newLikes.includes(uid)) newLikes.push(uid);
        } else {
          newLikes = newLikes.filter(id => String(id) !== String(uid));
        }

        return { 
          ...post, 
          stats: { 
            ...post.stats, 
            likes: newLikes,
            likesCount: isLiked ? (post.stats?.likesCount || 0) + 1 : Math.max(0, (post.stats?.likesCount || 1) - 1) 
          } 
        };
      }
      return post;
    }));
  };

  const handleComment = (postId, comment) => {
    setPosts(posts.map(post => {
      if (post._id === postId) {
        return { ...post, comments: [...(post.comments || []), comment], stats: { ...post.stats, commentsCount: (post.stats?.commentsCount || 0) + 1 } };
      }
      return post;
    }));
  };

  const handleRemoveComment = (postId, commentId) => {
    setPosts(posts.map(post => {
      if (post._id === postId) {
        return { 
          ...post, 
          comments: post.comments.filter(c => c._id !== commentId),
          stats: { ...post.stats, commentsCount: Math.max(0, (post.stats?.commentsCount || 1) - 1) }
        };
      }
      return post;
    }));
  };

  const handleRemoveReply = (postId, commentId, replyId) => {
    setPosts(posts.map(post => {
      if (post._id === postId) {
        return {
          ...post,
          comments: post.comments.map(c => {
            if (c._id === commentId) {
              return { ...c, replies: c.replies.filter(r => r._id !== replyId) };
            }
            return c;
          })
        };
      }
      return post;
    }));
  };

  const handleOpenPublicar = () => navigate('/publicar');

  return (
    <div className="min-h-screen bg-[#F0EBE3] text-gray-800">
      {/* Google Font import via style tag */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Figtree:wght@300;400;500;600&display=swap');

        .ap-font-display { font-family: 'Syne', sans-serif; }
        .ap-font-body { font-family: 'Figtree', sans-serif; }

        .ap-feed-bg { background-color: #F0EBE3; }

        /* Skeleton loader */
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .ap-skeleton {
          background: linear-gradient(90deg, #e8e0d8 25%, #f5f0ea 50%, #e8e0d8 75%);
          background-size: 800px 100%;
          animation: shimmer 1.4s ease-in-out infinite;
          border-radius: 12px;
        }

        .ap-skeleton-card {
          background: white;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 1px 8px rgba(0,0,0,0.06);
        }

        /* Error state */
        .ap-error {
          background: #FFF0ED;
          border: 1.5px solid #F4C4B4;
          color: #C0441B;
          padding: 14px 16px;
          border-radius: 14px;
          font-size: 14px;
          font-family: 'Figtree', sans-serif;
          margin-bottom: 12px;
        }

        /* Empty state */
        .ap-empty {
          background: white;
          border-radius: 20px;
          box-shadow: 0 1px 8px rgba(0,0,0,0.06);
          padding: 48px 24px;
          text-align: center;
        }
        .ap-empty-icon { font-size: 52px; margin-bottom: 12px; }
        .ap-empty-title { font-size: 18px; font-weight: 700; color: #3D2E27; margin-bottom: 6px; font-family: 'Syne', sans-serif; }
        .ap-empty-sub { font-size: 13px; color: #9C8E84; margin-bottom: 20px; font-family: 'Figtree', sans-serif; }
        .ap-cta-btn {
          background: #E07B39;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          font-family: 'Figtree', sans-serif;
          transition: background 0.2s, transform 0.1s;
          box-shadow: 0 4px 12px rgba(224,123,57,0.3);
        }
        .ap-cta-btn:active { background: #C96A2A; transform: scale(0.97); }
      `}</style>

      <Header />
      <Sidebar onOpenModal={handleOpenPublicar} />

      <div className="md:ml-64 pb-24 md:pb-8 ap-feed-bg ap-font-body">
        <div className="max-w-5xl mx-auto pt-3 md:pt-6 px-3 md:px-6">
          <div className="flex gap-6">

            {/* Feed principal */}
            <main className="flex-1 min-w-0">

              {/* ── Skeleton loader ── */}
              {loading && (
                <div>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="ap-skeleton-card">
                      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                        <div className="ap-skeleton" style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div className="ap-skeleton" style={{ height: 13, width: '55%', marginBottom: 8 }} />
                          <div className="ap-skeleton" style={{ height: 11, width: '35%' }} />
                        </div>
                      </div>
                      <div className="ap-skeleton" style={{ height: 14, width: '90%', marginBottom: 8 }} />
                      <div className="ap-skeleton" style={{ height: 14, width: '70%', marginBottom: 16 }} />
                      <div className="ap-skeleton" style={{ height: 200, borderRadius: 12 }} />
                    </div>
                  ))}
                </div>
              )}

              {/* ── Error ── */}
              {error && !loading && (
                <div className="ap-error">
                  <p style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Sin conexión</p>
                  <p>{error}</p>
                </div>
              )}

              {/* ── Empty state ── */}
              {!loading && !error && posts.length === 0 && (
                <div className="ap-empty">
                  <div className="ap-empty-icon">🐾</div>
                  <h3 className="ap-empty-title">¡Sé el primero en publicar!</h3>
                  <p className="ap-empty-sub">Comparte fotos, historias y mascotas con la comunidad</p>
                  <button className="ap-cta-btn" onClick={handleOpenPublicar}>Crear publicación</button>
                </div>
              )}

              {/* ── Posts ── */}
              {!loading && !error && posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={currentUser}
                  onDelete={handleDelete}
                  onLike={handleLike}
                  onComment={handleComment}
                  onDeleteComment={handleRemoveComment}
                  onDeleteReply={handleRemoveReply}
                />
              ))}
            </main>

            {/* RightSidebar — solo desktop */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-20">
                <RightSidebar />
              </div>
            </aside>

          </div>
        </div>
      </div>
    </div>
  );
}