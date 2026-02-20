import React from "react";

const ImagePreview = ({ images, clearImage, clearAll, disabled }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="mt-3 md:mt-4">
      {/* Header con botón limpiar todo */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 font-medium">{images.length} imagen{images.length > 1 ? 'es' : ''} seleccionada{images.length > 1 ? 's' : ''}</span>
        <button
          onClick={clearAll}
          disabled={disabled}
          className="text-xs text-red-500 hover:text-red-700 font-medium transition"
        >
          Quitar todas
        </button>
      </div>

      {/* Grid de imágenes */}
      <div className={`grid gap-2 ${
        images.length === 1 ? 'grid-cols-1' :
        images.length === 2 ? 'grid-cols-2' :
        images.length === 3 ? 'grid-cols-3' :
        images.length === 4 ? 'grid-cols-2' :
        'grid-cols-3'
      }`}>
        {images.map((img, index) => (
          <div key={index} className="relative group rounded-xl overflow-hidden bg-gray-100">
            <img
              src={img.preview}
              alt={`Imagen ${index + 1}`}
              className={`w-full object-cover rounded-xl ${images.length === 1 ? 'max-h-96' : 'h-36'}`}
            />
            {/* Overlay con botón eliminar */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition rounded-xl" />
            <button
              onClick={() => clearImage(index)}
              disabled={disabled}
              className="absolute top-1.5 right-1.5 w-7 h-7 bg-gray-900 bg-opacity-75 hover:bg-opacity-95 text-white rounded-full flex items-center justify-center text-sm font-bold transition opacity-0 group-hover:opacity-100"
            >
              ×
            </button>
            {/* Número de imagen */}
            <span className="absolute bottom-1.5 left-1.5 bg-black bg-opacity-50 text-white text-xs px-1.5 py-0.5 rounded-full">
              {index + 1}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImagePreview;