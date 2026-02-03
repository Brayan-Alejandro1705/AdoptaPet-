//esta pagina es de amigos

import { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import FriendCard from '../components/common/FriendCard';
import ProfileModal from '../components/common/ProfileModal';
import MessageModal from '../components/common/MessageModal';
import SearchBar from '../components/common/SearchBar';
import { Users } from 'lucide-react';
import { userService } from '../services/userService';

export default function Amigos() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageModalFriend, setMessageModalFriend] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Obtener usuario actual
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      
      // DEBUGGING: Ver la estructura real de los usuarios
      console.log('📦 Usuarios RAW del API:', data);
      if (data && data.length > 0) {
        console.log('📦 Primer usuario completo:', data[0]);
        console.log('📦 Estructura del primer usuario:', {
          _id: data[0]._id,
          id: data[0].id,
          name: data[0].name,
          nombre: data[0].nombre
        });
      }
      
      // Filtrar para no mostrar al usuario actual
      const filteredUsers = data.filter(user => user.id !== currentUser.id);
      
      // Formatear datos para que coincidan con el componente FriendCard
      const formattedUsers = filteredUsers.map(user => {
        const userId = user.id || user._id;
        
        // Log individual por usuario para debugging
        if (!userId) {
          console.error('⚠️ Usuario sin ID:', user);
        }
        
        return {
          id: userId,
          _id: userId, // También incluir _id por compatibilidad
          name: user.name || user.nombre || 'Usuario sin nombre',
          online: false, // Puedes implementar esto con Socket.io después
          lastSeen: 'hace un momento',
          mutualFriends: 0, // Implementar después si es necesario
          location: user.location || user.ubicacion?.ciudad || 'Sin ubicación',
          friendsSince: user.createdAt 
            ? new Date(user.createdAt).toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              })
            : 'Reciente',
          bio: user.bio || 'Sin biografía',
          interests: user.interests || user.intereses || [],
          avatar: user.avatar
        };
      });
      
      console.log('✅ Usuarios formateados:', formattedUsers.length);
      if (formattedUsers.length > 0) {
        console.log('✅ Primer usuario formateado:', formattedUsers[0]);
      }
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      alert('Error al cargar usuarios. Verifica tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios por búsqueda
  const filteredFriends = users.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handlers
  const handleViewProfile = (friend) => {
    console.log('👁️ Abriendo perfil de:', friend);
    setSelectedFriend(friend);
  };

  const handleOpenMessage = (friend) => {
    console.log('💬 Abriendo modal de mensaje para:', friend);
    console.log('💬 Friend.id:', friend.id);
    console.log('💬 Friend._id:', friend._id);
    setMessageModalFriend(friend);
  };

  const handleSendMessage = async (friend, message) => {
    try {
      console.log(`📨 Enviando mensaje a ${friend.name}: ${message}`);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Debes iniciar sesión para enviar mensajes');
        return;
      }
      
      // 1. Crear o obtener el chat
      console.log('🔄 Creando/obteniendo chat...');
      const chatResponse = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          participantId: friend.id
        })
      });
      
      const chatData = await chatResponse.json();
      
      if (!chatData.success) {
        throw new Error(chatData.message || 'Error al crear chat');
      }
      
      const chatId = chatData.data.chat._id;
      console.log('✅ Chat creado/obtenido:', chatId);
      
      // 2. Enviar el mensaje
      console.log('📤 Enviando mensaje...');
      const messageResponse = await fetch(`http://127.0.0.1:5000/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: message
        })
      });
      
      const messageData = await messageResponse.json();
      
      if (!messageData.success) {
        throw new Error(messageData.message || 'Error al enviar mensaje');
      }
      
      console.log('✅ Mensaje enviado correctamente');
      
      // 3. Cerrar modal
      setMessageModalFriend(null);
      
      // 4. Mostrar confirmación
      alert(`✅ Mensaje enviado a ${friend.name}!\n\nVe a la sección "Chat" para continuar la conversación.`);
      
      // Opcional: Redirigir automáticamente al chat después de 1 segundo
      // setTimeout(() => {
      //   window.location.href = '/chat';
      // }, 1000);
      
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      alert(`Error al enviar mensaje: ${error.message}\n\nVerifica tu conexión e intenta de nuevo.`);
    }
  };

  const handleRemoveFriend = (friend) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${friend.name} de tus amigos?`)) {
      console.log(`Eliminando amigo: ${friend.name}`);
      // Aquí irá la lógica para eliminar el amigo
      alert(`${friend.name} ha sido eliminado de tu lista de amigos`);
      setSelectedFriend(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          {/* SIDEBAR IZQUIERDO - 3 columnas */}
          <div className="hidden md:block md:col-span-3">
            <Sidebar />
          </div>

          {/* CONTENIDO PRINCIPAL - 9 columnas */}
          <main className="col-span-1 md:col-span-9">
            
            {/* Header de la página */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                  Buscar Personas
                </h1>
              </div>
              <p className="text-gray-600 ml-16">
                {filteredFriends.length} persona{filteredFriends.length !== 1 ? 's' : ''} encontrada{filteredFriends.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Barra de búsqueda */}
            <div className="mb-6">
              <SearchBar 
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                placeholder="Buscar personas..."
              />
            </div>

            {/* Grid de usuarios */}
            {filteredFriends.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFriends.map(friend => (
                  <FriendCard 
                    key={friend.id || friend._id}
                    friend={friend}
                    onViewProfile={handleViewProfile}
                    onSendMessage={handleOpenMessage}
                  />
                ))}
              </div>
            ) : (
              // Estado vacío
              <div className="text-center py-20">
                <div className="bg-white rounded-3xl p-12 max-w-md mx-auto shadow-md">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    No hay personas
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm 
                      ? 'No encontramos personas con ese nombre'
                      : 'No hay usuarios registrados aún'
                    }
                  </p>
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Limpiar Búsqueda
                    </button>
                  )}
                </div>
              </div>
            )}

          </main>
          
        </div>
      </div>

      <BottomNav />

      {/* Modal de perfil */}
      {selectedFriend && (
        <ProfileModal 
          friend={selectedFriend}
          onClose={() => setSelectedFriend(null)}
          onSendMessage={handleOpenMessage}
          onRemoveFriend={handleRemoveFriend}
        />
      )}

      {/* Modal de mensaje */}
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