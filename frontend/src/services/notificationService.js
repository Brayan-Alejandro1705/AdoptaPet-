const API_URL = 'http://${import.meta.env.VITE_API_URL || 'http://localhost:5000'}:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const notificationService = {
  // Obtener todas las notificaciones
  getNotifications: async (page = 1, limit = 50, filters = {}) => {
    try {
      console.log('🔍 Obteniendo notificaciones...');
      
      const response = await fetch(`${API_URL}/notifications`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Notificaciones recibidas:', data);
      
      // El backend devuelve un array directamente
      return {
        notifications: Array.isArray(data) ? data : [],
        unreadCount: Array.isArray(data) ? data.filter(n => !n.read).length : 0
      };
    } catch (error) {
      console.error('❌ Error en getNotifications:', error);
      return { notifications: [], unreadCount: 0 };
    }
  },

  // Obtener contador de notificaciones no leídas
  getUnreadCount: async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        return 0;
      }
      
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('❌ Error en getUnreadCount:', error);
      return 0;
    }
  },

  // Marcar notificación como leída
  markAsRead: async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.notification || data;
    } catch (error) {
      console.error('❌ Error en markAsRead:', error);
      throw error;
    }
  },

  // Marcar todas las notificaciones como leídas
  markAllAsRead: async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('❌ Error en markAllAsRead:', error);
      throw error;
    }
  },

  // Eliminar una notificación
  deleteNotification: async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Error en deleteNotification:', error);
      throw error;
    }
  },

  // Eliminar todas las notificaciones leídas
  clearReadNotifications: async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/clear-read`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('❌ Error en clearReadNotifications:', error);
      throw error;
    }
  }
};