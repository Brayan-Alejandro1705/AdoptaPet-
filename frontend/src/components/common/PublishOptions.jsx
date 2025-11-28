import React from "react";

const PublishOptions = ({ handleImage }) => {
  return (
    <div className="mt-4 border border-gray-200 rounded-xl p-3 md:p-4">
      <p className="text-xs md:text-sm font-semibold text-gray-600 mb-2">Agregar a tu publicación</p>

      <div className="flex flex-wrap gap-2">
        <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-purple-50 rounded-lg cursor-pointer border transition">
          <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <span className="text-lg">📸</span>
          <span className="text-xs md:text-sm font-medium">Foto/Video</span>
        </label>

        <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-purple-50 rounded-lg border transition">
          <span className="text-lg">📍</span>
          <span className="text-xs md:text-sm font-medium">Ubicación</span>
        </button>
      </div>
    </div>
  );
};

export default PublishOptions;
