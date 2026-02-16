import { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
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

  useEffect(() => {
    loadFriends();
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

  const handleViewProfile = (friend) => {
    setSelectedFriend(friend);
  };

  const handleOpenMessage = (friend) => {
    setMessageModalFriend(friend);
  };

  const handleSendMessage = async (friend, message) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión');
        return;
      }
      
      const chatResponse = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ participantId: friend.id })
      });
      
      const chatData = await chatResponse.json();
      if (!chatData.success) throw new Error(chatData.message);
      
      const chatId = chatData.data.chat._id;
      
      const messageResponse = await fetch(`http://127.0.0.1:5000/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-8">
      <Header />
      <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <div className="hidden md:block md:col-span-3">
            <Sidebar />
          </div>
          <main className="col-span-1 md:col-span-9">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Mis Amigos</h1>
              </div>
              <p className="text-gray-600 ml-16">{friends.length} amigo{friends.length !== 1 ? 's' : ''}</p>
            </div>
            {friends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {friends.map(friend => (
                  <FriendCard 
                    key={friend.id}
                    friend={friend}
                    onViewProfile={handleViewProfile}
                    onSendMessage={handleOpenMessage}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="bg-white rounded-3xl p-12 max-w-md mx-auto shadow-md">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Aún no tienes amigos</h3>
                  <p className="text-gray-600 mb-6">Busca personas y envía solicitudes</p>
                  <a href="/home" className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all">
                    Buscar personas
                  </a>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
      <BottomNav />
      {selectedFriend && (
        <ProfileModal 
          friend={selectedFriend}
          onClose={() => setSelectedFriend(null)}
          onSendMessage={handleOpenMessage}
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