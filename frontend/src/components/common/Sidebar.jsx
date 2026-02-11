import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react'; // ✅ Importar icono

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Inicio', icon: '🏠' },
    { path: '/adoptar', label: 'Adoptar', icon: '🐶' },
    { path: '/publicar', label: 'Publicar', icon: '📝' },
    { path: '/adoptar/crear', label: 'Crear adopción', icon: '🐾' },
    
    // ✅ NUEVO - ASISTENTE IA
    { path: '/ai-assistant', label: 'Asistente IA', icon: '🤖', gradient: true },
    
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
          
          // ✅ Estilo especial para IA
          if (item.gradient) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-lg'
                    : 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-500 hover:to-pink-500 hover:text-white'
                }`}
              >
                {/* Efecto de brillo */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
                )}
                <span className="relative z-10">{item.icon} {item.label}</span>
                {!isActive && (
                  <Sparkles className="w-4 h-4 ml-auto animate-pulse" />
                )}
              </Link>
            );
          }
          
          // Estilo normal para otros items
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