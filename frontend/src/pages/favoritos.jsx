import { useState } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import { Heart, MapPin } from 'lucide-react';

// Datos dummy de mascotas favoritas
const INITIAL_FAVORITES = [
  {
    id: 1,
    name: "Luna",
    type: "perros",
    breed: "Pastor Alemán",
    age: "2 años",
    location: "Bogotá, Colombia",
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop",
    typeLabel: "🐕 Perro"
  },
  {
    id: 2,
    name: "Michi",
    type: "gatos",
    breed: "Gato Persa",
    age: "1 año",
    location: "Medellín, Colombia",
    image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop",
    typeLabel: "🐱 Gato"
  },
  {
    id: 3,
    name: "Rocky",
    type: "perros",
    breed: "Labrador",
    age: "3 años",
    location: "Cali, Colombia",
    image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop",
    typeLabel: "🐕 Perro"
  },
  {
    id: 4,
    name: "Pelusa",
    type: "gatos",
    breed: "Siamés",
    age: "6 meses",
    location: "Barranquilla, Colombia",
    image: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?w=400&h=300&fit=crop",
    typeLabel: "🐱 Gato"
  },
  {
    id: 5,
    name: "Copito",
    type: "otros",
    breed: "Conejo",
    age: "1 año",
    location: "Bogotá, Colombia",
    image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=300&fit=crop",
    typeLabel: "🐰 Conejo"
  },
  {
    id: 6,
    name: "Max",
    type: "perros",
    breed: "Golden Retriever",
    age: "4 años",
    location: "Cartagena, Colombia",
    image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop",
    typeLabel: "🐕 Perro"
  }
];

export default function Favoritos() {
  const [favorites, setFavorites] = useState(INITIAL_FAVORITES);
  const [currentFilter, setCurrentFilter] = useState('todos');
  const [removingId, setRemovingId] = useState(null);

  const handleRemoveFavorite = (id) => {
    setRemovingId(id);
    showNotification('Eliminado de favoritos 💔');
    
    setTimeout(() => {
      setFavorites(favorites.filter(pet => pet.id !== id));
      setRemovingId(null);
    }, 500);
  };

  const handleViewDetails = (name) => {
    alert(`Viendo detalles de ${name} 🐾`);
  };

  const showNotification = (message) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-xl shadow-2xl z-50 animate-bounce';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 2000);
  };

  const getFilteredFavorites = () => {
    if (currentFilter === 'todos') {
      return favorites;
    }
    return favorites.filter(pet => pet.type === currentFilter);
  };

  const filteredFavorites = getFilteredFavorites();

  const filters = [
    { key: 'todos', label: '🐾 Todos' },
    { key: 'perros', label: '🐕 Perros' },
    { key: 'gatos', label: '🐱 Gatos' }
  ];

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
            
            {/* Título de la página */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">❤️</span>
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Mis Favoritos
                </h2>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap gap-3">
                {filters.map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setCurrentFilter(filter.key)}
                    className={`px-6 py-2 font-semibold rounded-full shadow-md transition-all ${
                      currentFilter === filter.key
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de mascotas favoritas */}
            {filteredFavorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFavorites.map(pet => (
                  <div
                    key={pet.id}
                    className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2 ${
                      removingId === pet.id ? 'animate-fade-out' : ''
                    }`}
                  >
                    <div className="relative">
                      <img 
                        src={pet.image} 
                        alt={pet.name}
                        className="w-full h-56 object-cover"
                      />
                      <button
                        onClick={() => handleRemoveFavorite(pet.id)}
                        className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                      >
                        <span className="text-2xl">💔</span>
                      </button>
                      <div className="absolute bottom-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {pet.typeLabel}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{pet.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{pet.breed} • {pet.age}</p>
                      <p className="text-gray-500 text-sm mb-4 flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {pet.location}
                      </p>
                      <button
                        onClick={() => handleViewDetails(pet.name)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
                      >
                        Ver detalles
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Mensaje cuando no hay favoritos */
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
                <div className="text-8xl mb-4">💔</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No tienes favoritos aún
                </h3>
                <p className="text-gray-600 mb-6">
                  Explora y guarda las mascotas que más te gusten
                </p>
                <a
                  href="/adoptar"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Explorar mascotas
                </a>
              </div>
            )}

          </main>
          
        </div>
      </div>

      <BottomNav />

      {/* Animación CSS */}
      <style>{`
        @keyframes fade-out {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.8); }
        }
        .animate-fade-out {
          animation: fade-out 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}