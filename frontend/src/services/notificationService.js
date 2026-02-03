const API_URL = 'http://127.0.0.1:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const notificationService = {
  // Obtener todas las notificaciones
  getNotifications: async (page = 1, limit = 20, filters = {}) => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await fetch(`${API_URL}/notifications?${queryParams}`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al obtener notificaciones');
      }
      
      return data.data;
    } catch (error) {
      console.error('❌ Error en getNotifications:', error);
      throw error;
    }
  },

  // Obtener contador de notificaciones no leídas
  getUnreadCount: async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al obtener contador');
      }
      
      return data.data.count;
    } catch (error) {
      console.error('❌ Error en getUnreadCount:', error);
      throw error;
    }
  },

  // Marcar notificación como leída
  markAsRead: async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al marcar notificación');
      }
      
      return data.data.notification;
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
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al marcar todas');
      }
      
      return data.data.count;
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
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al eliminar notificación');
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
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al limpiar notificaciones');
      }
      
      return data.data.count;
    } catch (error) {
      console.error('❌ Error en clearReadNotifications:', error);
      throw error;
    }
  },

  // Crear notificación de prueba (solo desarrollo)
  createTestNotification: async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/test`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Error al crear notificación');
      }
      
      return data.data.notification;
    } catch (error) {
      console.error('❌ Error en createTestNotification:', error);
      throw error;
    }
  }
};