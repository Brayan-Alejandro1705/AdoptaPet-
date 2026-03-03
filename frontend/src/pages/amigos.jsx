import { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';

import FriendCard from '../components/common/FriendCard';
import ProfileModal from '../components/common/ProfileModal';
import MessageModal from '../components/common/MessageModal';
import { Users } from 'lucide-react';
import { friendRequestService } from '../services/friendRequestService';

export default function Amigos() {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageModalFriend, setMessageModalFriend] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFriends(); }, []);

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
        avatar: friend.avatar
      }));
      setFriends(formattedFriends);
    } catch (error) {
      console.error('Error al cargar amigos:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (friend, message) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert('Debes iniciar sesión'); return; }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // FIX 1: fetch estaba roto — faltaba `await fetch(...)` y la URL mal formada
      const chatResponse = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ participantId: friend.id })
      });

      const chatData = await chatResponse.json();
      if (!chatData.success) throw new Error(chatData.message);

      const chatId = chatData.data.chat._id;

      // FIX 2: URL duplicaba `http://` al concatenar con VITE_API_URL que ya lo incluye
      const messageResponse = await fetch(`${API_URL}/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: message })
      });

      const messageData = await messageResponse.json();
      if (!messageData.success) throw new Error(messageData.message);

      setMessageModalFriend(null);
      alert(`✅ Mensaje enviado a ${friend.name}!`);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleRemoveFriend = (friend) => {
    if (window.confirm(`¿Eliminar a ${friend.name}?`)) {
      setFriends(prev => prev.filter(f => f.id !== friend.id));
      setSelectedFriend(null);
      alert(`${friend.name} eliminado`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando amigos...</p>
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

          {/* Título */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2.5 rounded-2xl shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Mis Amigos</h1>
            </div>
            <p className="text-gray-500 text-sm ml-14">
              {friends.length} amigo{friends.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Grid de amigos */}
          {friends.length > 0 ? (
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
            <div className="text-center py-16">
              <div className="bg-white rounded-3xl p-10 max-w-sm mx-auto shadow-sm border border-gray-100">
                <div className="text-5xl mb-3">👥</div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">Aún no tienes amigos</h3>
                <p className="text-gray-500 text-sm mb-5">Busca personas y envía solicitudes</p>
                <a href="/home"
                  className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all text-sm">
                  Buscar personas
                </a>
              </div>
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