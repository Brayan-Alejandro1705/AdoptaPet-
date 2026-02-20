import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/',              label: 'Inicio',        icon: '🏠' },
    { path: '/adoptar',       label: 'Adoptar',       icon: '🐶' },
    { path: '/publicar',      label: 'Publicar',      icon: '📝' },
    { path: '/adoptar/crear', label: 'Crear adopción',icon: '🐾' },
    { path: '/amigos',        label: 'Amigos',        icon: '👥' },
    { path: '/ajustes',       label: 'Ajustes',       icon: '⚙️' }
  ];

  return (
    // hidden en móvil, visible desde md en adelante
    <aside className="hidden md:flex w-64 bg-white h-screen shadow-xl fixed left-0 top-16 p-5 flex-col z-40">
      <nav className="flex flex-col space-y-1.5">
        {navItems.map((item) => {
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
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;