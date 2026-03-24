import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import { MapPin, Heart } from 'lucide-react';
import PostCard from '../components/common/PostCard';
import PetModal from '../components/common/PetModal';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Favoritos() {
  const navigate = useNavigate();
  const [tab, setTab]           = useState('mascotas'); // 'mascotas' | 'posts'
  const [pets, setPets]         = useState([]);
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => { cargarTodo(); }, []);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || 'null');
      setCurrentUser(u);
    } catch { setCurrentUser(null); }
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [petsRes, postsRes] = await Promise.all([
        axios.get(`${API}/api/favoritos/pets`,   { headers }).catch(() => ({ data: { success: false } })),
        axios.get(`${API}/api/favoritos`,        { headers }).catch(() => ({ data: { success: false } })),
      ]);
      
      // Format pets data
      const formattedPets = petsRes.data.success ? (petsRes.data.data || []).map(pet => ({
        ...pet,
        ageFormatted: pet.age ? `${pet.age.value} ${pet.age.unit}` : 'Desconocida',
        sizeFormatted: pet.size ? (pet.size.charAt(0).toUpperCase() + pet.size.slice(1)) : 'Mediano'
      })) : [];
      
      setPets(formattedPets);
      setPosts(postsRes.data.success ? postsRes.data.data || [] : []);
    } catch (err) {
      console.error('Error cargando favoritos:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Quitar mascota de favoritos
  const removePet = async (petId) => {
    setRemovingId(petId);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/favoritos/pet/${petId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeout(() => {
        setPets(prev => prev.filter(p => (p._id || p.id) !== petId));
        setRemovingId(null);
      }, 400);
    } catch (err) {
      console.error('Error al quitar mascota de favoritos:', err);
      setRemovingId(null);
    }
  };

  // ── Quitar post de favoritos
  const removePost = async (postId) => {
    setRemovingId(postId);
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/api/favoritos/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeout(() => {
        setPosts(prev => prev.filter(p => p._id !== postId));
        setRemovingId(null);
      }, 400);
    } catch (err) {
      console.error('Error al quitar post de favoritos:', err);
      setRemovingId(null);
    }
  };

  const timeAgo = (date) => {
    if (!date) return 'reciente';
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)    return 'hace un momento';
    if (s < 3600)  return `hace ${Math.floor(s / 60)} min`;
    if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
    return `hace ${Math.floor(s / 86400)} d`;
  };

  const isEmpty = tab === 'mascotas' ? pets.length === 0 : posts.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-8">
      <Header />

      <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">

          <div className="hidden md:block md:col-span-3"><Sidebar /></div>

          <main className="col-span-1 md:col-span-9">

            {/* Título */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-4xl">❤️</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Mis Favoritos</h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setTab('mascotas')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  tab === 'mascotas'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                🐾 Mascotas
                {pets.length > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === 'mascotas' ? 'bg-white/30' : 'bg-purple-100 text-purple-700'}`}>
                    {pets.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab('posts')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  tab === 'posts'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                📝 Publicaciones
                {posts.length > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${tab === 'posts' ? 'bg-white/30' : 'bg-purple-100 text-purple-700'}`}>
                    {posts.length}
                  </span>
                )}
              </button>
            </div>

            {/* Contenido */}
            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin text-5xl mb-4">🔄</div>
                <p className="text-gray-500">Cargando favoritos...</p>
              </div>
            ) : isEmpty ? (
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
                <div className="text-7xl mb-4">{tab === 'mascotas' ? '🐾' : '📝'}</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {tab === 'mascotas' ? 'No tienes mascotas favoritas' : 'No tienes publicaciones favoritas'}
                </h3>
                <p className="text-gray-500 mb-6">Dale ❤️ a las {tab === 'mascotas' ? 'mascotas' : 'publicaciones'} que más te gusten</p>
                <a
                  href={tab === 'mascotas' ? '/adoptar' : '/home'}
                  className="inline-block px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {tab === 'mascotas' ? 'Explorar mascotas' : 'Ver publicaciones'}
                </a>
              </div>
            ) : tab === 'mascotas' ? (

              /* ── GRID DE MASCOTAS ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pets.map(pet => {
                  const id       = pet._id || pet.id;
                  const photo    = pet.mainPhoto || pet.photos?.[0] || null;
                  const removing = removingId === id;
                  return (
                    <div
                      key={id}
                      className={`bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 ${removing ? 'opacity-0 scale-95' : ''}`}
                      style={{ transition: 'opacity 0.4s, transform 0.4s' }}
                    >
                      {/* Imagen */}
                      <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100">
                        {photo ? (
                          <img src={photo} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                            <span className="text-4xl">🐾</span>
                            <span className="text-xs text-gray-400">Sin foto</span>
                          </div>
                        )}
                        {/* Badge estado */}
                        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold text-white ${pet.status === 'disponible' ? 'bg-green-500' : 'bg-gray-500'}`}>
                          {pet.status === 'disponible' ? 'Disponible' : pet.status}
                        </span>
                        {/* Quitar favorito */}
                        <button
                          onClick={() => removePet(id)}
                          className="absolute top-2 left-2 p-1.5 rounded-full bg-white shadow hover:bg-red-50 transition"
                          title="Quitar de favoritos"
                        >
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-800 text-lg">{pet.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{pet.breed || 'Mestizo'} · {pet.gender === 'macho' ? '♂️ Macho' : pet.gender === 'hembra' ? '♀️ Hembra' : ''}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {pet.species && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{pet.species}</span>}
                          {pet.sizeFormatted || pet.size ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{pet.sizeFormatted || pet.size}</span> : null}
                          {pet.ageFormatted ? <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">{pet.ageFormatted}</span> : null}
                        </div>
                        {pet.location?.city && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                            <MapPin className="w-3 h-3" />{pet.location.city}
                          </p>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedPet(pet); }}
                          className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:shadow-md transition"
                        >
                          Ver detalles
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

            ) : (

              /* ── LISTA DE POSTS — usa PostCard igual que el feed ── */
              <div className="space-y-3">
                {currentUser && posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUser={currentUser}
                    onDelete={(id) => setPosts(prev => prev.filter(p => p._id !== id))}
                    onLike={(id, isLiked) => {
                      setPosts(prev => prev.map(p => {
                        if (p._id === id) {
                          const currentLikes = p.stats?.likes || [];
                          const uid = currentUser?._id || currentUser?.id;
                          let newLikes = [...currentLikes];
                          if (isLiked) {
                            if (!newLikes.includes(uid)) newLikes.push(uid);
                          } else {
                            newLikes = newLikes.filter(lid => String(lid) !== String(uid));
                          }
                          return { ...p, stats: { ...p.stats, likes: newLikes, likesCount: isLiked ? (p.stats?.likesCount || 0) + 1 : Math.max(0, (p.stats?.likesCount || 1) - 1) } };
                        }
                        return p;
                      }));
                    }}
                    onComment={(id, comment) => {
                      setPosts(prev => prev.map(p => {
                        if (p._id === id) {
                          return { ...p, comments: [...(p.comments || []), comment], stats: { ...p.stats, commentsCount: (p.stats?.commentsCount || 0) + 1 } };
                        }
                        return p;
                      }));
                    }}
                    onDeleteComment={(id, commentId) => {
                      setPosts(prev => prev.map(p => {
                        if (p._id === id) {
                          return { ...p, comments: p.comments.filter(c => c._id !== commentId), stats: { ...p.stats, commentsCount: Math.max(0, (p.stats?.commentsCount || 1) - 1) } };
                        }
                        return p;
                      }));
                    }}
                    onDeleteReply={(id, commentId, replyId) => {
                      setPosts(prev => prev.map(p => {
                        if (p._id === id) {
                          return { ...p, comments: p.comments.map(c => {
                            if (c._id === commentId) {
                              return { ...c, replies: c.replies.filter(r => r._id !== replyId) };
                            }
                            return c;
                          })};
                        }
                        return p;
                      }));
                    }}
                  />
                ))}
              </div>

            )}
          </main>
        </div>
      </div>

      <BottomNav />

      {selectedPet && (
        <PetModal pet={selectedPet} onClose={() => setSelectedPet(null)} />
      )}
    </div>
  );
}