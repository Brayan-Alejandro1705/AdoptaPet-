import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

// ============================================================
// CONSTANTS
// ============================================================
const DEFAULT_NOTIFICATIONS = {
  likes: true,
  comments: true,
  followers: true,
  mentions: true,
  messages: true,
};

const NOTIFICATION_SECTIONS = [
  {
    title: 'Actividad',
    items: [
      { key: 'likes', label: 'Likes en mis publicaciones' },
      { key: 'comments', label: 'Comentarios' },
      { key: 'followers', label: 'Nuevos seguidores' },
      { key: 'mentions', label: 'Menciones' },
    ]
  },
  {
    title: 'Mensajes',
    items: [
      { key: 'messages', label: 'Nuevos mensajes' },
    ]
  },
];

// ============================================================
// COMPONENT - MAIN
// ============================================================
const NotificacionesModal = ({
  isOpen,
  onClose,
  notificationSettings,
  setNotificationSettings,
  onSave
}) => {
  // Hooks SIEMPRE arriba (no condicionales)
  const [loading, setLoading] = useState(false);

  // Si llega vacío, ponemos defaults UNA vez
  useEffect(() => {
    if (!notificationSettings) {
      setNotificationSettings(DEFAULT_NOTIFICATIONS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationSettings]);

  // ✅ Ahora sí: early return DESPUÉS de hooks
  if (!isOpen) return null;

  const current = notificationSettings || DEFAULT_NOTIFICATIONS;

  const toggleNotificacion = (key) => {
    setNotificationSettings(prev => ({
      ...(prev || DEFAULT_NOTIFICATIONS),
      [key]: !(prev?.[key])
    }));
  };

  const handleGuardar = async () => {
    setLoading(true);
    try {
      if (typeof onSave === 'function') {
        await onSave(); // hace el PUT real (desde Ajustes.jsx)
        toast.success('Configuración de notificaciones guardada');
      } else {
        toast.error('Falta conectar onSave desde Ajustes.jsx');
      }
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <HeaderModal onClose={onClose} />

        <div className="p-6 space-y-6">
          {NOTIFICATION_SECTIONS.map((section, index) => (
            <NotificationSection
              key={index}
              title={section.title}
              items={section.items}
              notificaciones={current}
              onToggle={toggleNotificacion}
            />
          ))}

          <SaveButton loading={loading} onSave={handleGuardar} />
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SUB-COMPONENTS
// ============================================================
const HeaderModal = ({ onClose }) => (
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
);

const NotificationSection = ({ title, items, notificaciones, onToggle }) => (
  <div className="space-y-4">
    <h3 className="font-semibold text-gray-700 text-lg">{title}</h3>

    {items.map((item) => (
      <NotificationToggle
        key={item.key}
        label={item.label}
        checked={!!notificaciones[item.key]}
        onChange={() => onToggle(item.key)}
      />
    ))}
  </div>
);

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

const SaveButton = ({ loading, onSave }) => (
  <button
    onClick={onSave}
    disabled={loading}
    className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {loading ? 'Guardando...' : 'Guardar cambios'}
  </button>
);

export default NotificacionesModal;
 