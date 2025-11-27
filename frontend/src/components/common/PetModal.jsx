//este archivo es de la pagina adoptar

import React from 'react';

const PetModal = ({ pet, isOpen, onClose, onToggleFavorite, onAdopt, onContact }) => {
  if (!isOpen || !pet) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <img
            src={pet.image}
            alt={pet.name}
            className="w-full h-64 object-cover rounded-t-2xl"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{pet.name}</h2>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  {pet.typeName}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                  {pet.sizeName}
                </span>
                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">
                  {pet.ageName}
                </span>
              </div>
            </div>
            <button
              onClick={onToggleFavorite}
              className="text-3xl hover:scale-110 transition-transform"
            >
              {pet.favorite ? '❤️' : '🤍'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">📝 Descripción</h3>
              <p className="text-gray-600">{pet.description}</p>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">✨ Características</h3>
              <div className="grid grid-cols-2 gap-2">
                {pet.features.map((feature, index) => (
                  <div key={index} className="bg-gray-100 px-3 py-2 rounded-lg text-sm text-gray-700">
                    ✓ {feature}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">📍 Ubicación</h3>
              <p className="text-gray-600">{pet.location}</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onAdopt}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all hover:shadow-lg"
              >
                💚 Solicitar Adopción
              </button>
              <button
                onClick={onContact}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all hover:shadow-lg"
              >
                💬 Contactar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetModal;