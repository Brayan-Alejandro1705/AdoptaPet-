import { useState, useEffect } from "react";

export default function EditProfileModal({ isOpen, onClose, user, onSave }) {
  const [formData, setFormData] = useState(user);

  // Cuando el usuario cambie afuera, actualizar el formulario
  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl">

        <h2 className="text-2xl font-bold text-gray-700 mb-4 text-center">
          Editar Perfil
        </h2>

        <div className="space-y-4">

          {/* Nombre */}
          <input
            type="text"
            name="name"
            placeholder="Nombre"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 outline-none"
          />

          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Correo"
            value={formData.email}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 outline-none"
          />

          {/* Bio */}
          <textarea
            name="bio"
            placeholder="Biografía"
            value={formData.bio}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 h-24 outline-none"
          />

          {/* Teléfono */}
          <input
            type="text"
            name="phone"
            placeholder="Teléfono"
            value={formData.phone}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 outline-none"
          />

          {/* Ubicación */}
          <input
            type="text"
            name="location"
            placeholder="Ubicación"
            value={formData.location}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 outline-none"
          />

          {/* Foto */}
          <input
            type="text"
            name="photo"
            placeholder="URL de foto de perfil"
            value={formData.photo}
            onChange={handleChange}
            className="w-full border rounded-xl p-3 outline-none"
          />
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded-xl"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
