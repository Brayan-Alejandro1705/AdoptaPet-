import axios from 'axios';

const API_URL = 'http://localhost:5000/api/friend-requests';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export const friendRequestService = {
  // Enviar solicitud de amistad
  sendFriendRequest: async (userId, message = '') => {
    try {
      console.log('📤 Enviando solicitud de amistad a:', userId);
      const response = await axios.post(
        `${API_URL}/send/${userId}`,
        { message },
        getAuthHeaders()
      );
      console.log('✅ Solicitud enviada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al enviar solicitud:', error.response?.data || error.message);
      throw error;
    }
  },

  // Obtener solicitudes recibidas
  getReceivedRequests: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/received`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener solicitudes recibidas:', error.response?.data || error.message);
      throw error;
    }
  },

  // Obtener solicitudes enviadas
  getSentRequests: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/sent`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener solicitudes enviadas:', error.response?.data || error.message);
      throw error;
    }
  },

  // Aceptar solicitud
  acceptRequest: async (requestId) => {
    try {
      const response = await axios.put(
        `${API_URL}/accept/${requestId}`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error al aceptar solicitud:', error.response?.data || error.message);
      throw error;
    }
  },

  // Rechazar solicitud
  rejectRequest: async (requestId) => {
    try {
      const response = await axios.put(
        `${API_URL}/reject/${requestId}`,
        {},
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error al rechazar solicitud:', error.response?.data || error.message);
      throw error;
    }
  },

  // Cancelar solicitud enviada
  cancelRequest: async (userId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/cancel/${userId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('❌ Error al cancelar solicitud:', error.response?.data || error.message);
      throw error;
    }
  },

  // ✅ CORREGIDO: Verificar estado de amistad
  checkFriendshipStatus: async (userId) => {
    try {
      console.log('🔍 Verificando estado de amistad con:', userId);
      const response = await axios.get(
        `${API_URL}/status/${userId}`,
        getAuthHeaders()
      );
      console.log('✅ Estado recibido:', response.data);
      // ✅ Retornar response.data.status, NO response.status
      return response.data.status; // ← ESTO ES LO QUE ESTABA MAL
    } catch (error) {
      console.error('❌ Error al verificar estado:', error.response?.data || error.message);
      return 'none'; // Retornar 'none' en caso de error
    }
  },

  // Obtener lista de amigos
  getFriends: async (userId = null) => {
    try {
      const url = userId ? `${API_URL}/friends/${userId}` : `${API_URL}/friends`;
      const response = await axios.get(url, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener amigos:', error.response?.data || error.message);
      throw error;
    }
  }
};