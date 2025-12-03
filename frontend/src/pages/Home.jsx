import { useState, useEffect } from 'react';
import Header from '../components/common/Header';

function Perfil() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('solicitudes');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: '',
    email: '',
    bio: '',
    telefono: '',
    ubicacion: ''
  });
  const [notification, setNotification] = useState('');

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        throw new Error('Error al cargar el perfil');
      }

      const data = await response.json();
      const userData = data.user || data;
      setUser(userData);
      
    } catch (err) {
      console.error('Error:', err);
      
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => {
    if (user) {
      setEditForm({
        nombre: user.nombre || user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        telefono: user.telefono || user.phone || '',
        ubicacion: user.ubicacion || user.location || ''
      });
    }
    setShowEditModal(true);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    
    if (!editForm.nombre || !editForm.email) {
      showNotification('❌ Nombre y email son obligatorios');
      return;
    }

    const updatedUser = {
      ...user,
      nombre: editForm.nombre,
      name: editForm.nombre,
      email: editForm.email,
      bio: editForm.bio,
      telefono: editForm.telefono,
      ubicacion: editForm.ubicacion
    };

    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setShowEditModal(false);
    showNotification('✅ Perfil actualizado correctamente');
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔄</div>
          <p className="text-xl text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-4">No se encontró el usuario</h3>
          <button 
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/login';
            }}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-cyan-700">
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  const userName = user.nombre || user.name || 'Usuario';
  const userEmail = user.email || 'email@ejemplo.com';
  const userBio = user.bio || 'Amante de los animales 🐾';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=200&background=random`;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Component */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          {/* Cover Image */}
          <div className="h-48 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700"></div>
          
          {/* Profile Info */}
          <div className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20">
              <div className="relative group">
                <img 
                  src={avatarUrl}
                  alt="Foto de perfil" 
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg object-cover"
                />
              </div>
              
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{userName}</h1>
                <p className="text-gray-600 mb-2">{userEmail}</p>
                <p className="text-gray-700 italic">{userBio}</p>
              </div>
              
              <button 
                onClick={openEditModal}
                className="mt-4 sm:mt-0 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-2 rounded-full font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                Editar Perfil
              </button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-8 text-center">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-purple-600">12</div>
                <div className="text-sm text-gray-600">Información</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 cursor-pointer hover:bg-gray-100">
                <div className="text-3xl font-bold text-cyan-600">8</div>
                <div className="text-sm text-gray-600">Favoritos</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-3xl font-bold text-pink-600">25</div>
                <div className="text-sm text-gray-600">Publicaciones</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button 
              onClick={() => setActiveTab('solicitudes')}
              className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-colors duration-300 ${
                activeTab === 'solicitudes' 
                  ? 'border-purple-600 bg-purple-50 text-gray-700' 
                  : 'border-transparent text-gray-500 hover:bg-gray-50'
              }`}>
              📋 Solicitudes
            </button>
            <button 
              onClick={() => setActiveTab('historial')}
              className={`flex-1 px-6 py-4 text-sm font-semibold border-b-2 transition-colors duration-300 ${
                activeTab === 'historial' 
                  ? 'border-purple-600 bg-purple-50 text-gray-700' 
                  : 'border-transparent text-gray-500 hover:bg-gray-50'
              }`}>
              🕐 Historial
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'solicitudes' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-gray-100 transition-all duration-300">
                  <img 
                    src="https://ui-avatars.com/api/?name=Maria+Garcia&size=80&background=random"
                    alt="Usuario" 
                    className="w-16 h-16 rounded-full border-2 border-purple-300"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">María García</h3>
                    <p className="text-gray-600 text-sm">Interesada en adoptar a <span className="font-semibold">Luna</span></p>
                    <p className="text-gray-500 text-xs mt-1">Hace 2 horas</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300">
                      Aceptar
                    </button>
                    <button className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300">
                      Rechazar
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-gray-100 transition-all duration-300">
                  <img 
                    src="https://ui-avatars.com/api/?name=Carlos+Lopez&size=80&background=random"
                    alt="Usuario" 
                    className="w-16 h-16 rounded-full border-2 border-cyan-300"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">Carlos López</h3>
                    <p className="text-gray-600 text-sm">Interesado en adoptar a <span className="font-semibold">Max</span></p>
                    <p className="text-gray-500 text-xs mt-1">Hace 5 horas</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300">
                      Aceptar
                    </button>
                    <button className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300">
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'historial' && (
              <div className="space-y-4">
                <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">✅</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">Adopción exitosa</h3>
                      <p className="text-gray-700">Michi fue adoptado por Ana Martínez</p>
                      <p className="text-gray-500 text-sm mt-2">15 de Octubre, 2024</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📝</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">Publicación creada</h3>
                      <p className="text-gray-700">Publicaste a Max en adopción</p>
                      <p className="text-gray-500 text-sm mt-2">20 de Septiembre, 2024</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🎉</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-1">Bienvenido a AdoptaPet</h3>
                      <p className="text-gray-700">Te registraste en la plataforma</p>
                      <p className="text-gray-500 text-sm mt-2">1 de Septiembre, 2024</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 text-center mt-12">
        <p>&copy; 2025 AdoptaPet. Todos los derechos reservados. Hecho con ❤️ para las mascotas.</p>
      </footer>

      {/* Modal de Editar Perfil */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">✏️ Editar Perfil</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none">
                &times;
              </button>
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <img 
                  src={avatarUrl}
                  alt="Foto de perfil" 
                  className="w-32 h-32 rounded-full border-4 border-purple-300 object-cover mx-auto"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                <input 
                  type="text"
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Tu nombre completo"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                <input 
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Biografía</label>
                <textarea 
                  value={editForm.bio}
                  onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                  rows={4}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                  placeholder="Cuéntanos sobre ti..."></textarea>
                <p className="text-sm text-gray-500 mt-1">Máximo 200 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono (opcional)</label>
                <input 
                  type="tel"
                  value={editForm.telefono}
                  onChange={(e) => setEditForm({...editForm, telefono: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="+57 300 123 4567"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ubicación (opcional)</label>
                <input 
                  type="text"
                  value={editForm.ubicacion}
                  onChange={(e) => setEditForm({...editForm, ubicacion: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Ciudad, País"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-400 transition-colors">
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition-all hover:shadow-lg">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {notification}
        </div>
      )}
    </div>
  );
}

export default Perfil;