//este archivo es de la pagina adoptar

import React from 'react';

const PetCard = ({ pet, onToggleFavorite, onOpenModal, onQuickAdopt }) => {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:-translate-y-1">
      <div className="relative overflow-hidden">
        <img
          src={pet.image}
          alt={pet.name}
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
          onClick={() => onOpenModal(pet.id)}
        />
        <button
          onClick={(e) => onToggleFavorite(pet.id, e)}
          className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform"
        >
          <span className="text-xl">{pet.favorite ? '❤️' : '🤍'}</span>
        </button>
      </div>
      
      <div className="p-4" onClick={() => onOpenModal(pet.id)}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-0.5">{pet.name}</h3>
            <p className="text-gray-600 text-xs">{pet.breed}</p>
          </div>
          <span className="text-2xl">{pet.type === 'dog' ? '🐕' : '🐱'}</span>
        </div>
        
        <div className="flex gap-1.5 mb-3 flex-wrap">
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
            {pet.ageName}
          </span>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            {pet.sizeName}
          </span>
          <span className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full text-xs font-semibold">
            {pet.gender}
          </span>
        </div>
        
        <p className="text-gray-600 text-xs mb-3 line-clamp-2">{pet.description}</p>
        
        <div className="flex gap-2">
          <button
            onClick={(e) => onQuickAdopt(pet.id, e)}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all text-xs"
          >
            Adoptar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenModal(pet.id);
            }}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all text-xs"
          >
            Ver más
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetCard;
