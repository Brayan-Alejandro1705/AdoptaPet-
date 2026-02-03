// frontend/src/services/userService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

export const userService = {
  // Obtener todos los usuarios
  getAllUsers: async () => {
    try {
      const response = await axios.get(API_URL, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  },

  // Buscar usuarios por nombre
  searchUsers: async (searchTerm) => {
    try {
      const response = await axios.get(
        `${API_URL}/search?q=${searchTerm}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      throw error;
    }
  },

  // Obtener perfil de un usuario específico
  getUserProfile: async (userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/${userId}`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  }
};