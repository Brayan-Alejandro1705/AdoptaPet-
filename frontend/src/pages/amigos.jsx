import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import FriendCard from '../components/common/FriendCard';
import ProfileModal from '../components/common/ProfileModal';
import MessageModal from '../components/common/MessageModal';
import { Users, UserPlus, X } from 'lucide-react';
import { friendRequestService } from '../services/friendRequestService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Amigos() {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageModalFriend, setMessageModalFriend] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sugerencias
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState({}); // { userId: 'sent' | 'dismissed' }

  const navigate = useNavigate();

  useEffect(() => {
    loadFriends();
    loadSuggestions();
  }, []);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const response = await friendRequestService.getFriends();
      const friendsData = response.data || [];
      const formattedFriends = friendsData.map(friend => ({
        id: friend.id || friend._id,
        _id: friend.id || friend._id,
        name: friend.name || friend.nombre || 'Usuario',
        online: false,
        lastSeen: 'hace un momento',
        mutualFriends: 0,
        location: friend.location?.city || 'Sin ubicación',
        friendsSince: friend.createdAt
          ? new Date(friend.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
          : 'Reciente',
        bio: friend.bio || 'Sin biografía',
        interests: friend.interests || [],
        avatar: friend.avatar,
      }));
      setFriends(formattedFriends);
    } catch (error) {
      console.error('Error al cargar amigos:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const currentUserId = String(currentUser.id || currentUser._id || '');

      // Traer todos los usuarios y los amigos actuales en paralelo
      const [usersRes, friendsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/api/users/suggestions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        friendRequestService.getFriends(),
      ]);

      let allUsers = [];
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        allUsers = await usersRes.value.json();
        if (!Array.isArray(allUsers)) allUsers = allUsers.users || allUsers.data || [];
      }

      // IDs de amigos actuales para filtrar
      const friendIds = new Set();
      if (friendsRes.status === 'fulfilled') {
        const fd = friendsRes.value?.data || friendsRes.value || [];
        fd.forEach(f => friendIds.add(String(f.id || f._id)));
      }

      // Filtrar: no soy yo, no es ya amigo
      const filtered = allUsers
        .filter(u => {
          const uid = String(u._id || u.id);
          return uid !== currentUserId && !friendIds.has(uid);
        })
        .slice(0, 12) // máximo 12 sugerencias
        .map(u => ({
          id: String(u._id || u.id),
          name: u.nombre || u.name || 'Usuario',
          avatar: u.avatar || null,
          bio: u.bio || 'Miembro de AdoptaPet',
          location: u.location?.city || u.ubicacion || '',
        }));

      setSuggestions(filtered);
    } catch (error) {
      console.error('Error al cargar sugerencias:', error);
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendRequestService.sendFriendRequest(userId);
      setSentRequests(prev => ({ ...prev, [userId]: 'sent' }));
    } catch (error) {
      const msg = error.response?.data?.message || error.message || '';
      // Si ya existe la solicitud, reflejarlo igual en la UI
      if (msg.toLowerCase().includes('ya') || msg.toLowerCase().includes('exist')) {
        setSentRequests(prev => ({ ...prev, [userId]: 'sent' }));
      } else {
        toast.error('Error al enviar solicitud');
      }
    }
  };

  const handleDismiss = (userId) => {
    setSuggestions(prev => prev.filter(s => s.id !== userId));
  };

  const handleViewProfile = (userId) => {
    navigate(`/perfil/${userId}`);
  };

  const getAvatarUrl = (user) => {
    if (!user) return null;
    if (user.avatar?.startsWith('http')) return user.avatar;
    if (user.avatar) return `${API_BASE}${user.avatar}`;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=7C3AED&color=fff&size=128`;
  };

  // ── Handlers de amigos existentes ─────────────────────────────────────────
  const handleSendMessage = async (friend, message) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { toast.error('Debes iniciar sesión'); return; }

      const chatResponse = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otherUserId: friend.id || friend._id }),
      });

      const chatData = await chatResponse.json();
      const chatId = chatData.id || chatData._id || chatData.data?.chat?._id;
      if (!chatId) throw new Error(chatData.error || chatData.message || 'Error al crear chat');

      setMessageModalFriend(null);
      navigate(`/mensajes?chat=${chatId}&autoMsg=${encodeURIComponent(message)}`);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleRemoveFriend = (friend) => {
    if (window.confirm(`¿Eliminar a ${friend.name}?`)) {
      setFriends(prev => prev.filter(f => f.id !== friend.id));
      setSelectedFriend(null);
      toast.success(`${friend.name} eliminado`);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const visibleSuggestions = suggestions.filter(s => !sentRequests[s.id] || sentRequests[s.id] === 'sent');

  if (loading && suggestionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-3 md:px-6 pt-4 md:pt-6">

          {/* ── Mis amigos ───────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2.5 rounded-2xl shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mis Amigos</h1>
                <p className="text-gray-500 text-sm">
                  {friends.length} amigo{friends.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500"></div>
              </div>
            ) : friends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.map(friend => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    onViewProfile={setSelectedFriend}
                    onSendMessage={setMessageModalFriend}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="bg-white rounded-3xl p-8 max-w-sm mx-auto shadow-sm border border-gray-100">
                  <div className="text-5xl mb-3">👥</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">Aún no tienes amigos</h3>
                  <p className="text-gray-500 text-sm">Mira las sugerencias de abajo para empezar</p>
                </div>
              </div>
            )}
          </div>

          {/* ── Sugerencias ──────────────────────────────────────────────── */}
          {(suggestionsLoading || visibleSuggestions.length > 0) && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2.5 rounded-2xl shadow-lg">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800">Personas que quizás conozcas</h2>
                  <p className="text-gray-500 text-sm">Otros miembros de AdoptaPet</p>
                </div>
              </div>

              {suggestionsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl shadow-md p-5 animate-pulse">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-4" />
                      <div className="flex gap-2">
                        <div className="flex-1 h-9 bg-gray-200 rounded-xl" />
                        <div className="flex-1 h-9 bg-gray-200 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleSuggestions.map(suggestion => {
                    const status = sentRequests[suggestion.id];
                    return (
                      <div
                        key={suggestion.id}
                        className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-5 relative"
                      >
                        {/* Botón descartar */}
                        <button
                          onClick={() => handleDismiss(suggestion.id)}
                          className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition"
                          title="Descartar sugerencia"
                        >
                          <X className="w-4 h-4" />
                        </button>

                        {/* Info del usuario */}
                        <div className="flex items-center gap-4 mb-3">
                          <img
                            src={getAvatarUrl(suggestion)}
                            alt={suggestion.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-purple-100 flex-shrink-0"
                            onError={e => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestion.name)}&background=7C3AED&color=fff&size=128`;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-lg text-gray-800 truncate">{suggestion.name}</h3>
                            {suggestion.location && (
                              <p className="text-xs text-gray-400 truncate">📍 {suggestion.location}</p>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">{suggestion.bio}</p>

                        {/* Acciones */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewProfile(suggestion.id)}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                          >
                            Ver perfil
                          </button>

                          {status === 'sent' ? (
                            <button
                              disabled
                              className="flex-1 bg-gray-100 text-gray-400 px-4 py-2 rounded-xl font-semibold text-sm cursor-not-allowed"
                            >
                              ✓ Enviada
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSendRequest(suggestion.id)}
                              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg text-white px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                            >
                              + Agregar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {selectedFriend && (
        <ProfileModal
          friend={selectedFriend}
          onClose={() => setSelectedFriend(null)}
          onSendMessage={setMessageModalFriend}
          onRemoveFriend={handleRemoveFriend}
        />
      )}
      {messageModalFriend && (
        <MessageModal
          friend={messageModalFriend}
          onClose={() => setMessageModalFriend(null)}
          onSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
}