import React from 'react';

function RightSidebar() {
  const featuredPets = [
    { id: 1, name: 'Luna', breed: 'Pastor Alemán', image: 'https://placedog.net/100' },
    { id: 2, name: 'Michi', breed: 'Gato Persa', image: 'https://placekitten.com/100/100' },
    { id: 3, name: 'Rocky', breed: 'Labrador', image: 'https://placedog.net/101' }
  ];

  return (
    <aside className="hidden md:block md:col-span-3 space-y-4">
      
      {/* Mascotas sugeridas */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span>⭐</span> Mascotas destacadas
        </h3>
        
        <div className="space-y-3">
          {featuredPets.map(pet => (
            <div key={pet.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50 cursor-pointer transition">
              <img src={pet.image} className="w-12 h-12 rounded-full object-cover shadow-md" alt={pet.name} />
              <div className="flex-1">
                <p className="font-semibold text-sm">{pet.name}</p>
                <p className="text-xs text-gray-500">{pet.breed}</p>
              </div>
              <button className="text-purple-500 hover:text-purple-600">👁️</button>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 py-2 text-purple-600 hover:text-purple-700 font-medium text-sm">Ver más →</button>
      </div>

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