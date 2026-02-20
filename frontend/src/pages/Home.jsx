import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import RightSidebar from '../components/common/RightSidebar';

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

        const response = await fetch('http://localhost:5000/api/posts', {
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
        return { ...post, stats: { ...post.stats, likesCount: isLiked ? (post.stats?.likesCount || 0) + 1 : (post.stats?.likesCount || 1) - 1 } };
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

  const handleOpenPublicar = () => navigate('/publicar');

  const userName = currentUser?.nombre || currentUser?.name || 'Tú';
  const userAvatar = currentUser?.avatar;

  return (
    <div className="min-h-screen bg-[#F0EBE3] text-gray-800">
      {/* Google Font import via style tag */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Figtree:wght@300;400;500;600&display=swap');

        .ap-font-display { font-family: 'Syne', sans-serif; }
        .ap-font-body { font-family: 'Figtree', sans-serif; }

        .ap-feed-bg { background-color: #F0EBE3; }

        /* Compose box */
        .ap-compose {
          background: #fff;
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 1px 8px rgba(0,0,0,0.07);
          margin: 0 0 12px 0;
          cursor: pointer;
          transition: box-shadow 0.2s;
        }
        .ap-compose:active { box-shadow: 0 2px 16px rgba(0,0,0,0.12); }

        .ap-compose-avatar {
          width: 42px; height: 42px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          background: #E07B39;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; color: white; font-size: 16px;
        }

        .ap-compose-placeholder {
          flex: 1;
          background: #F0EBE3;
          border-radius: 999px;
          padding: 10px 16px;
          font-size: 14px;
          color: #9C8E84;
          font-family: 'Figtree', sans-serif;
          font-weight: 400;
          border: none;
          pointer-events: none;
        }

        /* Divider de acciones */
        .ap-compose-actions {
          display: flex;
          border-top: 1px solid #F0EBE3;
          margin-top: 12px;
          padding-top: 10px;
          gap: 0;
        }
        .ap-compose-action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 6px 4px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #6B5E56;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          font-family: 'Figtree', sans-serif;
        }
        .ap-compose-action-btn:active { background: #F0EBE3; }

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

              {/* ── Compose box (solo mobile) ── */}
              <div className="md:hidden">
                <div className="ap-compose" onClick={handleOpenPublicar}>
                  {userAvatar ? (
                    <img src={userAvatar} alt={userName} className="ap-compose-avatar" onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="ap-compose-avatar">{userName.charAt(0).toUpperCase()}</div>
                  )}
                  <div className="ap-compose-placeholder">¿Qué quieres compartir?</div>
                </div>

                {/* Acciones rápidas — 2 botones */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <button
                    onClick={handleOpenPublicar}
                    style={{
                      flex: 1, background: 'white', border: 'none',
                      borderRadius: 14, padding: '14px 12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 8, cursor: 'pointer',
                      boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
                      fontFamily: 'Figtree, sans-serif',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 18 }}>✍️</span>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1030', lineHeight: 1.2 }}>Publicación</div>
                      <div style={{ fontSize: 11, color: '#9C8E84', marginTop: 1 }}>Foto o historia</div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/adoptar/crear')}
                    style={{
                      flex: 1, background: 'white', border: 'none',
                      borderRadius: 14, padding: '14px 12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 8, cursor: 'pointer',
                      boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
                      fontFamily: 'Figtree, sans-serif',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'linear-gradient(135deg, #3D9E6E, #20B2AA)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 18 }}>🐾</span>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E1030', lineHeight: 1.2 }}>Adopción</div>
                      <div style={{ fontSize: 11, color: '#9C8E84', marginTop: 1 }}>Dar en adopción</div>
                    </div>
                  </button>
                </div>
              </div>

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
                />
              ))}

              <FeaturedPetsMobile />
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