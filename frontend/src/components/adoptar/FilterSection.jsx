//este archivo es de la pagina adoptar
import React from 'react';

const FilterSection = ({ filters, onFilterChange, onApply }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">🔍 Filtrar búsqueda</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tipo de mascota
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="all">Todas</option>
            <option value="dog">Perros 🐕</option>
            <option value="cat">Gatos 🐱</option>
            <option value="other">Otros 🐰</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tamaño</label>
          <select
            value={filters.size}
            onChange={(e) => onFilterChange('size', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="all">Todos</option>
            <option value="small">Pequeño</option>
            <option value="medium">Mediano</option>
            <option value="large">Grande</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Edad</label>
          <select
            value={filters.age}
            onChange={(e) => onFilterChange('age', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
          >
            <option value="all">Todas</option>
            <option value="puppy">Cachorro</option>
            <option value="young">Joven</option>
            <option value="adult">Adulto</option>
            <option value="senior">Senior</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={onApply}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all duration-300 hover:shadow-lg"
          >
            Buscar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;