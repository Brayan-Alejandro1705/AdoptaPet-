import { useState } from 'react';
import { X, MapPin, Calendar, Heart, Share2, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PetModal({ pet, onClose }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % pet.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + pet.images.length) % pet.images.length);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        
        {/* Header con botones */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{pet.name}</h2>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Heart className="w-5 h-5 text-gray-600 hover:text-red-500" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Galería de imágenes */}
        <div className="relative h-96 bg-gray-100">
          <img 
            src={pet.images[currentImageIndex]} 
            alt={pet.name}
            className="w-full h-full object-cover"
          />
          
          {/* Navegación de imágenes */}
          {pet.images.length > 1 && (
            <>
              <button 
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
              <button 
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>
              
              {/* Indicadores */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {pet.images.map((_, index) => (
                  <div 
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badge Featured */}
          {pet.featured && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
              ⭐ Destacado
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-6 md:p-8">
          
          {/* Info principal */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-3xl font-bold text-gray-800">{pet.name}</h3>
                <span className="text-3xl">{pet.gender === 'Macho' ? '♂️' : '♀️'}</span>
              </div>
              <p className="text-xl text-gray-600">{pet.breed}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Costo de adopción</p>
              <p className="text-2xl font-bold text-purple-600">{pet.adoption_fee}</p>
            </div>
          </div>

          {/* Características en grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-1">Tipo</p>
              <p className="font-bold text-blue-600">{pet.type}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-1">Tamaño</p>
              <p className="font-bold text-purple-600">{pet.size}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-1">Edad</p>
              <p className="font-bold text-green-600">{pet.age}</p>
            </div>
            <div className="bg-pink-50 p-4 rounded-xl text-center">
              <p className="text-sm text-gray-600 mb-1">Ubicación</p>
              <p className="font-bold text-pink-600">{pet.location}</p>
            </div>
          </div>

          {/* Estado de salud */}
          <div className="bg-gray-50 p-4 rounded-xl mb-6">
            <h4 className="font-bold text-gray-800 mb-3">Estado de Salud</h4>
            <div className="flex flex-wrap gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                pet.vaccinated ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {pet.vaccinated ? '✓' : '✗'} Vacunado
              </span>
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                pet.sterilized ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {pet.sterilized ? '✓' : '✗'} Esterilizado
              </span>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <h4 className="font-bold text-gray-800 mb-3 text-lg">Sobre {pet.name}</h4>
            <p className="text-gray-600 leading-relaxed">{pet.description}</p>
          </div>

          {/* Información de contacto */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl mb-6">
            <h4 className="font-bold text-gray-800 mb-4 text-lg">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Organización</p>
                  <p className="font-semibold text-gray-800">{pet.contact.organization}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 rounded-lg">
                  <Phone className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-semibold text-gray-800">{pet.contact.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Botón de adopción */}
          <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            ❤️ Quiero Adoptarlo
          </button>
        </div>
      </div>
    </div>
  );
}