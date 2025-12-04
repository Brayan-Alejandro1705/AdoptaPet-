// este codigo es de la pagina de Ajustes
import React from 'react';

const SubOption = ({ title, description, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
  >
    <div className="text-left">
      <p className="font-medium text-gray-900">{title}</p>
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
    </div>
    {onClick && <span className="text-gray-400">›</span>}
  </button>
);

export default SubOption;