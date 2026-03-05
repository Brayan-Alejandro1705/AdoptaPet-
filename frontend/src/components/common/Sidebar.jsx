import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PawPrint, FileText, Sparkles, Users, Heart, Settings, MessageCircle, LogOut } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/',              label: 'Inicio',         icon: Home,      color: 'text-blue-500' },
    { path: '/adoptar',       label: 'Adoptar',        icon: PawPrint,  color: 'text-orange-400' },
    { path: '/publicar',      label: 'Publicar',       icon: FileText,  color: 'text-indigo-500' },
    { path: '/adoptar/crear', label: 'Crear adopción', icon: Sparkles,  color: 'text-yellow-500' },
    { path: '/amigos',        label: 'Amigos',         icon: Users,     color: 'text-green-500' },
    { path: '/favoritos',     label: 'Favoritos',      icon: Heart,     color: 'text-red-500' },
    { path: '/ajustes',       label: 'Ajustes',        icon: Settings,  color: 'text-gray-400' }
  ];

  return (
    <aside className="hidden md:flex w-64 bg-white shadow-xl fixed left-0 top-16 bottom-0 p-5 flex-col z-40">
      <nav className="flex flex-col space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-md scale-[1.02]'
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:scale-[1.01]'
              }`}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : item.color}`}
                strokeWidth={2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Botón de opinión al fondo del sidebar */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <Link
          to="/feedback"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm ${
            location.pathname === '/feedback'
              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md scale-[1.02]'
              : 'bg-pink-50 text-pink-600 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-500 hover:text-white hover:scale-[1.01]'
          }`}
        >
          <MessageCircle
            className={`w-5 h-5 flex-shrink-0 ${location.pathname === '/feedback' ? 'text-white' : 'text-pink-500'}`}
            strokeWidth={2}
          />
          Danos tu opinión
        </Link>
        <button
          onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}
          className="w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 hover:scale-[1.01] transition-all duration-200"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 text-red-400" strokeWidth={2} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;