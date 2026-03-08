import React, { useState } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";

import PublishTextarea from "../components/common/PublishTextarea";
import ImagePreview from "../components/common/ImagePreview";
import PublishOptions from "../components/common/PublishOptions";
import PublishFooter from "../components/common/PublishFooter";

const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}`;

// ✅ Cloudinary config
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dn9x4ccqk";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "adopta_pet_unsigned";

// ✅ Sube UN archivo (imagen o video) a Cloudinary
const uploadToCloudinary = async (file, resourceType = "image") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", resourceType === "video" ? "adopta-pet/videos" : "adopta-pet/posts");
  formData.append("resource_type", resourceType);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Error al subir ${resourceType} a Cloudinary`);
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    type: resourceType,
    duration: resourceType === "video" ? data.duration : null
  };
};

const Publicar = () => {
  const [loading, setLoading]       = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(false);
  const [momentText, setMomentText] = useState("");
  const [images, setImages]         = useState([]);
  const [videos, setVideos]         = useState([]);

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
      file,
      type: "image"
    }));

    setImages(prev => [...prev, ...toAdd]);
    setError(null);
    e.target.value = '';
  };

  const handleVideos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Validar cantidad
    if (videos.length >= MAX_VIDEOS) {
      setError(`Solo puedes subir un máximo de ${MAX_VIDEOS} video`);
      return;
    }

    // Validar tamaño
    const file = files[0];
    if (file.size > MAX_VIDEO_SIZE) {
      setError(`El video no puede superar 100MB. Tu archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('video/')) {
      setError("Solo se permiten archivos de video (MP4, WebM, etc)");
      return;
    }

    const video = {
      preview: URL.createObjectURL(file),
      file,
      type: "video"
    };

    setVideos([video]);
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

  const clearVideo = () => {
    if (videos.length > 0) {
      URL.revokeObjectURL(videos[0].preview);
      setVideos([]);
    }
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    videos.forEach(vid => URL.revokeObjectURL(vid.preview));
    setImages([]);
    setVideos([]);
  };

  const publishMoment = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setUploadProgress(0);

      if (!momentText.trim() && images.length === 0 && videos.length === 0) {
        setError("Debes escribir algo o subir al menos una imagen/video");
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Debes iniciar sesión para publicar");
        setLoading(false);
        return;
      }

      // ✅ PASO 1: Subir imágenes a Cloudinary
      let mediaItems = [];
      
      if (images.length > 0) {
        setUploadProgress(10);
        const imagePromises = images.map(({ file }) => 
          uploadToCloudinary(file, "image")
        );
        const uploadedImages = await Promise.all(imagePromises);
        mediaItems = [...mediaItems, ...uploadedImages];
        setUploadProgress(40);
      }

      // ✅ PASO 2: Subir video a Cloudinary (si existe)
      if (videos.length > 0) {
        setUploadProgress(40);
        const videoData = await uploadToCloudinary(videos[0].file, "video");
        mediaItems = [...mediaItems, videoData];
        setUploadProgress(70);
      }

      // ✅ PASO 3: Enviar al backend con URLs de Cloudinary
      const response = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: momentText,
          type: "update",
          media: mediaItems, // ✅ URLs de Cloudinary con tipo
          images: mediaItems.filter(m => m.type === "image").map(m => m.url), // Compatibilidad
          video: mediaItems.find(m => m.type === "video")?.url || null
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
                {(images.length > 0 || videos.length > 0) && (
                  <p className="text-xs text-gray-400">
                    📸 {images.length}/{MAX_IMAGES} imágenes
                    {videos.length > 0 && ` • 🎥 1 video`}
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

              {/* Galería de IMÁGENES */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">📸 Imágenes ({images.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Preview ${idx}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          onClick={() => clearImage(idx)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          disabled={loading}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview de VIDEO */}
              {videos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">🎥 Video</p>
                  <div className="relative group">
                    <video
                      src={videos[0].preview}
                      className="w-full h-48 object-cover rounded-lg border border-gray-200 bg-black"
                      controls
                    />
                    <button
                      onClick={clearVideo}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition"
                      disabled={loading}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Botones para subir IMÁGENES y VIDEOS */}
              {images.length < MAX_IMAGES && videos.length === 0 && (
                <label className="block">
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition">
                    <div className="text-2xl mb-2">📸</div>
                    <p className="text-sm font-semibold text-gray-700">Agregar imagen</p>
                    <p className="text-xs text-gray-500">Máximo {MAX_IMAGES - images.length} imagen(s)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImages}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              )}

              {videos.length === 0 && (
                <label className="block">
                  <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                    <div className="text-2xl mb-2">🎥</div>
                    <p className="text-sm font-semibold text-gray-700">Agregar video</p>
                    <p className="text-xs text-gray-500">Máximo 100MB • MP4, WebM, etc</p>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideos}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              )}

              {/* Botón para limpiar todo */}
              {(images.length > 0 || videos.length > 0) && (
                <button
                  onClick={clearAll}
                  disabled={loading}
                  className="w-full text-sm text-gray-600 hover:text-red-600 transition"
                >
                  🗑️ Limpiar todo
                </button>
              )}

              <PublishFooter
                publish={publishMoment}
                loading={loading}
                disabled={loading || (!momentText.trim() && images.length === 0 && videos.length === 0)}
              />

              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                  <p className="text-gray-600 mt-2">
                    {uploadProgress < 40
                      ? "Subiendo imágenes..."
                      : uploadProgress < 70
                      ? "Subiendo video..."
                      : uploadProgress < 90
                      ? "Guardando publicación..."
                      : "¡Casi listo!"}
                  </p>
                  {/* Barra de progreso */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3 mx-auto max-w-xs overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
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