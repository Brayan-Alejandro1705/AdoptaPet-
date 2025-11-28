import React from 'react';
//este codigo es de la pagina notificaciones
const NotificationFilters = ({ currentFilter, counts, onFilterChange }) => {
  const filters = [
    { id: 'all', label: 'Todas', count: counts.all },
    { id: 'unread', label: 'No leídas', count: counts.unread },
    { id: 'adoption', label: 'Adopciones', count: counts.adoption },
    { id: 'message', label: 'Mensajes', count: counts.message },
    { id: 'system', label: 'Sistema', count: counts.system }
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 whitespace-nowrap ${
            currentFilter === filter.id
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {filter.label}
          <span className="ml-1 bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-sm">
            {filter.count}
          </span>
        </button>
      ))}
    </div>
  );
};

export default NotificationFilters;