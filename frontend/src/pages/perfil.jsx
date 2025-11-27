import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import ProfileHeader from '../components/common/profileheader';
import AdoptionRequestCard from '../components/common/AdoptionRequestCard';
import HistoryItem from '../components/common/HistoryItem';
import EditProfileModal from '../components/common/EditProfileModal';
import axios from "axios";

export default function Perfil() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);

  // Cargar datos del usuario cuando abre la página
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/user/profile");
        setUser(res.data);
      } catch (error) {
        console.error("Error cargando el perfil:", error);
      }
    };

    fetchUser();
  }, []);

  const handleUpdate = async (updatedData) => {
    try {
      const res = await axios.put("http://localhost:3001/api/user/update", updatedData);
      setUser(res.data);
      setEditing(false);
    } catch (error) {
      console.error("Error actualizando:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700 text-lg font-medium">Cargando perfil…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="bg-white shadow-xl p-6 rounded-xl w-full max-w-lg">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full overflow-hidden mb-4">
            <img
              src={user.photo || "https://via.placeholder.com/150"}
              alt="Foto de perfil"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-3xl font-bold">{user.name}</h2>
          <p className="text-gray-600 mt-1">{user.email}</p>

          <button
            className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            onClick={() => setEditing(true)}
          >
            Editar perfil
          </button>
        </div>
      </div>

      {editing && (
        <EditProfileModal
          user={user}
          onClose={() => setEditing(false)}
          onSave={handleUpdate}
        />
      )}
    </div>
  );
}
