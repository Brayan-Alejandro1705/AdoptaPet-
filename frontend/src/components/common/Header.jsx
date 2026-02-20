import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { notificationService } from '../../services/notificationService';
import { friendRequestService } from '../../services/friendRequestService';

// ── Nav items para el drawer ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { path: '/home',           label: 'Inicio',          sublabel: 'Feed principal',        color: '#7C3AED', bgActive: '#F3EFFD' },
  { path: '/adoptar',        label: 'Adoptar',          sublabel: 'Encuentra tu mascota',  color: '#EC4899', bgActive: '#FDF2F8' },
  { path: '/amigos',         label: 'Amigos',           sublabel: 'Tu comunidad',          color: '#3B82F6', bgActive: '#EFF6FF' },
  { path: '/notificaciones', label: 'Notificaciones',   sublabel: 'Alertas y novedades',   color: '#8B5CF6', bgActive: '#F5F3FF' },
  { path: '/favoritos',      label: 'Favoritos',        sublabel: 'Mascotas guardadas',    color: '#EC4899', bgActive: '#FDF2F8' },
  { path: '/mensajes',       label: 'Mensajes',         sublabel: 'Chats y conversaciones',color: '#6366F1', bgActive: '#EEF2FF' },
  { path: '/ajustes',        label: 'Ajustes',          sublabel: 'Cuenta y preferencias', color: '#7C3AED', bgActive: '#F3EFFD' },
];

const NAV_ICONS = {
  '/home': (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? color : 'none'}
      stroke={active ? color : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  ),
  '/adoptar': (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? color : 'none'}
      stroke={active ? color : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a8 8 0 00-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 00-8-8z"/>
      <circle cx="12" cy="10" r="2.5"/>
    </svg>
  ),
  '/amigos': (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? color : 'none'}
      stroke={active ? color : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  ),
  '/notificaciones': (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? color : 'none'}
      stroke={active ? color : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  '/favoritos': (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? color : 'none'}
      stroke={active ? color : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  '/mensajes': (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? color : 'none'}
      stroke={active ? color : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
  '/ajustes': (active, color) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? color : 'none'}
      stroke={active ? color : '#9CA3AF'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
};

export default function Header({ onOpenModal }) {
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const API_BASE = 'http://localhost:5000';

  const isActive = (path) => location.pathname.toLowerCase() === path.toLowerCase();

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

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
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowResults(false);
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
      if (searchQuery.trim().length < 2) { setSearchResults([]); setShowResults(false); return; }
      setSearchLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data || []);
          setShowResults(true);
          if (data && data.length > 0) cargarEstadosAmistad(data);
        }
      } catch (error) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };
    const t = setTimeout(searchUsers, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const cargarEstadosAmistad = async (usuarios) => {
    const statuses = {};
    await Promise.all(usuarios.map(async (u) => {
      try {
        statuses[u._id || u.id] = await friendRequestService.checkFriendshipStatus(u._id || u.id);
      } catch { statuses[u._id || u.id] = 'none'; }
    }));
    setFriendshipStatuses(statuses);
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await friendRequestService.sendFriendRequest(userId);
      setFriendshipStatuses(prev => ({ ...prev, [userId]: 'sent' }));
      showNotification('Solicitud de amistad enviada');
    } catch { showNotification('Error al enviar solicitud'); }
  };

  const handleCancelFriendRequest = async (userId) => {
    try {
      await friendRequestService.cancelRequest(userId);
      setFriendshipStatuses(prev => ({ ...prev, [userId]: 'none' }));
      showNotification('Solicitud cancelada');
    } catch {}
  };

  const cargarContadorNotificaciones = async () => {
    try { setUnreadCount(await notificationService.getUnreadCount()); }
    catch { setUnreadCount(0); }
  };

  const cargarContadorChatsNoLeidos = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setChatUnreadCount(0); return; }
      const res = await fetch(`${API_BASE}/api/chat/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) { setChatUnreadCount(0); return; }
      const data = await res.json();
      setChatUnreadCount(data?.count || 0);
    } catch { setChatUnreadCount(0); }
  };

  const cargarUsuario = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    try {
      const response = await fetch(`${API_BASE}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        const userData = data.user || data;
        if (userData.avatar && !userData.avatar.startsWith('http')) userData.avatar = `${API_BASE}${userData.avatar}`;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else throw new Error();
    } catch {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const userData = JSON.parse(stored);
          if (userData.avatar && !userData.avatar.startsWith('http')) userData.avatar = `${API_BASE}${userData.avatar}`;
          setUser(userData);
        } catch {}
      }
    } finally { setLoading(false); }
  };

  const handleUserClick = (userId) => {
    setSearchQuery(''); setShowResults(false); setShowMobileSearch(false);
    navigate(`/perfil/${userId}`);
  };

  const getAvatarUrl = (u) => {
    if (!u) return `${API_BASE}/api/avatar/User`;
    if (u.avatar?.startsWith('http')) return u.avatar;
    if (u.avatar) return `${API_BASE}${u.avatar}`;
    return `${API_BASE}/api/avatar/${encodeURIComponent(u.name || u.nombre || 'User')}`;
  };

  const getFriendButton = (userId) => {
    const status = friendshipStatuses[userId];
    if (status === 'friends') return <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">Amigos</span>;
    if (status === 'sent') return <button onClick={() => handleCancelFriendRequest(userId)} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition">Cancelar</button>;
    if (status === 'received') return <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">Ver Perfil</span>;
    return <button onClick={() => handleSendFriendRequest(userId)} className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-semibold hover:bg-purple-600 transition">Agregar</button>;
  };

  const SearchResultsDropdown = () => (
    <div className="absolute top-full mt-2 w-full bg-white rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto z-50">
      {searchLoading ? (
        <div className="p-4 text-center text-gray-500">
          <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2" />
          Buscando...
        </div>
      ) : searchResults.length > 0 ? (
        <div className="py-2">
          {searchResults.map((result) => (
            <div key={result._id || result.id} className="w-full px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3">
              <button onClick={() => handleUserClick(result._id || result.id)} className="flex items-center gap-3 flex-1 text-left">
                <img src={getAvatarUrl(result)} alt={result.name || result.nombre} className="w-10 h-10 rounded-full object-cover border-2 border-gray-100" />
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
  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Figtree:wght@400;500;600;700&display=swap');

        /* ── Hamburger lines animation ── */
        .hmb-line {
          width: 18px; height: 2px;
          background: white;
          border-radius: 2px;
          transition: transform 0.25s cubic-bezier(0.4,0,0.2,1),
                      opacity 0.2s ease, width 0.25s ease;
          transform-origin: center;
        }
        .hmb-open .hmb-line:nth-child(1) { transform: translateY(6px) rotate(45deg); }
        .hmb-open .hmb-line:nth-child(2) { opacity: 0; width: 0; }
        .hmb-open .hmb-line:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }

        /* ── Backdrop ── */
        .hmb-backdrop {
          position: fixed; inset: 0;
          background: rgba(15, 5, 30, 0.55);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 149;
          opacity: 0; pointer-events: none;
          transition: opacity 0.3s ease;
        }
        .hmb-backdrop.open { opacity: 1; pointer-events: all; }

        /* ── Drawer ── */
        .hmb-drawer {
          position: fixed;
          top: 0; left: 0; bottom: 0;
          width: 300px; max-width: 85vw;
          background: #FAFAFF;
          z-index: 200;
          display: flex; flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 8px 0 48px rgba(124,58,237,0.15);
          font-family: 'Figtree', sans-serif;
          overflow: hidden;
        }
        .hmb-drawer.open { transform: translateX(0); }

        /* Drawer stripe */
        .hmb-stripe {
          height: 4px;
          background: linear-gradient(to right, #7C3AED, #EC4899, #3B82F6, #8B5CF6);
        }

        /* Profile area */
        .hmb-profile {
          padding: 20px 18px 16px;
          background: white;
          border-bottom: 1px solid #F0EBFF;
          display: flex; align-items: center; gap: 12px;
        }
        .hmb-avatar-box {
          width: 50px; height: 50px;
          border-radius: 16px;
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 800; color: white;
          font-family: 'Syne', sans-serif;
          flex-shrink: 0; overflow: hidden;
        }
        .hmb-avatar-box img { width: 100%; height: 100%; object-fit: cover; }
        .hmb-user-info { flex: 1; min-width: 0; }
        .hmb-user-name {
          font-size: 15px; font-weight: 700; color: #1E1030;
          font-family: 'Syne', sans-serif;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .hmb-user-email {
          font-size: 11px; color: #9A8CB0; margin-top: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .hmb-profile-arrow {
          width: 32px; height: 32px; border-radius: 10px;
          background: #F3EFFD; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #7C3AED; flex-shrink: 0;
          transition: background 0.15s;
        }
        .hmb-profile-arrow:active { background: #EDE8FB; }

        /* Publish CTA */
        .hmb-publish {
          margin: 14px 16px 4px;
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          border: none; border-radius: 14px;
          padding: 12px 16px;
          display: flex; align-items: center; gap: 12px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(124,58,237,0.3);
          transition: transform 0.12s, box-shadow 0.12s;
          -webkit-tap-highlight-color: transparent;
        }
        .hmb-publish:active { transform: scale(0.97); box-shadow: 0 2px 10px rgba(124,58,237,0.2); }
        .hmb-publish-icon {
          width: 34px; height: 34px;
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .hmb-publish-texts { flex: 1; text-align: left; }
        .hmb-publish-title { font-size: 14px; font-weight: 700; color: white; display: block; line-height: 1.2; }
        .hmb-publish-sub { font-size: 11px; color: rgba(255,255,255,0.7); display: block; margin-top: 1px; }

        /* Section label */
        .hmb-section { font-size: 10px; font-weight: 700; color: #C4B8E0; letter-spacing: 0.1em; text-transform: uppercase; padding: 14px 18px 5px; }

        /* Nav list */
        .hmb-list { flex: 1; overflow-y: auto; padding: 0 10px; }
        .hmb-list::-webkit-scrollbar { display: none; }

        /* Nav item */
        .hmb-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 10px; border-radius: 14px;
          border: none; background: none; cursor: pointer;
          width: 100%; text-align: left;
          transition: background 0.15s, transform 0.1s;
          margin-bottom: 2px; position: relative;
          -webkit-tap-highlight-color: transparent;
        }
        .hmb-item:active { transform: scale(0.98); }
        .hmb-item.active { background: var(--item-bg); }
        .hmb-item.active::before {
          content: '';
          position: absolute; left: 0; top: 22%; height: 56%;
          width: 3px; background: var(--item-color);
          border-radius: 0 3px 3px 0;
        }

        .hmb-iconbox {
          width: 40px; height: 40px; border-radius: 12px;
          background: #F3EFFD;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: background 0.15s, transform 0.12s;
        }
        .hmb-item.active .hmb-iconbox { background: var(--item-bg); }
        .hmb-item:active .hmb-iconbox { transform: scale(0.88); }

        .hmb-texts { flex: 1; min-width: 0; }
        .hmb-label {
          font-size: 14px; font-weight: 600; color: #1E1030;
          display: block; line-height: 1.2;
          font-family: 'Figtree', sans-serif;
        }
        .hmb-item.active .hmb-label { color: var(--item-color); font-weight: 700; }
        .hmb-sublabel { font-size: 11px; color: #B4A8CE; display: block; margin-top: 1px; }

        .hmb-chevron { color: var(--item-color); opacity: 0; transition: opacity 0.15s; flex-shrink: 0; }
        .hmb-item.active .hmb-chevron { opacity: 1; }

        /* Footer */
        .hmb-footer {
          padding: 14px 18px;
          border-top: 1px solid #EDE8FB;
          display: flex; align-items: center; justify-content: space-between;
        }
        .hmb-brand {
          font-size: 13px; font-weight: 800;
          background: linear-gradient(to right, #7C3AED, #EC4899);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          font-family: 'Syne', sans-serif;
          display: flex; align-items: center; gap: 6px;
        }
        .hmb-logout {
          font-size: 12px; font-weight: 600; color: #9A8CB0;
          background: none; border: none; cursor: pointer;
          padding: 5px 10px; border-radius: 8px;
          font-family: 'Figtree', sans-serif;
          transition: background 0.15s, color 0.15s;
        }
        .hmb-logout:active { background: #F3EFFD; color: #7C3AED; }

        /* Stagger */
        .hmb-drawer.open .hmb-item {
          animation: slideIn 0.28s ease both;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-14px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Only show drawer+backdrop on mobile */
        .hmb-backdrop, .hmb-drawer { display: none; }
        @media (max-width: 767px) {
          .hmb-backdrop, .hmb-drawer { display: flex; }
          .hmb-drawer { display: flex; flex-direction: column; }
        }
      `}</style>

      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 md:gap-4">

          {/* Hamburger button — solo mobile, integrado en el header */}
          <button
            className={`md:hidden flex flex-col items-center justify-center gap-[5px] w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex-shrink-0 cursor-pointer transition-all active:scale-90 ${drawerOpen ? 'hmb-open' : ''}`}
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label={drawerOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={drawerOpen}
            style={{ padding: 0 }}
          >
            <div className="hmb-line" />
            <div className="hmb-line" />
            <div className="hmb-line" />
          </button>

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

          {/* Spacer mobile */}
          <div className="flex-1 md:hidden" />

          {/* Íconos de acción */}
          <div className="flex items-center gap-1.5 md:gap-3">

            {/* Lupa mobile */}
            <button
              onClick={() => setShowMobileSearch(prev => !prev)}
              className="md:hidden w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center active:scale-95 transition-all"
              aria-label="Buscar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="white" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </button>

            {/* Chat */}
            <Link to="/mensajes" className="relative w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="white" strokeWidth="2.2" viewBox="0 0 24 24" className="w-4 h-4 md:w-5 md:h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.38 8.38 0 0 1 11.5 3h1A8.5 8.5 0 0 1 21 11.5z" />
              </svg>
              {chatUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-md">
                  {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                </span>
              )}
            </Link>

            {/* Notificaciones */}
            <button
              onClick={() => navigate('/notificaciones')}
              className="relative w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" className="w-4 h-4 md:w-5 md:h-5">
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
              <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-white/30 animate-pulse flex-shrink-0" />
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

        {/* Barra búsqueda mobile desplegable */}
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
      </header>

      {/* ── BACKDROP ─────────────────────────────────────────────── */}
      <div
        className={`hmb-backdrop ${drawerOpen ? 'open' : ''}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ── DRAWER ───────────────────────────────────────────────── */}
      <nav
        className={`hmb-drawer ${drawerOpen ? 'open' : ''}`}
        aria-label="Menú principal"
        inert={!drawerOpen ?true : undefined}
      >
        {/* Stripe */}
        <div className="hmb-stripe" />

        {/* Profile */}
        <div className="hmb-profile">
          <div className="hmb-avatar-box">
            {user?.avatar
              ? <img src={userAvatar} alt={userName} onError={e => { e.target.onerror = null; e.target.style.display = 'none'; }} />
              : userInitial
            }
          </div>
          <div className="hmb-user-info">
            <div className="hmb-user-name">{userName}</div>
            {userEmail && <div className="hmb-user-email">{userEmail}</div>}
          </div>
          <button className="hmb-profile-arrow" onClick={() => { navigate('/perfil'); setDrawerOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {/* Publish CTA */}
        <button className="hmb-publish" onClick={() => { if (onOpenModal) onOpenModal(); else navigate('/publicar'); setDrawerOpen(false); }}>
          <div className="hmb-publish-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          <div className="hmb-publish-texts">
            <span className="hmb-publish-title">Nueva publicación</span>
            <span className="hmb-publish-sub">Comparte con la comunidad</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

        {/* Section label */}
        <div className="hmb-section">Navegación</div>

        {/* Nav list */}
        <div className="hmb-list">
          {NAV_ITEMS.map((item, i) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                className={`hmb-item ${active ? 'active' : ''}`}
                style={{ '--item-color': item.color, '--item-bg': item.bgActive, animationDelay: drawerOpen ? `${i * 0.035}s` : '0s' }}
                onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                aria-current={active ? 'page' : undefined}
              >
                <div className="hmb-iconbox">
                  {NAV_ICONS[item.path]?.(active, item.color)}
                </div>
                <div className="hmb-texts">
                  <span className="hmb-label">{item.label}</span>
                  <span className="hmb-sublabel">{item.sublabel}</span>
                </div>
                <div className="hmb-chevron">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="hmb-footer">
          <div className="hmb-brand">
            <span>🐾</span><span>AdoptaPet</span>
          </div>
          <button className="hmb-logout" onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}>
            Cerrar sesión →
          </button>
        </div>
      </nav>

      {/* Notificación flotante */}
      {notification && (
        <div className="fixed top-20 right-4 z-[9999] bg-purple-500 text-white shadow-2xl px-5 py-3 rounded-2xl">
          <p className="font-bold text-sm">{notification}</p>
        </div>
      )}
    </>
  );
}