import { useState, useEffect } from 'react';
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
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });

  useEffect(() => { loadNotifications(); }, [currentFilter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (currentFilter === 'unread') filters.read = 'false';
      const data = await notificationService.getNotifications(1, 50, filters);

      let notificationsArray = [];
      let unreadTotal = 0;
      if (Array.isArray(data)) {
        notificationsArray = data;
        unreadTotal = data.filter(n => !n.read).length;
      } else if (data?.notifications) {
        notificationsArray = data.notifications;
        unreadTotal = data.unreadCount || 0;
      }

      const formattedNotifications = notificationsArray.map(notif => ({
        id: notif._id || notif.id,
        type: notif.type || 'system',
        icon: getIconForType(notif.type),
        title: notif.title || 'Notificación',
        message: notif.message || '',
        time: formatTimeAgo(notif.createdAt),
        timestamp: new Date(notif.createdAt).getTime(),
        read: notif.read || false,
        color: getColorForType(notif.type),
        sender: notif.sender,
      }));

      setNotifications(formattedNotifications);
      setUnreadCount(unreadTotal);
    } catch (error) {
      console.error('❌ Error al cargar notificaciones:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getIconForType = (type) => ({
    like: '❤️', comment: '💬', mention: '🔔', adoption_request: '🏡',
    adoption_accepted: '✅', adoption_rejected: '❌', message: '📩',
    favorite: '⭐', new_post: '📸', system: 'ℹ️'
  }[type] || '🔔');

  const getColorForType = (type) => ({
    like: 'pink', comment: 'blue', mention: 'purple', adoption_request: 'yellow',
    adoption_accepted: 'green', adoption_rejected: 'red', message: 'blue',
    favorite: 'yellow', new_post: 'purple', system: 'gray'
  }[type] || 'gray');

  const formatTimeAgo = (dateString) => {
    const s = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (s < 60) return 'Hace un momento';
    if (s < 3600) return `Hace ${Math.floor(s / 60)} min`;
    if (s < 86400) return `Hace ${Math.floor(s / 3600)} h`;
    if (s < 2592000) return `Hace ${Math.floor(s / 86400)} días`;
    return `Hace ${Math.floor(s / 2592000)} meses`;
  };

  const getColorClass = (color) => ({
    purple: 'bg-purple-100 text-purple-600', green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600', yellow: 'bg-yellow-100 text-yellow-600',
    pink: 'bg-pink-100 text-pink-600', red: 'bg-red-100 text-red-600',
    gray: 'bg-gray-100 text-gray-600'
  }[color] || 'bg-gray-100 text-gray-600');

  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-gray-800 text-white px-5 py-3 rounded-xl shadow-lg z-50 text-sm';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleMarkAsRead = async (id) => {
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.read) return;
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) { showToast('Error al marcar notificación'); }
  };

  const handleDelete = async (id, event) => {
    if (event) event.stopPropagation();
    const notification = notifications.find(n => n.id === id);
    if (!notification) return;
    setConfirmModal({
      isOpen: true, message: `¿Eliminar "${notification.title}"?`,
      onConfirm: async () => {
        try {
          await notificationService.deleteNotification(id);
          setNotifications(notifications.filter(n => n.id !== id));
          if (!notification.read) setUnreadCount(prev => Math.max(0, prev - 1));
          showToast('🗑️ Notificación eliminada');
        } catch { showToast('Error al eliminar'); }
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  const handleMarkAllRead = () => {
    if (unreadCount === 0) return showToast('ℹ️ No hay notificaciones sin leer');
    setConfirmModal({
      isOpen: true, message: `¿Marcar ${unreadCount} como leídas?`,
      onConfirm: async () => {
        try {
          await notificationService.markAllAsRead();
          setNotifications(notifications.map(n => ({ ...n, read: true })));
          setUnreadCount(0);
          showToast('✓ Todas marcadas como leídas');
        } catch { showToast('Error al marcar notificaciones'); }
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  const handleClearAll = () => {
    const readCount = notifications.filter(n => n.read).length;
    if (readCount === 0) return showToast('ℹ️ No hay notificaciones leídas para eliminar');
    setConfirmModal({
      isOpen: true, message: `¿Eliminar ${readCount} notificaciones leídas?`,
      onConfirm: async () => {
        try {
          const count = await notificationService.clearReadNotifications();
          await loadNotifications();
          showToast(`🗑️ ${count} notificaciones eliminadas`);
        } catch { showToast('Error al limpiar notificaciones'); }
        setConfirmModal({ isOpen: false, message: '', onConfirm: null });
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pb-20 md:pb-8">
        <div className="max-w-3xl mx-auto px-3 md:px-6 pt-4 md:pt-6">

          {/* Header */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">🔔 Notificaciones</h1>
                <p className="text-gray-500 text-sm mt-0.5">Mantente al día con tus interacciones</p>
              </div>
              {/* Botones acción — en móvil se achican */}
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={handleMarkAllRead}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-1.5 text-sm">
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Marcar todas</span>
                  <span className="sm:hidden">Leídas</span>
                </button>
                <button onClick={handleClearAll}
                  className="bg-red-500 text-white px-3 py-2 rounded-xl font-semibold hover:bg-red-600 transition-all flex items-center gap-1.5 text-sm">
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Limpiar leídas</span>
                </button>
              </div>
            </div>

            {/* Tabs filtro */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: `Todas (${notifications.length})` },
                { key: 'unread', label: `No leídas (${unreadCount})` }
              ].map(tab => (
                <button key={tab.key} onClick={() => setCurrentFilter(tab.key)}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all text-sm ${
                    currentFilter === tab.key
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista */}
          {notifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
              <div className="text-5xl mb-3">📭</div>
              <h3 className="text-xl font-bold text-gray-800 mb-1">No hay notificaciones</h3>
              <p className="text-gray-500 text-sm">
                {currentFilter === 'all' ? 'Cuando recibas nuevas notificaciones, aparecerán aquí' : 'No tienes notificaciones sin leer'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map(notification => (
                <div key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id)}
                  className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-all ${
                    !notification.read ? 'border-l-4 border-l-purple-500' : ''
                  }`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${getColorClass(notification.color)}`}>
                      {notification.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h3 className="font-bold text-gray-800 text-sm break-words">{notification.title}</h3>
                        <button onClick={(e) => handleDelete(notification.id, e)}
                          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm mb-1.5 break-words">{notification.message}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span>{notification.time}</span>
                        {!notification.read && (
                          <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-semibold">Nueva</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      {/* Modal confirmación */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmar acción</h3>
            <p className="text-gray-600 text-sm mb-5">{confirmModal.message}</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmModal({ isOpen: false, message: '', onConfirm: null })}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm">
                Cancelar
              </button>
              <button onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition text-sm">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notificaciones;