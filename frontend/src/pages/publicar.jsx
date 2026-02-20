import React, { useState } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import BottomNav from "../components/layout/BottomNav";
import PublishTextarea from "../components/common/PublishTextarea";
import ImagePreview from "../components/common/ImagePreview";
import PublishOptions from "../components/common/PublishOptions";
import PublishFooter from "../components/common/PublishFooter";

const MAX_IMAGES = 5;

const Publicar = () => {
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(false);
  const [momentText, setMomentText] = useState("");

  // ── Múltiples imágenes: array de { preview, file } ──────────────────
  const [images, setImages] = useState([]); // [{ preview: string, file: File }]

  // Agregar imágenes (hasta MAX_IMAGES en total)
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

    // Resetear el input para poder volver a seleccionar las mismas fotos
    e.target.value = '';
  };

  // Eliminar imagen individual por índice
  const clearImage = (index) => {
    setImages(prev => {
      const next = [...prev];
      URL.revokeObjectURL(next[index].preview); // liberar memoria
      next.splice(index, 1);
      return next;
    });
  };

  // Eliminar todas
  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  // ── Publicar ────────────────────────────────────────────────────────
  const publishMoment = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

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

      const formData = new FormData();
      formData.append("contenido", momentText);
      formData.append("tipo", "update");

      // Agregar cada imagen con el campo que espera tu backend
      images.forEach(({ file }) => {
        formData.append("imagenes", file); // mismo campo que antes, repetido
      });

      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Error al publicar");

      // Limpiar
      setMomentText("");
      clearAll();
      setSuccess(true);

      setTimeout(() => { window.location.href = "/home"; }, 2000);
    } catch (err) {
      console.error("Error:", err);
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
                    {images.length}/{MAX_IMAGES} imágenes — {MAX_IMAGES - images.length > 0 ? `puedes agregar ${MAX_IMAGES - images.length} más` : 'límite alcanzado'}
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

              {/* Preview de múltiples imágenes */}
              <ImagePreview
                images={images}
                clearImage={clearImage}
                clearAll={clearAll}
                disabled={loading}
              />

              {/* Solo mostrar el botón de añadir fotos si no llegamos al límite */}
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
                  <p className="text-gray-600 mt-2">Publicando...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Publicar;