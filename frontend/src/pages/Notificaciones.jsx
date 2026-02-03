import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header.jsx';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import { Check, Trash2 } from 'lucide-react';
import { notificationService } from '../services/notificationService.js';

const Notificaciones = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null
  });

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    loadNotifications();
  }, [currentFilter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const filters = {};
      if (currentFilter === 'unread') {
        filters.read = 'false';
      } else if (currentFilter !== 'all') {
        filters.type = currentFilter;
      }
      
      const data = await notificationService.getNotifications(1, 50, filters);
      
      // Transformar notificaciones del backend al formato del componente
      const formattedNotifications = data.notifications.map(notif => ({
        id: notif._id,
        type: notif.type,
        icon: getIconForType(notif.type),
        title: notif.title,
        message: notif.message,
        time: formatTimeAgo(notif.createdAt),
        timestamp: new Date(notif.createdAt).getTime(),
        read: notif.read,
        color: getColorForType(notif.type),
        sender: notif.sender,
        relatedModel: notif.relatedModel,
        relatedId: notif.relatedId
      }));
      
      setNotifications(formattedNotifications);
      setUnreadCount(data.unreadCount);
      
      console.log('✅ Notificaciones cargadas:', formattedNotifications.length);
    } catch (error) {
      console.error('❌ Error al cargar notificaciones:', error);
      showToast('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  // Helpers para iconos y colores según tipo
  const getIconForType = (type) => {
    const icons = {
      'adoption_request': '🔔',
      'favorite': '❤️',
      'message': '📩',
      'adoption_accepted': '✅',
      'adoption_rejected': '❌',
      'system': 'ℹ️'
    };
    return icons[type] || '🔔';
  };

  const getColorForType = (type) => {
    const colors = {
      'adoption_request': 'yellow',
      'favorite': 'pink',
      'message': 'blue',
      'adoption_accepted': 'green',
      'adoption_rejected': 'red',
      'system': 'purple'
    };
    return colors[type] || 'gray';
  };

  // Formatear tiempo relativo
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Hace un momento';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} minutos`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} horas`;
    if (seconds < 2592000) return `Hace ${Math.floor(seconds / 86400)} días`;
    return `Hace ${Math.floor(seconds / 2592000)} meses`;
  };

  const getFilteredNotifications = () => {
    return notifications; // Ya vienen filtradas del backend
  };

  const getCounts = () => {
    // Recalcular desde todas las notificaciones (sin filtro)
    return {
      all: notifications.length,
      unread: unreadCount,
      adoption_request: notifications.filter(n => n.type === 'adoption_request').length,
      message: notifications.filter(n => n.type === 'message').length,
      system: notifications.filter(n => n.type === 'system').length
    };
  };

  const handleMarkAsRead = async (id) => {
    try {
      const notification = notifications.find(n => n.id === id);
      if (notification.read) return; // Ya está leída

      await notificationService.markAsRead(id);
      
      // Actualizar estado local
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      showToast('✓ Notificación marcada como leída');
    } catch (error) {
      console.error('❌ Error al marcar como leída:', error);
      showToast('Error al marcar notificación');
    }
  };

  const handleDelete = async (id, event) => {
    if (event) event.stopPropagation();
    const notification = notifications.find(n => n.id === id);

    setConfirmModal({
      isOpen: true,
      message: `¿Eliminar "${notification.title}"?`,
      onConfirm: async () => {
        try {
          await notificationService.deleteNotification(id);
          
          // Actualizar estado local
          setNotifications(notifications.filter(n => n.id !== id));
          if (!notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
          
          showToast('🗑️ Notificación eliminada');
          setConfirmModal({ isOpen: false, message: '', onConfirm: null });
        } catch (error) {
          console.error('❌ Error al eliminar:', error);
          showToast('Error al eliminar notificación');
          setConfirmModal({ isOpen: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return showToast('ℹ️ No hay notificaciones sin leer');

    setConfirmModal({
      isOpen: true,
      message: `¿Marcar ${unreadCount} como leídas?`,
      onConfirm: async () => {
        try {
          await notificationService.markAllAsRead();
          
          // Actualizar estado local
          setNotifications(notifications.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
          
          showToast('✓ Todas marcadas como leídas');
          setConfirmModal({ isOpen: false, message: '', onConfirm: null });
        } catch (error) {
          console.error('❌ Error al marcar todas:', error);
          showToast('Error al marcar notificaciones');
          setConfirmModal({ isOpen: false, message: '', onConfirm: null });
        }
      }
    });
  };

  const handleClearAll = () => {
    const readNotifications = notifications.filter(n => n.read);
    if (readNotifications.length === 0) {
      return showToast('ℹ️ No hay notificaciones leídas para eliminar');
    }

    setConfirmModal({
      isOpen: true,
      message: `¿Eliminar ${readNotifications.length} notificaciones leídas?`,
      onConfirm: async () => {
        try {
          const count = await notificationService.clearReadNotifications();
          
          // Recargar notificaciones
          await loadNotifications();
          
          showToast(`🗑️ ${count} notificaciones eliminadas`);
          setConfirmModal({ isOpen: false, message: '', onConfirm: null });
        } catch (error) {
          console.error('❌ Error al limpiar:', error);
          showToast('Error al limpiar notificaciones');
          setConfirmModal({ isOpen: false, message: '', onConfirm: null });
        }
      }
    });
  };

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
      pink: 'bg-pink-100 text-pink-600',
      red: 'bg-red-100 text-red-600'
    };
    return colors[color] || 'bg-gray-100 text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          {/* SIDEBAR IZQUIERDO - 3 columnas */}
          <div className="hidden md:block md:col-span-3">
            <Sidebar />
          </div>

          {/* CONTENIDO PRINCIPAL - 9 columnas */}
          <main className="col-span-1 md:col-span-9">
            
            {/* HEADER DEL LISTADO */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">🔔 Notificaciones</h1>
                  <p className="text-gray-600">Mantente al día con tus interacciones</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleMarkAllRead}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Marcar todas
                  </button>

                  <button
                    onClick={handleClearAll}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600 hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5" />
                    Limpiar leídas
                  </button>
                </div>
              </div>

              {/* TABS */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { key: 'all', label: 'Todas', count: counts.all },
                  { key: 'unread', label: 'No leídas', count: counts.unread },
                  { key: 'adoption_request', label: 'Adopciones', count: counts.adoption_request },
                  { key: 'message', label: 'Mensajes', count: counts.message },
                  { key: 'system', label: 'Sistema', count: counts.system }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setCurrentFilter(filter.key)}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                      currentFilter === filter.key
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
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
                  {currentFilter === 'all' 
                    ? 'Cuando recibas nuevas notificaciones, aparecerán aquí'
                    : `No hay notificaciones en "${currentFilter === 'unread' ? 'No leídas' : currentFilter}"`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    onClick={() => handleMarkAsRead(notification.id)}
                    className={`bg-white rounded-xl shadow-md p-6 cursor-pointer hover:shadow-xl transition-all ${
                      !notification.read ? 'border-l-4 border-purple-500' : ''
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
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <p className="text-gray-600 mb-2">{notification.message}</p>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{notification.time}</span>
                          {!notification.read && (
                            <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-semibold text-xs">
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
          
        </div>
      </div>

      <BottomNav />

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
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>

              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
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