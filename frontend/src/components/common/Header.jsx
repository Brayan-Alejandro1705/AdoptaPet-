import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Estados para el buscador
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar usuarios en tiempo real
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setSearchLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data || []);
          setShowResults(true);
        }
      } catch (error) {
        console.error('Error buscando usuarios:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const cargarUsuario = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:5000/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        
        if (userData.avatar && !userData.avatar.startsWith('http')) {
          userData.avatar = `http://127.0.0.1:5000${userData.avatar}`;
        }
        
        console.log('👤 Usuario cargado en Header:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error('Error al cargar perfil');
      }
    } catch (error) {
      console.error('❌ Error al cargar usuario en Header:', error);
      
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          
          if (userData.avatar && !userData.avatar.startsWith('http')) {
            userData.avatar = `http://127.0.0.1:5000${userData.avatar}`;
          }
          
          setUser(userData);
        } catch (e) {
          console.error('Error al parsear usuario:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    setSearchQuery('');
    setShowResults(false);
    navigate(`/perfil/${userId}`);
  };

  const getAvatarUrl = (user) => {
    if (!user) return 'http://localhost:5000/api/avatar/User';
    
    if (user.avatar?.startsWith('http')) {
      return user.avatar;
    }
    
    if (user.avatar) {
      return `http://localhost:5000${user.avatar}`;
    }
    
    const name = user.name || user.nombre || 'User';
    return `http://localhost:5000/api/avatar/${encodeURIComponent(name)}`;
  };

  const userName = user?.nombre || user?.name || 'Usuario';
  const userAvatar = user?.avatar || `http://localhost:5000/api/avatar/${encodeURIComponent(userName)}`;

  return (
    <header className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between">

        {/* Logo + Nombre */}
        <Link to="/home" className="flex items-center gap-2 md:gap-3 cursor-pointer hover:scale-105 transition-transform">
          <span className="text-3xl md:text-4xl drop-shadow-lg">🐾</span>
          <h1 className="text-xl md:text-2xl font-bold tracking-wide text-white drop-shadow-md">AdoptaPet</h1>
        </Link>

        {/* Search - DESKTOP ONLY */}
        <div className="hidden md:flex flex-1 max-w-xl mx-6 relative" ref={searchRef}>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            placeholder="Buscar personas..."
            className="w-full px-6 py-3 pr-12 border-2 border-white/30 bg-white/90 backdrop-blur rounded-full focus:ring-4 focus:ring-white/50 focus:border-white outline-none shadow-lg transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
            {searchLoading ? '⏳' : '🔍'}
          </span>

          {/* Resultados de búsqueda */}
          {showResults && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-96 overflow-y-auto z-50">
              {searchLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Buscando...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <button
                      key={result._id || result.id}
                      onClick={() => handleUserClick(result._id || result.id)}
                      className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 text-left"
                    >
                      <img
                        src={getAvatarUrl(result)}
                        alt={result.name || result.nombre}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                        onError={(e) => {
                          e.target.src = `http://localhost:5000/api/avatar/${encodeURIComponent(result.name || result.nombre || 'User')}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {result.name || result.nombre}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {result.email}
                        </p>
                        {result.location?.city && (
                          <p className="text-xs text-gray-400">
                            📍 {result.location.city}
                          </p>
                        )}
                      </div>
                      {result.verified?.email && (
                        <span className="text-blue-500 text-lg">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">😕</div>
                  <p className="text-gray-600 font-medium">No se encontraron resultados</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Intenta con otro nombre
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Icons */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/mensajes" className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#8b5cf6" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.38 8.38 0 0 1 11.5 3h1A8.5 8.5 0 0 1 21 11.5z"/>
            </svg>
          </Link>

          <Link to="/notificaciones" className="relative w-10 h-10 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5 md:w-6 md:h-6 stroke-[#f59e0b] stroke-[2.5]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 18.75a1.5 1.5 0 1 1-3 0M4.5 9a7.5 7.5 0 1 1 15 0c0 3.15.75 4.5 1.5 5.25H3c.75-.75 1.5-2.1 1.5-5.25Z"/>
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-md">3</span>
          </Link>

          {/* Avatar del Usuario */}
          {loading ? (
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/50 animate-pulse"></div>
          ) : (
            <Link to="/perfil" className="w-10 h-10 md:w-11 md:h-11 rounded-full transition-transform hover:scale-110 active:scale-95 shadow-lg cursor-pointer block">
              <img 
                key={userAvatar}
                src={userAvatar}
                alt={userName}
                className="w-full h-full rounded-full border-2 md:border-3 border-white object-cover"
                onError={(e) => {
                  console.error('❌ Error al cargar avatar en Header:', userAvatar);
                  e.target.src = `http://localhost:5000/api/avatar/${encodeURIComponent(userName)}`;
                }}
              />
            </Link>
          )}
          
          {/* Nombre del Usuario - Desktop */}
          {loading ? (
            <div className="hidden md:block ml-2 w-24 h-5 bg-white/50 rounded animate-pulse"></div>
          ) : (
            <Link to="/perfil" className="hidden md:block ml-2 text-white font-semibold hover:underline">
              {userName}
            </Link>
          )}
        </div>
      </div>

      {/* Search - MOBILE ONLY */}
      <div className="md:hidden px-3 pb-3">
        <div className="relative" ref={searchRef}>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            placeholder="Buscar personas..." 
            className="w-full px-4 py-2 pr-10 border-2 border-white/30 bg-white/90 backdrop-blur rounded-full focus:ring-2 focus:ring-white/50 outline-none shadow-lg text-sm"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {searchLoading ? '⏳' : '🔍'}
          </span>

          {/* Resultados móvil */}
          {showResults && (
            <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50">
              {searchLoading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin h-6 w-6 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Buscando...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <button
                      key={result._id || result.id}
                      onClick={() => handleUserClick(result._id || result.id)}
                      className="w-full px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 text-left"
                    >
                      <img
                        src={getAvatarUrl(result)}
                        alt={result.name || result.nombre}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                        onError={(e) => {
                          e.target.src = `http://localhost:5000/api/avatar/${encodeURIComponent(result.name || result.nombre || 'User')}`;
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {result.name || result.nombre}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {result.email}
                        </p>
                      </div>
                      {result.verified?.email && (
                        <span className="text-blue-500">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="text-3xl mb-2">😕</div>
                  <p className="text-sm text-gray-600">No se encontraron resultados</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}