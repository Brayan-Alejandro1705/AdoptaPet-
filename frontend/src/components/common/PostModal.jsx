//este archivo es de la pagina adoptar

import { useState } from 'react';

export default function PostModal({ isOpen, onClose }) {
  const [postText, setPostText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [petInfo, setPetInfo] = useState({
    name: '',
    type: '',
    breed: '',
    age: '',
    forAdoption: false
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  const publishPost = () => {
    if (!postText.trim() && !imagePreview) {
      alert('Por favor escribe algo o agrega una imagen');
      return;
    }
    
    alert('¡Publicación creada exitosamente!');
    // Limpiar formulario
    setPostText('');
    setImagePreview(null);
    setPetInfo({ name: '', type: '', breed: '', age: '', forAdoption: false });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header del Modal */}
        <div className="sticky top-0 bg-white border-b px-4 md:px-6 py-3 md:py-4 flex items-center justify-between rounded-t-3xl md:rounded-t-2xl z-10">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Crear publicación</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 active:text-gray-600 text-2xl w-8 h-8 md:w-8 md:h-8 flex items-center justify-center hover:bg-gray-100 active:bg-gray-100 rounded-full transition"
          >
            ×
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-4 md:p-6">
          
          {/* Usuario */}
          <div className="flex items-center gap-3 mb-4">
            <img src="https://via.placeholder.com/48" className="w-11 h-11 md:w-12 md:h-12 rounded-full shadow-md" alt="Usuario" />
            <div>
              <p className="font-semibold text-sm md:text-base">Nombre de Usuario</p>
              <select className="text-xs md:text-sm bg-gray-100 px-3 py-1 rounded-2xl border outline-none">
                <option>🌍 Público</option>
                <option>👥 Amigos</option>
                <option>🔒 Solo yo</option>
              </select>
            </div>
          </div>

          {/* Texto de publicación */}
          <textarea 
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="¿Qué mascota quieres compartir hoy?"
            className="w-full min-h-[120px] md:min-h-[150px] p-3 md:p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-sm md:text-base text-gray-700"
          />

          {/* Preview de imagen */}
          {imagePreview && (
            <div className="mt-3 md:mt-4 relative">
              <img src={imagePreview} className="w-full rounded-xl max-h-64 md:max-h-96 object-cover" alt="Preview" />
              <button 
                onClick={removeImage}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white w-8 h-8 rounded-full hover:bg-opacity-90 active:bg-opacity-90 transition"
              >
                ×
              </button>
            </div>
          )}

          {/* Información de la mascota */}
          <div className="mt-4 bg-purple-50 rounded-xl p-3 md:p-4 border border-purple-100">
            <h3 className="font-semibold text-sm md:text-base text-purple-800 mb-3 flex items-center gap-2">
              <span>🐾</span> Información de la mascota <span className="text-xs text-gray-500">(opcional)</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
              <input 
                type="text" 
                placeholder="Nombre de la mascota" 
                value={petInfo.name}
                onChange={(e) => setPetInfo({...petInfo, name: e.target.value})}
                className="px-3 md:px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm md:text-base"
              />
              
              <select 
                value={petInfo.type}
                onChange={(e) => setPetInfo({...petInfo, type: e.target.value})}
                className="px-3 md:px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm md:text-base"
              >
                <option value="">Tipo de mascota</option>
                <option>🐕 Perro</option>
                <option>🐈 Gato</option>
                <option>🐰 Conejo</option>
                <option>🐦 Ave</option>
                <option>🐹 Otro</option>
              </select>
              
              <input 
                type="text" 
                placeholder="Raza" 
                value={petInfo.breed}
                onChange={(e) => setPetInfo({...petInfo, breed: e.target.value})}
                className="px-3 md:px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm md:text-base"
              />
              
              <input 
                type="text" 
                placeholder="Edad" 
                value={petInfo.age}
                onChange={(e) => setPetInfo({...petInfo, age: e.target.value})}
                className="px-3 md:px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 text-sm md:text-base"
              />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input 
                type="checkbox" 
                id="forAdoption" 
                checked={petInfo.forAdoption}
                onChange={(e) => setPetInfo({...petInfo, forAdoption: e.target.checked})}
                className="w-4 h-4 text-purple-600 rounded"
              />
              <label htmlFor="forAdoption" className="text-xs md:text-sm text-gray-700">Está disponible para adopción</label>
            </div>
          </div>

          {/* Opciones de publicación */}
          <div className="mt-4 border border-gray-200 rounded-xl p-3 md:p-4">
            <p className="text-xs md:text-sm font-semibold text-gray-600 mb-2 md:mb-3">Agregar a tu publicación</p>
            
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-50 hover:bg-purple-50 active:bg-purple-50 rounded-lg cursor-pointer transition border border-gray-200 hover:border-purple-300">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
                <span className="text-lg md:text-xl">📸</span>
                <span className="text-xs md:text-sm font-medium">Foto/Video</span>
              </label>
              
              <button className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-50 hover:bg-purple-50 active:bg-purple-50 rounded-lg transition border border-gray-200 hover:border-purple-300">
                <span className="text-lg md:text-xl">📍</span>
                <span className="text-xs md:text-sm font-medium">Ubicación</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer del Modal */}
        <div className="sticky bottom-0 bg-gray-50 px-4 md:px-6 py-3 md:py-4 rounded-b-3xl md:rounded-b-2xl">
          <button 
            onClick={publishPost}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-xl hover:from-purple-600 hover:to-pink-600 active:from-purple-600 active:to-pink-600 transition-all shadow-lg hover:shadow-xl"
          >
            Publicar
          </button>
        </div>

      </div>
    </div>
  );
}