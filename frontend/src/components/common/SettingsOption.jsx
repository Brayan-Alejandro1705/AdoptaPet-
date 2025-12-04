// este codigo es de la pagina de Ajustes
import React from 'react';

const SettingsOption = ({ icon, title, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all border-b border-gray-100"
  >
    <span className="font-semibold text-gray-900 text-lg">{icon} {title}</span>
    <span className="text-gray-400 text-xl">›</span>
  </button>
);

export default SettingsOption;