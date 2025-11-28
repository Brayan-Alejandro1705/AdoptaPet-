import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header.jsx';
import NotificationCard from '../components/common/notificationcard.jsx';
import EmptyNotifications from '../components/common/EmptyNotifications.jsx';
import Notificationcard from '../components/common/notificationcard.jsx';
import ConfirmModal from '../components/common/ConfirmModal.jsx';
import { Check, Trash2 } from 'lucide-react';


const Notificaciones = () => {

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'adoption',
      icon: '🔔',
      title: 'Nueva solicitud de adopción',
      message: 'María García está interesada en adoptar a Luna.',
      time: 'Hace 5 minutos',
      timestamp: null,
      offset: 5 * 60 * 1000,
      read: false,
      color: 'yellow',
    },
    {
      id: 2,
      type: 'adoption',
      icon: '🔔',
      title: 'Nueva solicitud de adopción',
      message: 'Carlos Herrera quiere adoptar a Coco.',
      time: 'Hace 2 horas',
      timestamp: null,
      offset: 2 * 60 * 60 * 1000,
      read: false,
      color: 'green',
    },
    {
      id: 3,
      type: 'adoption',
      icon: '🔔',
      title: 'Nueva solicitud de adopción',
      message: 'Ana López ha mostrado interés en Toby.',
      time: 'Hace 10 minutos',
      timestamp: null,
      offset: 10 * 60 * 1000,
      read: false,
      color: 'blue',
    },
   
    {
      id: 5,
      type: 'adoption',
      icon: '❤️',
      title: 'Nuevo favorito',
      message: 'Pedro Ramírez agregó a Max a sus favoritos',
      time: 'Hace 5 horas',
      timestamp: null,
      offset: 5 * 60 * 60 * 1000,
      read: true,
      color: 'pink',
    },
    {
      id: 6,
      type: 'message',
      icon: '📩',
      title: 'Consulta sobre mascota',
      message: 'Tienes una nueva consulta pendiente de respuesta',
      time: 'Hace 1 día',
      timestamp: null,
      offset: 24 * 60 * 60 * 1000,
      read: true,
      color: 'blue',
    }
  ]);

  // Establecer timestamps al cargar
// Establecer timestamps al cargar
useEffect(() => {
  const now = Date.now();

  setNotifications(prev => {
    const list = Array.isArray(prev) ? prev : [];
    return list.map(n => ({
      ...n,
      timestamp: n.offset ? now - n.offset : now
    }));
  });
}, []);


  const [currentFilter, setCurrentFilter] = useState('all');

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  // FILTROS
  const getFilteredNotifications = () => {
    if (currentFilter === 'unread') {
      return notifications.filter(n => !n.read);
    } else if (currentFilter !== 'all') {
      return notifications.filter(n => n.type === currentFilter);
    }
    return notifications;
  };

  // CONTADORES
  const getCounts = () => ({
    all: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    adoption: notifications.filter(n => n.type === 'adoption').length,
    message: notifications.filter(n => n.type === 'message').length,
    system: notifications.filter(n => n.type === 'system').length
  });

  // MARCAR UNA NOTIFICACIÓN
  const handleMarkAsRead = (id) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    showToast('✓ Notificación marcada como leída');
  };

  // ELIMINAR
  const handleDelete = (id, event) => {
    if (event) event.stopPropagation();

    const notification = notifications.find(n => n.id === id);

    setConfirmModal({
      isOpen: true,
      message: `¿Eliminar "${notification.title}"?`,
      onConfirm: () => {
        setNotifications(notifications.filter(n => n.id !== id));
        showToast('🗑️ Notificación eliminada');
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  // MARCAR TODAS
  const handleMarkAllRead = () => {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount === 0) return showToast('ℹ️ No hay notificaciones sin leer');

    setConfirmModal({
      isOpen: true,
      message: `¿Marcar ${unreadCount} como leídas?`,
      onConfirm: () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
        showToast('✓ Todas marcadas como leídas');
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  // LIMPIAR TODO
  const handleClearAll = () => {
    if (notifications.length === 0) return showToast('ℹ️ No hay notificaciones');

    setConfirmModal({
      isOpen: true,
      message: `¿Eliminar las ${notifications.length} notificaciones?`,
      onConfirm: () => {
        setNotifications([]);
        showToast('🗑️ Todas eliminadas');
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  // TOAST
  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className =
      'fixed top-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('animate-slide-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const filteredNotifications = getFilteredNotifications();
  const counts = getCounts();

  const getColorClass = (color) => {
    const colors = {
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      blue: 'bg-blue-100 text-blue-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      pink: 'bg-pink-100 text-pink-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-purple-600 text-white py-4 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">🐾 AdoptaPet</h1>
          <nav className="flex gap-4">
            <a className="hover:text-purple-200">Inicio</a>
            <a className="hover:text-purple-200">Mascotas</a>
            <a className="hover:text-purple-200">Notificaciones</a>
          </nav>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* HEADER DEL LISTADO */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">🔔 Notificaciones</h1>
              <p className="text-gray-600">Mantente al día con tus interacciones</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleMarkAllRead}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-all duration-300 flex items-center gap-2"
              >
                <Check className="w-5 h-5" />
                Marcar todas
              </button>

              <button
                onClick={handleClearAll}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300 flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Limpiar
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'Todas', count: counts.all },
              { key: 'unread', label: 'No leídas', count: counts.unread },
              { key: 'adoption', label: 'Adopciones', count: counts.adoption },
              { key: 'message', label: 'Mensajes', count: counts.message },
              { key: 'system', label: 'Sistema', count: counts.system }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setCurrentFilter(filter.key)}
                className={`px-4 py-2 rounded-lg font-semibold ${
                  currentFilter === filter.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* LISTADO */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No hay notificaciones</h3>
            <p className="text-gray-600">
              Cuando recibas nuevas notificaciones, aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => handleMarkAsRead(notification.id)}
                className={`bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-xl transition-all ${
                  !notification.read ? 'border-l-4 border-purple-600' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${getColorClass(
                      notification.color
                    )}`}
                  >
                    {notification.icon}
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-800">
                        {notification.title}
                      </h3>

                      <button
                        onClick={(e) => handleDelete(notification.id, e)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-gray-600 mb-2">{notification.message}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{notification.time}</span>
                      {!notification.read && (
                        <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-semibold">
                          Nueva
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-800 text-white py-8 text-center mt-12">
        <p>&copy; 2025 AdoptaPet. Todos los derechos reservados.</p>
      </footer>

      {/* MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-scale-in">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar acción</h3>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() =>
                  setConfirmModal({ isOpen: false, message: '', onConfirm: null })
                }
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
              >
                Cancelar
              </button>

              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ANIMACIONES */}
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-slide-out { animation: slide-out 0.3s ease-in; }
        .animate-scale-in { animation: scale-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default Notificaciones;
