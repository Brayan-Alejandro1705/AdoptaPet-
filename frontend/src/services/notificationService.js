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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // ✅ Manejar ambos formatos de respuesta
      if (data.success !== undefined) {
        if (!data.success) {
          throw new Error(data.message || 'Error al obtener notificaciones');
        }
        return data.data;
      }
      
      // Si no tiene formato {success, data}, devolver directamente
      return Array.isArray(data) ? data : [];
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
      
      if (!response.ok) {
        return 0; // Si falla, devolver 0
      }
      
      const data = await response.json();
      
      if (data.success !== undefined) {
        return data.success ? data.data.count : 0;
      }
      
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
      return data.notification || data.data?.notification || data;
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
      return data.count || data.data?.count || 0;
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
      return data.count || data.data?.count || 0;
    } catch (error) {
      console.error('❌ Error en clearReadNotifications:', error);
      throw error;
    }
  }
};