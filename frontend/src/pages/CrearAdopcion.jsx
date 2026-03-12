import React, { useState } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";

const MAX_IMAGES = 5;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

const CrearAdopcion = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [adoptionData, setAdoptionData] = useState({
    nombre: "", tipo: "", raza: "", edad: "", sexo: "",
    tamano: "", descripcion: "", vacunado: false,
    esterilizado: false, ubicacion: "", telefono: "",
  });

  const [adoptionImages, setAdoptionImages] = useState([]);
  const [adoptionImageFiles, setAdoptionImageFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // ✅ Comprimir imagen
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
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob.size > 4 * 1024 * 1024) {
              canvas.toBlob((blob2) => {
                resolve(new File([blob2], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
              }, 'image/jpeg', 0.4);
            } else {
              resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
            }
          }, 'image/jpeg', 0.6);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // ✅ Manejar selección de archivos (imágenes + video mezclados)
  const handleMediaFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const videoFiles = files.filter(f => f.type.startsWith('video/'));

    setError(null);

    // Procesar imágenes
    if (imageFiles.length > 0) {
      const remaining = MAX_IMAGES - adoptionImages.length;
      if (remaining <= 0) {
        setError(`Máximo ${MAX_IMAGES} imágenes permitidas`);
      } else {
        setLoading(true);
        try {
          const toProcess = imageFiles.slice(0, remaining);
          const compressed = await Promise.all(toProcess.map(f => compressImage(f)));
          const oversized = compressed.find(f => f.size > 5 * 1024 * 1024);
          if (oversized) {
            setError(`La imagen "${oversized.name}" sigue siendo muy grande. Intenta con otra.`);
          } else {
            const previews = compressed.map(f => URL.createObjectURL(f));
            setAdoptionImages(prev => [...prev, ...previews].slice(0, MAX_IMAGES));
            setAdoptionImageFiles(prev => [...prev, ...compressed].slice(0, MAX_IMAGES));
          }
        } catch {
          setError('Error al procesar las imágenes.');
        } finally {
          setLoading(false);
        }
      }
    }

    // Procesar video
    if (videoFiles.length > 0) {
      if (videoFile) {
        setError('Solo puedes subir 1 video');
      } else {
        const vid = videoFiles[0];
        if (vid.size > MAX_VIDEO_SIZE) {
          setError('El video no puede superar 100MB');
        } else {
          setVideoFile(vid);
          setVideoPreview(URL.createObjectURL(vid));
        }
      }
    }

    e.target.value = '';
  };

  const removeImage = (index) => {
    setAdoptionImages(prev => prev.filter((_, i) => i !== index));
    setAdoptionImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview(null);
  };

  const handleAdoptionChange = (field, value) => {
    setAdoptionData(prev => ({ ...prev, [field]: value }));
  };

  const publishAdoption = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      if (!adoptionData.nombre || !adoptionData.tipo || !adoptionData.edad) {
        setError("Debes completar al menos: Nombre, Tipo y Edad");
        return;
      }
      if (adoptionImageFiles.length === 0) {
        setError("Debes subir al menos una foto de la mascota");
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) { setError("Debes iniciar sesión para publicar"); return; }

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

      adoptionImageFiles.forEach(f => formData.append("imagenes", f));
      if (videoFile) formData.append("video", videoFile);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/pets/publicar-adopcion`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al publicar mascota");

      setAdoptionData({
        nombre: "", tipo: "", raza: "", edad: "", sexo: "",
        tamano: "", descripcion: "", vacunado: false,
        esterilizado: false, ubicacion: "", telefono: "",
      });
      setAdoptionImages([]); setAdoptionImageFiles([]);
      removeVideo();
      setSuccess(true);
      setTimeout(() => { window.location.href = "/adoptar"; }, 2000);
    } catch (err) {
      setError(err.message || "Error al publicar mascota. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const hasMedia = adoptionImages.length > 0 || videoFile;
  const mediaFull = adoptionImages.length >= MAX_IMAGES && videoFile;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="hidden lg:block lg:col-span-3"><Sidebar /></div>

          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Crear adopción</h2>
                <p className="text-gray-500 text-sm">Ayuda a encontrar un hogar para esta mascota</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <span>✅</span><span>¡Publicado exitosamente! Redirigiendo...</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Nombre de la mascota *"
                  value={adoptionData.nombre} onChange={e => handleAdoptionChange("nombre", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" disabled={loading} />
                <select value={adoptionData.tipo} onChange={e => handleAdoptionChange("tipo", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" disabled={loading}>
                  <option value="">Tipo de mascota *</option>
                  <option value="Perro">Perro</option>
                  <option value="Gato">Gato</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Raza (opcional)"
                  value={adoptionData.raza} onChange={e => handleAdoptionChange("raza", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" disabled={loading} />
                <input type="text" placeholder="Edad (ej: 2 años) *"
                  value={adoptionData.edad} onChange={e => handleAdoptionChange("edad", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" disabled={loading} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select value={adoptionData.sexo} onChange={e => handleAdoptionChange("sexo", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" disabled={loading}>
                  <option value="">Sexo</option>
                  <option value="Macho">Macho</option>
                  <option value="Hembra">Hembra</option>
                </select>
                <select value={adoptionData.tamano} onChange={e => handleAdoptionChange("tamano", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" disabled={loading}>
                  <option value="">Tamaño</option>
                  <option value="Pequeño">Pequeño</option>
                  <option value="Mediano">Mediano</option>
                  <option value="Grande">Grande</option>
                </select>
              </div>

              <textarea placeholder="Describe la personalidad de la mascota..."
                value={adoptionData.descripcion} onChange={e => handleAdoptionChange("descripcion", e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none min-h-[120px] resize-none" disabled={loading} />

              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={adoptionData.vacunado}
                    onChange={e => handleAdoptionChange("vacunado", e.target.checked)}
                    className="w-5 h-5 text-purple-600" disabled={loading} />
                  <span className="text-gray-700">Vacunado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={adoptionData.esterilizado}
                    onChange={e => handleAdoptionChange("esterilizado", e.target.checked)}
                    className="w-5 h-5 text-purple-600" disabled={loading} />
                  <span className="text-gray-700">Esterilizado</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Ubicación (ciudad)"
                  value={adoptionData.ubicacion} onChange={e => handleAdoptionChange("ubicacion", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" disabled={loading} />
                <input type="tel" placeholder="Teléfono de contacto"
                  value={adoptionData.telefono} onChange={e => handleAdoptionChange("telefono", e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 outline-none" disabled={loading} />
              </div>

              {/* ✅ Sección de media unificada */}
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Fotos y video de la mascota *
                </label>
                <p className="text-xs text-gray-400 mb-3">
                  Hasta {MAX_IMAGES} fotos · 1 video (máx. 100MB) · Las imágenes se comprimen automáticamente
                </p>

                {/* Botón único */}
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleMediaFiles}
                  className="hidden"
                  id="media-input"
                  disabled={loading || mediaFull}
                />
                <label
                  htmlFor="media-input"
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition font-medium text-sm
                    ${mediaFull || loading
                      ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'border-purple-300 bg-purple-50 text-purple-600 hover:bg-purple-100'
                    }`}
                >
                  <span className="text-lg">📎</span>
                  <span>
                    {loading ? 'Procesando...' : mediaFull ? 'Límite alcanzado' : 'Seleccionar fotos o video'}
                  </span>
                  {hasMedia && !mediaFull && (
                    <span className="ml-1 text-xs bg-purple-200 text-purple-700 rounded-full px-2 py-0.5 font-semibold">
                      {adoptionImages.length > 0 && `${adoptionImages.length} foto${adoptionImages.length > 1 ? 's' : ''}`}
                      {adoptionImages.length > 0 && videoFile && ' · '}
                      {videoFile && '1 video'}
                    </span>
                  )}
                </label>

                {/* Preview imágenes */}
                {adoptionImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">
                      📸 Fotos ({adoptionImages.length}/{MAX_IMAGES})
                    </p>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                      {adoptionImages.map((img, index) => (
                        <div key={index} className="relative group">
                          <img src={img} alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                          <button onClick={() => removeImage(index)} disabled={loading}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition">
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview video */}
                {videoPreview && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">🎬 Video</p>
                    <div className="relative rounded-xl overflow-hidden bg-black group">
                      <video src={videoPreview} controls className="w-full max-h-56 object-contain" />
                      <button onClick={removeVideo} disabled={loading}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition">
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={publishAdoption} disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Publicando...
                  </span>
                ) : '🐾 Publicar en adopción'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrearAdopcion;