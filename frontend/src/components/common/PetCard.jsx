import { Heart, MapPin, Calendar } from 'lucide-react';

export default function PetCard({ pet, onViewDetails }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group">
      {/* Imagen */}
      <div className="relative h-64 overflow-hidden">
        <img 
          src={pet.images[0]} 
          alt={pet.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onClick={onViewDetails}
        />
        
        {/* Badge Featured */}
        {pet.featured && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            ⭐ Destacado
          </div>
        )}
        
        {/* Botón Favorito */}
        <button className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors">
          <Heart className="w-5 h-5 text-gray-600 hover:text-red-500 hover:fill-red-500 transition-colors" />
        </button>
      </div>

      {/* Info */}
      <div className="p-5" onClick={onViewDetails}>
        {/* Nombre y Género */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
          <span className="text-2xl">{pet.gender === 'Macho' ? '♂️' : '♀️'}</span>
        </div>

        {/* Raza */}
        <p className="text-gray-600 text-sm mb-3">{pet.breed}</p>

        {/* Características */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-medium">
            {pet.type}
          </span>
          <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-xs font-medium">
            {pet.size}
          </span>
          <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {pet.age}
          </span>
        </div>

        {/* Ubicación */}
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span>{pet.location}</span>
        </div>

        {/* Vacunación y Esterilización */}
        <div className="flex gap-2 mb-4">
          {pet.vaccinated && (
            <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded">
              ✓ Vacunado
            </span>
          )}
          {pet.sterilized && (
            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded">
              ✓ Esterilizado
            </span>
          )}
        </div>

        {/* Botón Ver Detalles */}
        <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 group-hover:scale-105">
          Ver Detalles
        </button>
      </div>
    </div>
  );
}