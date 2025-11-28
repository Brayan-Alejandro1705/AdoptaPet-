import React from 'react';
//este codigo es de la pagina notificaciones
const EmptyNotifications = () => {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">📭</div>
      <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay notificaciones</h3>
      <p className="text-gray-600">Cuando recibas notificaciones, aparecerán aquí</p>
    </div>
  );
};

export default EmptyNotifications;