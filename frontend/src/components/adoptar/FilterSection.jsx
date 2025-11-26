import { Search, SlidersHorizontal, X } from 'lucide-react';

export default function FilterSection({ filters, onFilterChange, onClearFilters }) {
  const handleChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-800">Filtros</h3>
          {activeFiltersCount > 0 && (
            <span className="bg-purple-100 text-purple-600 text-xs font-semibold px-2 py-1 rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <button 
            onClick={onClearFilters}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-purple-600 transition-colors"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Búsqueda por nombre */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Grid de filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Tipo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tipo de Mascota
          </label>
          <select
            value={filters.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white cursor-pointer"
          >
            <option value="">Todos</option>
            <option value="Perro">🐕 Perros</option>
            <option value="Gato">🐱 Gatos</option>
            <option value="Ave">🦜 Aves</option>
            <option value="Conejo">🐰 Conejos</option>
            <option value="Otro">🐾 Otros</option>
          </select>
        </div>

        {/* Tamaño */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tamaño
          </label>
          <select
            value={filters.size}
            onChange={(e) => handleChange('size', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white cursor-pointer"
          >
            <option value="">Todos</option>
            <option value="Pequeño">Pequeño</option>
            <option value="Mediano">Mediano</option>
            <option value="Grande">Grande</option>
          </select>
        </div>

        {/* Edad */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Edad
          </label>
          <select
            value={filters.age}
            onChange={(e) => handleChange('age', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white cursor-pointer"
          >
            <option value="">Todas</option>
            <option value="Cachorro">Cachorro (0-1 año)</option>
            <option value="Joven">Joven (1-3 años)</option>
            <option value="Adulto">Adulto (3-7 años)</option>
            <option value="Senior">Senior (7+ años)</option>
          </select>
        </div>

        {/* Ubicación */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ubicación
          </label>
          <select
            value={filters.location}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all bg-white cursor-pointer"
          >
            <option value="">Todas las ciudades</option>
            <option value="Bogotá">Bogotá</option>
            <option value="Medellín">Medellín</option>
            <option value="Cali">Cali</option>
            <option value="Barranquilla">Barranquilla</option>
            <option value="Cartagena">Cartagena</option>
            <option value="Bucaramanga">Bucaramanga</option>
            <option value="Pereira">Pereira</option>
            <option value="Manizales">Manizales</option>
          </select>
        </div>
      </div>

      {/* Filtros adicionales (checkboxes) */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.featured}
              onChange={(e) => handleChange('featured', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-purple-600 transition-colors">
              ⭐ Solo destacados
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.vaccinated}
              onChange={(e) => handleChange('vaccinated', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-purple-600 transition-colors">
              ✓ Vacunados
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={filters.sterilized}
              onChange={(e) => handleChange('sterilized', e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700 group-hover:text-purple-600 transition-colors">
              ✓ Esterilizados
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}