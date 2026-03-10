// frontend/src/services/chatService.js
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/chat`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('⚠️ No hay token en localStorage para autenticación');
  }
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export const chatService = {
  // Obtener todos los chats del usuario
  getChats: async () => {
    try {
      const response = await axios.get(API_URL, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error al obtener chats:', error);
      throw error;
    }
  },

  // Obtener mensajes de un chat específico
  getMessages: async (chatId) => {
    try {
      const response = await axios.get(
        `${API_URL}/${chatId}/messages`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      throw error;
    }
  },

  // Crear un nuevo chat
  createChat: async (otherUserId, petId = null) => {
    try {
      const response = await axios.post(
        API_URL,
        { otherUserId, petId },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al crear chat:', error);
      throw error;
    }
  },

  // Enviar un mensaje en un chat
  sendMessage: async (chatId, text) => {
    try {
      if (!text || !text.trim()) {
        throw new Error('El mensaje no puede estar vacío');
      }
      const response = await axios.post(
        `${API_URL}/${chatId}/messages`,
        { text: text.trim() },
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  }
};