import React from 'react';

function FeaturedPetsMobile() {
  const pets = [
    { id: 1, name: 'Luna', breed: 'Pastor Alemán', image: 'https://placedog.net/200' },
    { id: 2, name: 'Michi', breed: 'Gato Persa', image: 'https://placekitten.com/200/200' },
    { id: 3, name: 'Rocky', breed: 'Labrador', image: 'https://placedog.net/201' }
  ];

  return (
    <div className="md:hidden bg-white rounded-2xl shadow-lg p-4">
      <h3 className="font-bold text-base mb-3 flex items-center gap-2">
        <span>⭐</span> Mascotas destacadas
      </h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {pets.map(pet => (
          <div key={pet.id} className="flex-shrink-0 w-32">
            <img src={pet.image} className="w-full h-32 rounded-xl object-cover shadow-md mb-2" alt={pet.name} />
            <p className="font-semibold text-sm truncate">{pet.name}</p>
            <p className="text-xs text-gray-500">{pet.breed}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FeaturedPetsMobile;