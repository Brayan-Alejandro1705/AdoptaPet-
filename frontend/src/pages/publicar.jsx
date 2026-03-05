import React, { useState } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";

import PublishTextarea from "../components/common/PublishTextarea";
import ImagePreview from "../components/common/ImagePreview";
import PublishOptions from "../components/common/PublishOptions";
import PublishFooter from "../components/common/PublishFooter";

const MAX_IMAGES = 5;
const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}`;

// ✅ Cloudinary config — reemplaza con tus valores
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dn9x4ccqk";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "adopta_pet_unsigned";

// ✅ Sube UN archivo a Cloudinary y devuelve la URL segura
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "adopta-pet/posts");

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "Error al subir imagen a Cloudinary");
  }

  const data = await res.json();
  return data.secure_url; // ✅ URL permanente de Cloudinary
};

const Publicar = () => {
  const [loading, setLoading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(false);
  const [momentText, setMomentText] = useState("");
  const [images, setImages]         = useState([]);

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`Solo puedes subir un máximo de ${MAX_IMAGES} imágenes`);
      return;
    }

    const toAdd = files.slice(0, remaining).map(file => ({
      preview: URL.createObjectURL(file),
      file
    }));

    setImages(prev => [...prev, ...toAdd]);
    setError(null);
    e.target.value = '';
  };

  const clearImage = (index) => {
    setImages(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const publishMoment = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setUploadProgress(0);

      if (!momentText.trim() && images.length === 0) {
        setError("Debes escribir algo o subir al menos una imagen");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para publicar");
        setLoading(false);
        return;
      }

      // ✅ PASO 1: Subir imágenes a Cloudinary (una por una)
      let imageUrls = [];
      if (images.length > 0) {
        setUploadProgress(10);
        const uploadPromises = images.map(({ file }) => uploadToCloudinary(file));
        imageUrls = await Promise.all(uploadPromises);
        setUploadProgress(70);
      }

      // ✅ PASO 2: Enviar al backend con URLs de Cloudinary (JSON, no FormData)
      const response = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contenido: momentText,
          tipo: "update",
          images: imageUrls, // ✅ URLs permanentes de Cloudinary
        }),
      });

      setUploadProgress(90);
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Error al publicar");

      setMomentText("");
      clearAll();
      setSuccess(true);
      setUploadProgress(100);

      setTimeout(() => { window.location.href = "/home"; }, 2000);
    } catch (err) {
      console.error("Error al publicar:", err);
      setError(err.message || "Error al publicar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="hidden lg:block lg:col-span-3">
            <Sidebar />
          </div>

          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">
                  Comparte un momento
                </h2>
                {images.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {images.length}/{MAX_IMAGES} imágenes —{" "}
                    {MAX_IMAGES - images.length > 0
                      ? `puedes agregar ${MAX_IMAGES - images.length} más`
                      : "límite alcanzado"}
                  </p>
                )}
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

              <PublishTextarea value={momentText} setValue={setMomentText} disabled={loading} />

              <ImagePreview
                images={images}
                clearImage={clearImage}
                clearAll={clearAll}
                disabled={loading}
              />

              {images.length < MAX_IMAGES && (
                <PublishOptions handleImages={handleImages} disabled={loading} />
              )}

              {images.length === MAX_IMAGES && (
                <p className="text-xs text-center text-gray-400 py-2">
                  🖼️ Límite de {MAX_IMAGES} imágenes alcanzado
                </p>
              )}

              <PublishFooter
                publish={publishMoment}
                loading={loading}
                disabled={loading || (!momentText.trim() && images.length === 0)}
              />

              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                  <p className="text-gray-600 mt-2">
                    {uploadProgress < 70
                      ? "Subiendo imágenes a Cloudinary..."
                      : uploadProgress < 90
                      ? "Guardando publicación..."
                      : "¡Casi listo!"}
                  </p>
                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 mx-auto max-w-xs">
                    <div
                      className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Publicar;