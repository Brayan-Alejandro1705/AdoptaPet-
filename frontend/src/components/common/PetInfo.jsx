import React from "react";

const PetInfo = ({ petData, setPetData }) => {

  const handleChange = (e) => {
    setPetData({ ...petData, [e.target.name]: e.target.value });
  };

  return (
    <div className="mt-4 bg-purple-50 rounded-xl p-3 md:p-4 border border-purple-100">
      <h3 className="font-semibold text-sm md:text-base text-purple-800 mb-3 flex items-center gap-2">
        🐾 Información de la mascota 
        <span className="text-xs text-gray-500">(opcional)</span>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
        <input
          name="nombre"
          onChange={handleChange}
          type="text"
          placeholder="Nombre de la mascota"
          className="px-3 md:px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400"
        />

        <select
          name="tipo"
          onChange={handleChange}
          className="px-3 md:px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400"
        >
          <option value="">Tipo de mascota</option>
          <option>🐕 Perro</option>
          <option>🐈 Gato</option>
          <option>🐰 Conejo</option>
          <option>🐦 Ave</option>
          <option>🐹 Otro</option>
        </select>

        <input
          name="raza"
          onChange={handleChange}
          type="text"
          placeholder="Raza"
          className="px-3 md:px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400"
        />

        <input
          name="edad"
          onChange={handleChange}
          type="text"
          placeholder="Edad"
          className="px-3 md:px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="checkbox"
          name="adopcion"
          checked={petData.adopcion}
          onChange={(e) => setPetData({ ...petData, adopcion: e.target.checked })}
          className="w-4 h-4 text-purple-600"
        />
        <label className="text-xs md:text-sm text-gray-700">
          Está disponible para adopción
        </label>
      </div>
    </div>
  );
};

export default PetInfo;
