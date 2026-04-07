import React, { useState, useEffect } from "react";
import { X, Camera, Play, Trash2, Loader2, Check } from "lucide-react";
import { toast } from "react-hot-toast";

const MAX_IMAGES = 5;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PetEditModal = ({ pet, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    nombre: pet.name || "",
    tipo: pet.species || "",
    raza: pet.breed || "",
    edad: pet.ageFormatted || "",
    sexo: pet.gender || "",
    tamano: pet.size || "",
    descripcion: pet.description || "",
    vacunado: pet.vaccinated || false,
    esterilizado: pet.sterilized || false,
    ubicacion: pet.location?.city || "",
    telefono: pet.contact?.phone || "",
  });

  // Imágenes actuales (URLs)
  const [existingPhotos, setExistingPhotos] = useState(pet.photos || []);
  // Nuevas imágenes seleccionadas (previews y archivos)
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  
  // Video (actual o nuevo)
  const [currentVideo, setCurrentVideo] = useState(pet.video || null);
  const [newVideoFile, setNewVideoFile] = useState(null);
  const [newVideoPreview, setNewVideoPreview] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_W = 800;
          const MAX_H = 800;
          if (width > height) {
            if (width > MAX_W) { height *= MAX_W / width; width = MAX_W; }
          } else {
            if (height > MAX_H) { width *= MAX_H / height; height = MAX_H; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.7);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const videoFiles = files.filter(f => f.type.startsWith('video/'));

    if (imageFiles.length > 0) {
      const totalPhotos = existingPhotos.length + newImageFiles.length;
      const remaining = MAX_IMAGES - totalPhotos;
      if (remaining <= 0) {
        toast.error(`Máximo ${MAX_IMAGES} fotos permitidas`);
      } else {
        setLoading(true);
        try {
          const toProcess = imageFiles.slice(0, remaining);
          const compressed = await Promise.all(toProcess.map(f => compressImage(f)));
          const previews = compressed.map(f => URL.createObjectURL(f));
          setNewImagePreviews(prev => [...prev, ...previews]);
          setNewImageFiles(prev => [...prev, ...compressed]);
        } catch (err) {
          toast.error("Error al procesar imágenes");
        } finally {
          setLoading(false);
        }
      }
    }

    if (videoFiles.length > 0) {
      const vid = videoFiles[0];
      if (vid.size > MAX_VIDEO_SIZE) {
        toast.error("El video supera los 100MB");
      } else {
        setNewVideoFile(vid);
        setNewVideoPreview(URL.createObjectURL(vid));
        setCurrentVideo(null); // Reemplazamos el actual
      }
    }
    e.target.value = '';
  };

  const removeExistingPhoto = (index) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    if (newVideoPreview) URL.revokeObjectURL(newVideoPreview);
    setNewVideoFile(null);
    setNewVideoPreview(null);
    setCurrentVideo(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!formData.nombre || !formData.tipo || !formData.edad) {
        setError("Nombre, tipo y edad son obligatorios");
        return;
      }

      if (existingPhotos.length === 0 && newImageFiles.length === 0) {
        setError("Debes tener al menos una foto");
        return;
      }

      const token = localStorage.getItem("token");
      const fd = new FormData();
      
      // Datos básicos
      fd.append("nombre", formData.nombre);
      fd.append("tipo", formData.tipo);
      fd.append("raza", formData.raza);
      fd.append("edad", formData.edad);
      fd.append("sexo", formData.sexo);
      fd.append("tamano", formData.tamano);
      fd.append("descripcion", formData.descripcion);
      fd.append("vacunado", formData.vacunado);
      fd.append("esterilizado", formData.esterilizado);
      fd.append("ubicacion", formData.ubicacion);
      fd.append("telefono", formData.telefono);

      // Conservar fotos existentes (pasamos las URLs)
      existingPhotos.forEach(url => fd.append("existingPhotos", url));
      
      // Agregar nuevas fotos
      newImageFiles.forEach(file => fd.append("imagenes", file));
      
      // Video
      if (newVideoFile) fd.append("video", newVideoFile);
      else if (currentVideo) fd.append("existingVideo", currentVideo);

      const res = await fetch(`${API_BASE}/api/pets/${pet._id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al actualizar");

      toast.success("Mascota actualizada correctamente");
      if (onUpdate) onUpdate(data.data);
      onClose();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-purple-100 rounded-lg text-purple-600">📝</span>
            Editar mascota
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Formulario */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 flex items-center gap-2">
              <span className="text-lg">⚠️</span> {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nombre *</label>
              <input type="text" value={formData.nombre} onChange={e => handleInputChange("nombre", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo *</label>
              <select value={formData.tipo} onChange={e => handleInputChange("tipo", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none transition-all">
                <option value="perro">Perro</option>
                <option value="gato">Gato</option>
                <option value="conejo">Conejo</option>
                <option value="ave">Ave</option>
                <option value="roedor">Roedor</option>
                <option value="reptil">Reptil</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Raza</label>
              <input type="text" value={formData.raza} onChange={e => handleInputChange("raza", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Edad *</label>
              <input type="text" value={formData.edad} onChange={e => handleInputChange("edad", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Sexo</label>
              <select value={formData.sexo} onChange={e => handleInputChange("sexo", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none transition-all">
                <option value="macho">Macho</option>
                <option value="hembra">Hembra</option>
                <option value="desconocido">Desconocido</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tamaño</label>
              <select value={formData.tamano} onChange={e => handleInputChange("tamano", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none transition-all">
                <option value="pequeño">Pequeño</option>
                <option value="mediano">Mediano</option>
                <option value="grande">Grande</option>
                <option value="gigante">Gigante</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Descripción</label>
            <textarea value={formData.descripcion} onChange={e => handleInputChange("descripcion", e.target.value)} rows={3}
              className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none transition-all resize-none" />
          </div>

          <div className="flex gap-4 p-3 bg-purple-50 rounded-xl">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={formData.vacunado} onChange={e => handleInputChange("vacunado", e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span className="text-sm font-medium text-purple-800">Vacunado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={formData.esterilizado} onChange={e => handleInputChange("esterilizado", e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span className="text-sm font-medium text-purple-800">Esterilizado</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Ubicación</label>
              <input type="text" value={formData.ubicacion} onChange={e => handleInputChange("ubicacion", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Teléfono</label>
              <input type="tel" value={formData.telefono} onChange={e => handleInputChange("telefono", e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-purple-500 outline-none transition-all" />
            </div>
          </div>

          {/* Gestión de Fotos y Video */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-700">Fotos y Video</label>
              <span className="text-xs text-gray-400">{existingPhotos.length + newImageFiles.length} / {MAX_IMAGES} fotos</span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {/* Fotos actuales */}
              {existingPhotos.map((url, i) => (
                <div key={`old-${i}`} className="relative group aspect-square">
                  <img src={url} className="w-full h-full object-cover rounded-xl border border-gray-200 shadow-sm" alt="Existing" />
                  <button onClick={() => removeExistingPhoto(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              {/* Fotos nuevas */}
              {newImagePreviews.map((url, i) => (
                <div key={`new-${i}`} className="relative group aspect-square">
                  <img src={url} className="w-full h-full object-cover rounded-xl border-2 border-purple-200 shadow-sm" alt="New" />
                  <div className="absolute top-1 left-1 bg-purple-500 text-white p-0.5 rounded text-[8px] font-bold">NUEVA</div>
                  <button onClick={() => removeNewPhoto(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Botón para subir */}
              {existingPhotos.length + newImageFiles.length < MAX_IMAGES && (
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl hover:bg-gray-50 hover:border-purple-300 transition-all cursor-pointer">
                  <Camera className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-[10px] font-bold text-gray-400">SUBIR</span>
                  <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Preview Video */}
            {(currentVideo || newVideoPreview) && (
              <div className="relative group rounded-xl overflow-hidden bg-black aspect-video max-h-48 mt-2">
                <video src={newVideoPreview || currentVideo} controls className="w-full h-full object-contain" />
                <button onClick={removeVideo} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
                {newVideoPreview && <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-lg text-[10px] font-bold">NUEVO VIDEO</div>}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} disabled={loading} className="px-5 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-2">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
            ) : (
              <><Check className="w-4 h-4" /> Guardar cambios</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetEditModal;
