import React, { useState } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";


const CrearAdopcion = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Estados para Adopción
  const [adoptionData, setAdoptionData] = useState({
    nombre: "",
    tipo: "",
    raza: "",
    edad: "",
    sexo: "",
    tamano: "",
    descripcion: "",
    vacunado: false,
    esterilizado: false,
    ubicacion: "",
    telefono: "",
  });

  const [adoptionImages, setAdoptionImages] = useState([]);
  const [adoptionImageFiles, setAdoptionImageFiles] = useState([]);

  // ✅ NUEVA FUNCIÓN: Comprimir imagen agresivamente
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob.size > 4 * 1024 * 1024) {
                canvas.toBlob(
                  (blob2) => {
                    resolve(new File([blob2], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
                  },
                  'image/jpeg',
                  0.4
                );
              } else {
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
              }
            },
            'image/jpeg',
            0.6
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAdoptionImages = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setLoading(true);
      setError(null);

      try {
        const compressedFiles = await Promise.all(
          files.map(file => compressImage(file))
        );

        const MAX_SIZE = 5 * 1024 * 1024;
        for (const file of compressedFiles) {
          if (file.size > MAX_SIZE) {
            setError(`La imagen "${file.name}" sigue siendo muy grande después de comprimir. Intenta con una imagen más pequeña.`);
            setLoading(false);
            return;
          }
        }

        const newImages = compressedFiles.map((file) => URL.createObjectURL(file));
        setAdoptionImages([...adoptionImages, ...newImages].slice(0, 5));
        setAdoptionImageFiles([...adoptionImageFiles, ...compressedFiles].slice(0, 5));

      } catch (err) {
        console.error('Error al procesar imágenes:', err);
        setError('Error al procesar las imágenes. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    }
  };

  const removeAdoptionImage = (index) => {
    setAdoptionImages(adoptionImages.filter((_, i) => i !== index));
    setAdoptionImageFiles(adoptionImageFiles.filter((_, i) => i !== index));
  };

  const handleAdoptionChange = (field, value) => {
    setAdoptionData({ ...adoptionData, [field]: value });
  };

  const publishAdoption = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (!adoptionData.nombre || !adoptionData.tipo || !adoptionData.edad) {
        setError("Debes completar al menos: Nombre, Tipo y Edad");
        setLoading(false);
        return;
      }

      if (adoptionImageFiles.length === 0) {
        setError("Debes subir al menos una foto de la mascota");
        setLoading(false);
        return;
      }

      const MAX_SIZE = 5 * 1024 * 1024;
      for (const file of adoptionImageFiles) {
        if (file.size > MAX_SIZE) {
          const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
          setError(`La imagen "${file.name}" es demasiado grande (${sizeMB}MB). Máximo 5MB por imagen.`);
          setLoading(false);
          return;
        }
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para publicar");
        setLoading(false);
        return;
      }

      const formData = new FormData();

      formData.append("nombre", adoptionData.nombre);
      formData.append("tipo", adoptionData.tipo);
      formData.append("raza", adoptionData.raza || "Mestizo");
      formData.append("edad", adoptionData.edad);
      formData.append("sexo", adoptionData.sexo);
      formData.append("tamano", adoptionData.tamano);
      formData.append("descripcion", adoptionData.descripcion);
      formData.append("vacunado", adoptionData.vacunado);
      formData.append("esterilizado", adoptionData.esterilizado);
      formData.append("ubicacion", adoptionData.ubicacion);
      formData.append("telefono", adoptionData.telefono);
      formData.append("enAdopcion", true);

      adoptionImageFiles.forEach((file) => {
        formData.append("imagenes", file);
      });

      console.log('📤 Enviando formulario...');
      console.log('📊 Tamaños de imágenes:', adoptionImageFiles.map(f => `${f.name}: ${(f.size / 1024).toFixed(2)}KB`));

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/pets/publicar-adopcion`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al publicar mascota");
      }

      console.log('✅ Mascota publicada exitosamente');

      setAdoptionData({
        nombre: "",
        tipo: "",
        raza: "",
        edad: "",
        sexo: "",
        tamano: "",
        descripcion: "",
        vacunado: false,
        esterilizado: false,
        ubicacion: "",
        telefono: "",
      });
      setAdoptionImages([]);
      setAdoptionImageFiles([]);
      setSuccess(true);

      setTimeout(() => {
        window.location.href = "/adoptar";
      }, 2000);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.message || "Error al publicar mascota. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SIDEBAR IZQUIERDO */}
          <div className="hidden lg:block lg:col-span-3">
            <Sidebar />
          </div>

          {/* CONTENIDO PRINCIPAL */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  Crear adopción
                </h2>
                <p className="text-gray-500 text-sm">
                  Ayuda a encontrar un hogar para esta mascota
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <span>✅</span>
                  <span>¡Publicado exitosamente! Redirigiendo...</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre de la mascota *"
                  value={adoptionData.nombre}
                  onChange={(e) => handleAdoptionChange("nombre", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                  disabled={loading}
                />
                <select
                  value={adoptionData.tipo}
                  onChange={(e) => handleAdoptionChange("tipo", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                  disabled={loading}
                >
                  <option value="">Tipo de mascota *</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Raza (opcional)"
                  value={adoptionData.raza}
                  onChange={(e) => handleAdoptionChange("raza", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                  disabled={loading}
                />
                <input
                  type="text"
                  placeholder="Edad (ej: 2 años) *"
                  value={adoptionData.edad}
                  onChange={(e) => handleAdoptionChange("edad", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={adoptionData.sexo}
                  onChange={(e) => handleAdoptionChange("sexo", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                  disabled={loading}
                >
                  <option value="">Sexo</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
                <select
                  value={adoptionData.tamano}
                  onChange={(e) => handleAdoptionChange("tamano", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                  disabled={loading}
                >
                  <option value="">Tamaño</option>
                  <option value="Pequeño">Pequeño</option>
                  <option value="Mediano">Mediano</option>
                  <option value="Grande">Grande</option>
                </select>
              </div>

              <textarea
                placeholder="Describe la personalidad de la mascota..."
                value={adoptionData.descripcion}
                onChange={(e) => handleAdoptionChange("descripcion", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none min-h-[120px] resize-none"
                disabled={loading}
              />

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adoptionData.vacunado}
                    onChange={(e) => handleAdoptionChange("vacunado", e.target.checked)}
                    className="w-5 h-5 text-purple-600"
                    disabled={loading}
                  />
                  <span className="text-gray-700">Vacunado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adoptionData.esterilizado}
                    onChange={(e) => handleAdoptionChange("esterilizado", e.target.checked)}
                    className="w-5 h-5 text-purple-600"
                    disabled={loading}
                  />
                  <span className="text-gray-700">Esterilizado</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Ubicación (ciudad)"
                  value={adoptionData.ubicacion}
                  onChange={(e) => handleAdoptionChange("ubicacion", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                  disabled={loading}
                />
                <input
                  type="tel"
                  placeholder="Teléfono de contacto"
                  value={adoptionData.telefono}
                  onChange={(e) => handleAdoptionChange("telefono", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Fotos de la mascota * (máximo 5)
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    Las imágenes se comprimirán automáticamente
                  </span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleAdoptionImages}
                  className="hidden"
                  id="adoption-images"
                  disabled={loading}
                />
                <label
                  htmlFor="adoption-images"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition"
                >
                  <span>📷</span>
                  <span>Seleccionar fotos</span>
                </label>

                {adoptionImages.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-4">
                    {adoptionImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeAdoptionImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          disabled={loading}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={publishAdoption}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Publicando..." : "🐾 Publicar en adopción"}
              </button>

              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="text-gray-600 mt-2">Procesando imágenes...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrearAdopcion;