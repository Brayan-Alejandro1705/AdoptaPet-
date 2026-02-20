import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { notificationService } from '../../services/notificationService';
import { friendRequestService } from '../../services/friendRequestService';

export default function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [friendshipStatuses, setFriendshipStatuses] = useState({});
  const [notification, setNotification] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const navigate = useNavigate();
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    cargarUsuario();
    cargarContadorNotificaciones();
    cargarContadorChatsNoLeidos();

    const interval = setInterval(() => {
      cargarContadorNotificaciones();
      cargarContadorChatsNoLeidos();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setShowMobileSearch(false);
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        const response = await fetch(
          `${API_BASE}/api/users/search?q=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data || []);
          setShowResults(true);

          if (data && data.length > 0) {
            cargarEstadosAmistad(data);
          }
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

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const cargarEstadosAmistad = async (usuarios) => {
    const statuses = {};
    await Promise.all(
      usuarios.map(async (usuario) => {
        try {
          const status = await friendRequestService.checkFriendshipStatus(usuario._id || usuario.id);
          statuses[usuario._id || usuario.id] = status;
        } catch (error) {
          statuses[usuario._id || usuario.id] = 'none';
        }
      })
    );
    setFriendshipStatuses(statuses);
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await friendRequestService.sendFriendRequest(userId);
      setFriendshipStatuses(prev => ({ ...prev, [userId]: 'sent' }));
      showNotification('Solicitud de amistad enviada');
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error al enviar solicitud');
    }
  };

  const handleCancelFriendRequest = async (userId) => {
    try {
      await friendRequestService.cancelRequest(userId);
      setFriendshipStatuses(prev => ({ ...prev, [userId]: 'none' }));
      showNotification('Solicitud cancelada');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const cargarContadorNotificaciones = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      setUnreadCount(0);
    }
  };

  const cargarContadorChatsNoLeidos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setChatUnreadCount(0); return; }

      const res = await fetch(`${API_BASE}/api/chat/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) { setChatUnreadCount(0); return; }

      const data = await res.json();
      setChatUnreadCount(data?.count || 0);
    } catch (e) {
      setChatUnreadCount(0);
    }
  };

  const cargarUsuario = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    try {
      const response = await fetch(`${API_BASE}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        if (userData.avatar && !userData.avatar.startsWith('http')) {
          userData.avatar = `${API_BASE}${userData.avatar}`;
        }
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error('Error al cargar perfil');
      }
    } catch (error) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.avatar && !userData.avatar.startsWith('http')) {
            userData.avatar = `${API_BASE}${userData.avatar}`;
          }
          setUser(userData);
        } catch (e) {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = (userId) => {
    setSearchQuery('');
    setShowResults(false);
    setShowMobileSearch(false);
    navigate(`/perfil/${userId}`);
  };

  const handleNotificationClick = () => {
    navigate('/notificaciones');
  };

  const getAvatarUrl = (user) => {
    if (!user) return `${API_BASE}/api/avatar/User`;
    if (user.avatar?.startsWith('http')) return user.avatar;
    if (user.avatar) return `${API_BASE}${user.avatar}`;
    const name = user.name || user.nombre || 'User';
    return `${API_BASE}/api/avatar/${encodeURIComponent(name)}`;
  };

  const getFriendButton = (userId) => {
    const status = friendshipStatuses[userId];

    if (status === 'friends') {
      return (
        <span className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
          Amigos
        </span>
      );
    }
    if (status === 'sent') {
      return (
        <button
          onClick={() => handleCancelFriendRequest(userId)}
          className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition"
        >
          Cancelar
        </button>
      );
    }
    if (status === 'received') {
      return (
        <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
          Ver Perfil
        </span>
      );
    }
    return (
      <button
        onClick={() => handleSendFriendRequest(userId)}
        className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-semibold hover:bg-purple-600 transition"
      >
        Agregar
      </button>
    );
  };

  // Resultados de búsqueda (reutilizable en móvil y desktop)
  const SearchResultsDropdown = () => (
    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50">
      {searchLoading ? (
        <div className="p-4 text-center text-gray-500">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          Buscando...
        </div>
      ) : searchResults.length > 0 ? (
        <div className="py-2">
          {searchResults.map((result) => (
            <div key={result._id || result.id} className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3">
              <button onClick={() => handleUserClick(result._id || result.id)} className="flex items-center gap-3 flex-1 text-left">
                <img
                  src={getAvatarUrl(result)}
                  alt={result.name || result.nombre}
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate text-sm">{result.name || result.nombre}</p>
                  <p className="text-xs text-gray-500 truncate">{result.email}</p>
                </div>
              </button>
              {getFriendButton(result._id || result.id)}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center">
          <div className="text-3xl mb-2">😕</div>
          <p className="text-gray-600 font-medium text-sm">No se encontraron resultados</p>
        </div>
      )}
    </div>
  );

  const userName = user?.nombre || user?.name || 'Usuario';
  const userAvatar = user?.avatar || `${API_BASE}/api/avatar/${encodeURIComponent(userName)}`;

  return (
    <header className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 shadow-lg sticky top-0 z-50">
      {/* Fila principal */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 md:gap-4">

        {/* Logo */}
        <Link to="/home" className="flex items-center gap-1.5 md:gap-2 cursor-pointer hover:scale-105 transition-transform flex-shrink-0">
          <span className="text-2xl md:text-3xl drop-shadow-lg">🐾</span>
          <h1 className="text-lg md:text-2xl font-bold tracking-wide text-white drop-shadow-md">AdoptaPet</h1>
        </Link>

        {/* Buscador Desktop */}
        <div className="hidden md:flex flex-1 max-w-xl mx-4 relative" ref={searchRef}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
            placeholder="Buscar personas..."
            className="w-full px-5 py-2.5 pr-11 border-2 border-white/30 bg-white/90 backdrop-blur rounded-full focus:ring-4 focus:ring-white/50 focus:border-white outline-none shadow-lg transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            {searchLoading ? '⏳' : '🔍'}
          </span>
          {showResults && <SearchResultsDropdown />}
        </div>

        {/* Spacer en móvil para empujar los iconos a la derecha */}
        <div className="flex-1 md:hidden" />

        {/* Íconos de acción */}
        <div className="flex items-center gap-1.5 md:gap-3">

          {/* Botón lupa solo en móvil */}
          <button
            onClick={() => setShowMobileSearch(prev => !prev)}
            className="md:hidden w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-lg hover:shadow-xl active:scale-95 transition-all"
            aria-label="Buscar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="#8b5cf6" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>

          {/* Chat */}
          <Link to="/mensajes" className="relative w-9 h-9 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#8b5cf6" strokeWidth="2.5" viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.38 8.38 0 0 1 11.5 3h1A8.5 8.5 0 0 1 21 11.5z" />
            </svg>
            {chatUnreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-purple-700 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md">
                {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
              </span>
            )}
          </Link>

          {/* Notificaciones */}
          <button onClick={handleNotificationClick} className="relative w-9 h-9 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-4 h-4 md:w-5 md:h-5 stroke-[#f59e0b] stroke-[2.5]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 18.75a1.5 1.5 0 1 1-3 0M4.5 9a7.5 7.5 0 1 1 15 0c0 3.15.75 4.5 1.5 5.25H3c.75-.75 1.5-2.1 1.5-5.25Z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse shadow-md">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          {loading ? (
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/50 animate-pulse flex-shrink-0"></div>
          ) : (
            <Link to="/perfil" className="flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform">
              <img
                key={userAvatar}
                src={userAvatar}
                alt={userName}
                className="w-9 h-9 md:w-11 md:h-11 rounded-full border-2 border-white object-cover shadow-lg flex-shrink-0"
              />
              <span className="hidden md:block text-white font-semibold text-sm hover:underline">{userName}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Barra de búsqueda móvil (desplegable) */}
      {showMobileSearch && (
        <div className="md:hidden px-3 pb-3 relative" ref={mobileSearchRef}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              placeholder="Buscar personas..."
              autoFocus
              className="w-full px-5 py-2.5 pr-11 border-2 border-white/30 bg-white/95 backdrop-blur rounded-full focus:ring-4 focus:ring-white/50 focus:border-white outline-none shadow-lg transition-all text-sm"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {searchLoading ? '⏳' : '🔍'}
            </span>
            {showResults && <SearchResultsDropdown />}
          </div>
        </div>
      )}

      {/* Notificación flotante */}
      {notification && (
        <div className="fixed top-20 right-4 z-[9999]">
          <div className="bg-purple-500 text-white shadow-2xl px-6 py-4 rounded-2xl">
            <p className="font-bold">{notification}</p>
          </div>
        </div>
      )}
    </header>
  );
}