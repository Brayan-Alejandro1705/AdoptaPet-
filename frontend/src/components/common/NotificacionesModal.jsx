import React, { useState } from 'react';

const NotificacionesModal = ({ isOpen, onClose }) => {
  const [notificaciones, setNotificaciones] = useState({
    likes: true,
    comentarios: true,
    nuevosSeguidores: true,
    menciones: true,
    mensajes: true,
    email: false,
    push: true
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleNotificacion = (key) => {
    setNotificaciones(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleGuardar = async () => {
    setLoading(true);
    
    try {
      // Aquí conecta con tu API
      // const response = await fetch('/api/notifications/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(notificaciones)
      // });
      
      // Simulación de guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('✅ Configuración de notificaciones guardada');
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('❌ Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">🔔 Notificaciones</h2>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {/* Notificaciones de actividad */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 text-lg">Actividad</h3>
            
            <NotificationToggle 
              label="Likes en mis publicaciones"
              checked={notificaciones.likes}
              onChange={() => toggleNotificacion('likes')}
            />
            
            <NotificationToggle 
              label="Comentarios"
              checked={notificaciones.comentarios}
              onChange={() => toggleNotificacion('comentarios')}
            />
            
            <NotificationToggle 
              label="Nuevos seguidores"
              checked={notificaciones.nuevosSeguidores}
              onChange={() => toggleNotificacion('nuevosSeguidores')}
            />
            
            <NotificationToggle 
              label="Menciones"
              checked={notificaciones.menciones}
              onChange={() => toggleNotificacion('menciones')}
            />
            
            
          </div>

          {/* Canales de notificación */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-gray-700 text-lg">Canales</h3>
            
            <NotificationToggle 
              label="Notificaciones Push"
              checked={notificaciones.push}
              onChange={() => toggleNotificacion('push')}
            />
            
            <NotificationToggle 
              label="Notificaciones por Email"
              checked={notificaciones.email}
              onChange={() => toggleNotificacion('email')}
            />
          </div>

          {/* Botón Guardar */}
          <button 
            onClick={handleGuardar}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para los toggles
const NotificationToggle = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <span className="text-gray-700">{label}</span>
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default NotificacionesModal;