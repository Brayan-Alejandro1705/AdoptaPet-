import React, { useState } from 'react';
import { X, MapPin, Calendar, Heart, MessageCircle, Phone, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PetModal = ({ pet, onClose }) => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!pet) return null;

  const petId = pet._id || pet.id;

  const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3Crect width="600" height="400" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="24" fill="%239ca3af"%3ESin Foto%3C/text%3E%3C/svg%3E';

  const getPhotos = () => {
    if (imageError) return [fallbackImage];
    if (pet.photos && Array.isArray(pet.photos) && pet.photos.length > 0) return pet.photos;
    if (pet.mainPhoto) return [pet.mainPhoto];
    return [fallbackImage];
  };

  const photos = getPhotos();

  // =============================================
  // HANDLER: SOLO ABRIR CHAT (botón "Enviar mensaje")
  // =============================================
  const handleSendMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      if (!token || !currentUser.id) {
        alert('Debes iniciar sesión para enviar mensajes');
        return;
      }
      if (!pet.owner) {
        alert('No se puede contactar al dueño de esta mascota');
        return;
      }

      const ownerId = pet.owner._id || pet.owner.id || pet.owner;
      if (!ownerId) {
        alert('No se puede contactar al dueño de esta mascota');
        return;
      }
      if (String(ownerId) === String(currentUser.id)) {
        alert('No puedes enviarte mensajes a ti mismo');
        return;
      }

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otherUserId: ownerId })
      });

      const data = await response.json();

      if (response.ok) {
        const chatId = data._id || data.id;
        navigate(`/mensajes?chat=${chatId}`);
        onClose();
      } else {
        throw new Error(data.error || data.message || 'Error al crear chat');
      }
    } catch (error) {
      console.error('❌ Error al crear chat:', error);
      alert(`Error al abrir el chat: ${error.message}`);
    }
  };

  const handleToggleFavorite = () => setIsFavorite(!isFavorite);

  return (
    <>
      {/* MODAL PRINCIPAL */}
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl">

          <div className="relative">
            <div className="relative h-96 bg-gray-200 rounded-t-2xl overflow-hidden">
              <img
                src={photos[currentImageIndex]}
                alt={pet.name}
                className="w-full h-full object-cover"
                onError={(e) => { if (!imageError) { e.target.onerror = null; setImageError(true); } }}
              />

              {photos.length > 1 && (
                <>
                  <button onClick={() => setCurrentImageIndex((currentImageIndex - 1 + photos.length) % photos.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition">←
                  </button>
                  <button onClick={() => setCurrentImageIndex((currentImageIndex + 1) % photos.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition">→
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {photos.map((_, index) => (
                      <button key={index} onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition ${index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}

              <button onClick={onClose}
                className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-800 rounded-full p-3 shadow-xl transition-all z-10 border-2 border-gray-200">
                <X className="w-6 h-6" />
              </button>

              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  pet.status === 'available' || pet.status === 'disponible' ? 'bg-green-500 text-white' :
                  pet.status === 'pending' || pet.status === 'en-proceso' ? 'bg-yellow-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {pet.status === 'available' || pet.status === 'disponible' ? 'Disponible' :
                   pet.status === 'pending' || pet.status === 'en-proceso' ? 'En proceso' : 'No disponible'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{pet.name}</h2>
                <p className="text-gray-600 text-lg">{pet.breed} • {pet.genderFormatted || pet.gender}</p>
              </div>
              <button onClick={handleToggleFavorite} className="text-3xl hover:scale-110 transition-transform">
                <Heart className={`w-8 h-8 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
            </div>

            <div className="flex gap-2 flex-wrap mb-6">
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">{pet.type}</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">{pet.sizeFormatted || pet.size}</span>
              <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">{pet.ageFormatted || pet.age}</span>
              {pet.vaccinated && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Vacunado
                </span>
              )}
              {pet.sterilized && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Esterilizado
                </span>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-3">📝 Descripción</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{pet.description || 'Sin descripción disponible.'}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {pet.location?.city && (
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg"><MapPin className="w-5 h-5 text-purple-600" /></div>
                  <div><p className="font-semibold text-gray-800">Ubicación</p><p className="text-gray-600">{pet.location.city}</p></div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg"><Calendar className="w-5 h-5 text-blue-600" /></div>
                <div><p className="font-semibold text-gray-800">Edad</p><p className="text-gray-600">{pet.ageFormatted || pet.age}</p></div>
              </div>
              {pet.contact?.phone && pet.contact.phone !== 'No disponible' && (
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg"><Phone className="w-5 h-5 text-green-600" /></div>
                  <div><p className="font-semibold text-gray-800">Contacto</p><p className="text-gray-600">{pet.contact.phone}</p></div>
                </div>
              )}
              {pet.contact?.organization && (
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-100 p-2 rounded-lg"><span className="text-xl">👤</span></div>
                  <div><p className="font-semibold text-gray-800">Publicado por</p><p className="text-gray-600">{pet.contact.organization}</p></div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex gap-3">
                <button onClick={handleSendMessage}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Enviar mensaje
                </button>
              </div>

              <button onClick={onClose}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all">
                Cerrar
              </button>
            </div>

            {pet.adoptionFee && pet.adoptionFee !== '$0' && (
              <div className="mt-4 text-center text-gray-600 text-sm">
                Tarifa de adopción: <span className="font-semibold">{pet.adoptionFee}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PetModal;