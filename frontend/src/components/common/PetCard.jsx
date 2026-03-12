import React, { useState, useEffect, useRef } from 'react';
import { Heart, Trash2, MapPin, Play } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PetCard = ({ pet, onClick, onDelete, currentUser }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoadingFav, setIsLoadingFav] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showVideo, setShowVideo] = useState(false); // ✅ alterna foto ↔ video
  const videoRef = useRef(null);

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || !pet._id) return;
        const res = await fetch(`${API_BASE}/api/favoritos/check/${pet._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setIsFavorite(data.isFavorite);
      } catch (error) {
        console.error('Error verificando favorito:', error);
      }
    };
    checkFavorite();
  }, [pet._id]);

  // Pausa el video al volver a la foto
  useEffect(() => {
    if (!showVideo && videoRef.current) videoRef.current.pause();
  }, [showVideo]);

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert('Debes iniciar sesión para guardar favoritos'); return; }
      setIsLoadingFav(true);
      const method = isFavorite ? 'DELETE' : 'POST';
      const res = await fetch(`${API_BASE}/api/favoritos/${pet._id}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setIsFavorite(!isFavorite);
        alert(isFavorite ? '💔 Quitado de favoritos' : '⭐ Agregado a favoritos');
      } else {
        alert(data.message || 'Error al procesar favorito');
      }
    } catch (error) {
      console.error('Error en favorito:', error);
      alert('Error al procesar favorito');
    } finally {
      setIsLoadingFav(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de que deseas eliminar a ${pet.name}?`)) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) { alert('Debes iniciar sesión'); return; }
      setIsDeleting(true);
      const res = await fetch(`${API_BASE}/api/pets/${pet._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ Mascota eliminada correctamente');
        if (onDelete) onDelete(pet._id);
      } else {
        alert(data.message || 'Error al eliminar mascota');
      }
    } catch (error) {
      console.error('Error eliminando mascota:', error);
      alert('Error al eliminar mascota');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleVideo = (e) => {
    e.stopPropagation();
    setShowVideo(v => !v);
  };

  const isOwner = currentUser && pet.owner &&
    (String(currentUser._id || currentUser.id) === String(pet.owner._id || pet.owner.id));

  const photoUrl = pet.mainPhoto || pet.photos?.[0] || null;
  const showImage = photoUrl && !imgError;
  const hasVideo = !!pet.video;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group relative"
    >
      {/* Imagen / Video de la mascota */}
      <div className="relative h-56 bg-gray-200 overflow-hidden">

        {/* VIDEO */}
        {hasVideo && showVideo ? (
          <video
            ref={videoRef}
            src={pet.video}
            controls
            autoPlay
            className="w-full h-full object-cover"
            onClick={e => e.stopPropagation()}
            onError={() => setShowVideo(false)}
          />
        ) : showImage ? (
          /* FOTO */
          <img
            src={photoUrl}
            alt={pet.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          /* PLACEHOLDER */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 gap-2">
            <span className="text-5xl">🐾</span>
            <span className="text-xs text-gray-400 font-medium">Sin foto</span>
          </div>
        )}

        {/* Estado disponible/Adoptado */}
        {pet.status && (
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
              pet.status === 'disponible' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {pet.status === 'disponible' ? 'Disponible' : 'Adoptado'}
            </span>
          </div>
        )}

        {/* Corazón favoritos */}
        <button
          onClick={handleFavoriteClick}
          disabled={isLoadingFav}
          className="absolute top-3 left-3 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-all active:scale-95"
          title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          <Heart
            className={`w-6 h-6 transition-colors ${
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
            }`}
            style={{ opacity: isLoadingFav ? 0.6 : 1 }}
          />
        </button>

        {/* ✅ Botón alternar foto ↔ video (solo si hay video) */}
        {hasVideo && (
          <button
            onClick={handleToggleVideo}
            className="absolute bottom-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg transition-all active:scale-95"
            style={{
              background: showVideo
                ? 'rgba(0,0,0,0.55)'
                : 'linear-gradient(135deg,#7c3aed,#ec4899)'
            }}
            title={showVideo ? 'Ver foto' : 'Ver video'}
          >
            {showVideo
              ? <><span>🖼️</span><span>Ver foto</span></>
              : <><Play className="w-3 h-3 fill-white" /><span>Ver video</span></>
            }
          </button>
        )}

        {/* Botón eliminar — solo propietario */}
        {isOwner && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute bottom-3 right-3 p-2 rounded-full bg-red-500 text-white shadow-md hover:bg-red-600 transition-all active:scale-95 opacity-0 group-hover:opacity-100"
            title="Eliminar mascota"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Información de la mascota */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{pet.name}</h3>
            <p className="text-sm text-gray-500">{pet.breed}</p>
          </div>
          {pet.gender && (
            <span className="text-sm font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
              {pet.gender === 'macho' ? '♂️ Macho' : '♀️ Hembra'}
            </span>
          )}
        </div>

        <div className="space-y-1 mb-4">
          {pet.ageFormatted && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Edad:</span> {pet.ageFormatted}
            </p>
          )}
          {pet.sizeFormatted && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Tamaño:</span> {pet.sizeFormatted}
            </p>
          )}
          {pet.location?.city && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{pet.location.city}</span>
            </div>
          )}
        </div>

        {(pet.vaccinated || pet.sterilized) && (
          <div className="flex gap-2 mb-4">
            {pet.vaccinated && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                ✓ Vacunado
              </span>
            )}
            {pet.sterilized && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                ✓ Esterilizado
              </span>
            )}
          </div>
        )}

        <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2.5 rounded-xl hover:shadow-lg transition-all active:scale-95">
          Ver detalles
        </button>
      </div>
    </div>
  );
};

export default PetCard;