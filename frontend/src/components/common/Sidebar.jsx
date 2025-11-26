import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar({ onOpenModal }) {
  return (
    <aside className="hidden md:block md:col-span-3 space-y-2">
      <Link to="/" className="block px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold shadow-lg hover-lift">
        🏠 Inicio
      </Link>
      <Link to="/adoptar" className="block px-5 py-3 rounded-xl bg-white hover:bg-purple-50 font-semibold shadow hover-lift transition">
        🐕 Adoptar
      </Link>
      <button 
        onClick={onOpenModal}
        className="w-full text-left block px-5 py-3 rounded-xl bg-white hover:bg-purple-50 font-semibold shadow hover-lift transition"
      >
        📝 Publicar
      </button>
      <Link to="/amigos" className="block px-5 py-3 rounded-xl bg-white hover:bg-purple-50 font-semibold shadow hover-lift transition">
        👥 Amigos
      </Link>
      <Link to="/ajustes" className="block px-5 py-3 rounded-xl bg-white hover:bg-purple-50 font-semibold shadow hover-lift transition">
        ⚙️ Ajustes
      </Link>
      
      <div className="mt-6 pt-4 border-t">
        <h3 className="px-2 text-sm font-bold text-gray-500 uppercase mb-2">Categorías</h3>
        <Link to="/perros" className="block px-5 py-2 rounded-lg hover:bg-purple-50 text-gray-700 transition">🐕 Perros</Link>
        <Link to="/gatos" className="block px-5 py-2 rounded-lg hover:bg-purple-50 text-gray-700 transition">🐈 Gatos</Link>
        <Link to="/otros" className="block px-5 py-2 rounded-lg hover:bg-purple-50 text-gray-700 transition">🐰 Otros</Link>
      </div>
    </aside>
  );
}

export default Sidebar;