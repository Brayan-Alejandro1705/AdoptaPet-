import React from 'react';

function RightSidebar() {
  return (
    <aside className="hidden md:block md:col-span-3 space-y-4">
      
      

      {/* Enlaces útiles */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <h3 className="font-bold text-sm mb-3 text-gray-500 uppercase">Enlaces útiles</h3>
        <div className="space-y-2 text-sm">
          <a href="#" className="block text-gray-600 hover:text-purple-600 transition">Sobre nosotros</a>
          <a href="#" className="block text-gray-600 hover:text-purple-600 transition">Ayuda</a>
          <a href="#" className="block text-gray-600 hover:text-purple-600 transition">Términos</a>
          <a href="#" className="block text-gray-600 hover:text-purple-600 transition">Privacidad</a>
        </div>
        <p className="text-xs text-gray-400 mt-4">© 2025 AdoptaPet</p>
      </div>
    </aside>
  );
}

export default RightSidebar;