//este archivo es de la pagina adoptar
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Inicio', icon: '🏠' },
    { path: '/adoptar', label: 'Adoptar', icon: '🐶' },
    { path: '/publicar', label: 'Publicar', icon: '📝' },
    { path: '/amigos', label: 'Amigos', icon: '👥' },
    { path: '/ajustes', label: 'Ajustes', icon: '⚙️' }
  ];

  const categories = [
    { label: 'Perros', icon: '🐕' },
    { label: 'Gatos', icon: '🐈' },
    { label: 'Otros', icon: '🐰' }
  ];

  return (
    <aside className="w-64 bg-white h-screen shadow-xl fixed left-0 top-16 p-6 flex flex-col">
      <nav className="flex flex-col space-y-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                isActive
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow-md'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-10">
        <h2 className="text-sm font-bold text-gray-500 mb-3">CATEGORÍAS</h2>
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <button
              key={category.label}
              className="flex items-center gap-2 text-left px-2 py-1 text-gray-700 hover:text-purple-600 transition"
            >
              {category.icon} {category.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;