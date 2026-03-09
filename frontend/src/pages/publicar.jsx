import React, { useState } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import PublishTextarea from "../components/common/PublishTextarea";
import PublishFooter from "../components/common/PublishFooter";

const MAX_IMAGES = 5;
const MAX_VIDEOS = 1;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}`;

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dn9x4ccqk";
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "adopta_pet_unsigned";

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
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [momentText, setMomentText] = useState("");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [dragOver, setDragOver] = useState(null);

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) { setError(`Máximo ${MAX_IMAGES} imágenes`); return; }
    const toAdd = files.slice(0, remaining).map(file => ({
      preview: URL.createObjectURL(file), file, type: "image"
    }));
    setImages(prev => [...prev, ...toAdd]);
    setError(null);
    e.target.value = '';
  };

  const handleVideos = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (videos.length >= MAX_VIDEOS) { setError(`Solo puedes subir 1 video`); return; }
    const file = files[0];
    if (file.size > MAX_VIDEO_SIZE) { setError(`El video no puede superar 100MB`); return; }
    if (!file.type.startsWith('video/')) { setError("Solo se permiten videos (MP4, WebM, etc)"); return; }
    setVideos([{ preview: URL.createObjectURL(file), file, type: "video" }]);
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
    if (videos.length > 0) { URL.revokeObjectURL(videos[0].preview); setVideos([]); }
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    videos.forEach(vid => URL.revokeObjectURL(vid.preview));
    setImages([]); setVideos([]);
  };

  const publishMoment = async () => {
    try {
      setLoading(true); setError(null); setSuccess(false); setUploadProgress(0);
      if (!momentText.trim() && images.length === 0 && videos.length === 0) {
        setError("Escribe algo o sube una imagen/video"); setLoading(false); return;
      }
      const token = localStorage.getItem("token");
      if (!token) { setError("Debes iniciar sesión para publicar"); setLoading(false); return; }

      let mediaItems = [];
      if (images.length > 0) {
        setUploadProgress(10);
        const uploaded = await Promise.all(images.map(({ file }) => uploadToCloudinary(file, "image")));
        mediaItems = [...mediaItems, ...uploaded];
        setUploadProgress(40);
      }
      if (videos.length > 0) {
        setUploadProgress(40);
        const videoData = await uploadToCloudinary(videos[0].file, "video");
        mediaItems = [...mediaItems, videoData];
        setUploadProgress(70);
      }

      const response = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido: momentText, tipo: "update",
          imagenes: mediaItems.filter(m => m.type === "image").map(m => m.url),
          videos: mediaItems.find(m => m.type === "video")?.url || null
        }),
      });
      setUploadProgress(90);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al publicar");
      setMomentText(""); clearAll(); setSuccess(true); setUploadProgress(100);
      setTimeout(() => { window.location.href = "/home"; }, 2000);
    } catch (err) {
      setError(err.message || "Error al publicar. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

        .pub-root {
          min-height: 100vh;
          background: #faf7f4;
          font-family: 'DM Sans', sans-serif;
        }

        .pub-card {
          background: #ffffff;
          border-radius: 28px;
          border: 1.5px solid #ede8e3;
          overflow: hidden;
          box-shadow: 0 4px 40px rgba(0,0,0,0.06);
        }

        .pub-card-header {
          padding: 32px 32px 0;
          border-bottom: 1.5px solid #f3ede8;
          padding-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .pub-avatar-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f5a623, #f87c6e);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(248,124,110,0.3);
        }

        .pub-title {
          font-family: 'Fraunces', serif;
          font-size: 22px;
          font-weight: 700;
          color: #1a1410;
          line-height: 1.2;
          margin: 0;
        }

        .pub-subtitle {
          font-size: 13px;
          color: #a89e96;
          margin: 2px 0 0;
        }

        .pub-body {
          padding: 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .pub-textarea {
          width: 100%;
          border: none;
          outline: none;
          resize: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          color: #2d2520;
          background: transparent;
          min-height: 110px;
          line-height: 1.65;
          placeholder-color: #c4bbb5;
        }

        .pub-textarea::placeholder {
          color: #c4bbb5;
          font-style: italic;
          font-size: 15px;
        }

        /* Upload zones */
        .upload-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .upload-zone {
          border: 2px dashed #e8e1db;
          border-radius: 18px;
          padding: 20px 16px;
          text-align: center;
          cursor: pointer;
          transition: all 0.25s ease;
          background: #fdfcfb;
          position: relative;
          overflow: hidden;
        }

        .upload-zone:hover {
          border-color: #f0856a;
          background: #fff8f6;
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(240,133,106,0.12);
        }

        .upload-zone.video-zone:hover {
          border-color: #8b5cf6;
          background: #faf5ff;
          box-shadow: 0 6px 24px rgba(139,92,246,0.12);
        }

        .upload-zone input[type="file"] { display: none; }

        .upload-icon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 10px;
          font-size: 20px;
        }

        .upload-icon.img-icon { background: #ffeee9; }
        .upload-icon.vid-icon { background: #f0e8ff; }

        .upload-label {
          font-size: 13.5px;
          font-weight: 600;
          color: #3d3530;
          margin: 0 0 4px;
        }

        .upload-hint {
          font-size: 11.5px;
          color: #b0a59d;
          margin: 0;
        }

        /* Image gallery */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .gallery-item {
          position: relative;
          border-radius: 14px;
          overflow: hidden;
          aspect-ratio: 1;
          background: #f0ebe7;
        }

        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .gallery-remove {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(4px);
          border: none;
          color: white;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          line-height: 1;
        }

        .gallery-item:hover .gallery-remove { opacity: 1; }

        /* Video preview */
        .video-wrap {
          border-radius: 18px;
          overflow: hidden;
          position: relative;
          background: #0a0a0a;
        }

        .video-wrap video {
          width: 100%;
          max-height: 220px;
          object-fit: contain;
          display: block;
        }

        .video-remove {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(6px);
          border: none;
          color: white;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Media section label */
        .section-label {
          font-size: 12px;
          font-weight: 600;
          color: #b0a59d;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 0 0 10px;
        }

        /* Divider */
        .pub-divider {
          height: 1.5px;
          background: #f3ede8;
          border: none;
          margin: 0;
        }

        /* Footer */
        .pub-footer {
          padding: 18px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .pub-counter {
          font-size: 13px;
          color: #c4bbb5;
          font-weight: 400;
        }

        .pub-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #f0856a 0%, #e85d7c 100%);
          color: white;
          border: none;
          border-radius: 50px;
          padding: 12px 28px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(232,93,124,0.35);
          letter-spacing: 0.01em;
        }

        .pub-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(232,93,124,0.4);
        }

        .pub-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          box-shadow: none;
        }

        /* Alert */
        .pub-alert {
          border-radius: 14px;
          padding: 13px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          font-weight: 500;
        }
        .pub-alert.error { background: #fff1ef; color: #d04040; border: 1.5px solid #fcd5cc; }
        .pub-alert.success { background: #edfaf3; color: #277a52; border: 1.5px solid #b8f0d0; }

        /* Progress bar */
        .prog-wrap {
          background: #f3ede8;
          border-radius: 99px;
          height: 6px;
          overflow: hidden;
        }
        .prog-bar {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #f0856a, #e85d7c);
          transition: width 0.4s ease;
        }

        /* Loading state */
        .pub-loading {
          text-align: center;
          padding: 16px 0 4px;
        }
        .pub-loading p { font-size: 13.5px; color: #a89e96; margin: 0 0 10px; }
        .pub-pct { font-size: 12px; color: #c4bbb5; font-weight: 600; margin-top: 6px !important; }

        /* Spinner */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 3px solid #f3ede8;
          border-top-color: #f0856a;
          animation: spin 0.75s linear infinite;
          margin: 0 auto 10px;
        }

        /* Clear all */
        .clear-btn {
          background: none;
          border: none;
          font-size: 12.5px;
          color: #c4bbb5;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0;
          transition: color 0.2s;
        }
        .clear-btn:hover { color: #d04040; }

        @media (max-width: 640px) {
          .pub-card-header, .pub-body, .pub-footer { padding-left: 20px; padding-right: 20px; }
          .upload-row { grid-template-columns: 1fr; }
          .gallery-grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>

      <div className="pub-root">
        <Header />

        <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 lg:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="hidden lg:block lg:col-span-3">
              <Sidebar />
            </div>

            <div className="lg:col-span-9">
              <div className="pub-card">

                {/* Header */}
                <div className="pub-card-header">
                  <div className="pub-avatar-wrap">🐾</div>
                  <div>
                    <p className="pub-title">Comparte un momento</p>
                    <p className="pub-subtitle">Cuéntanos sobre tu mascota hoy ✨</p>
                  </div>
                </div>

                <div className="pub-body">
                  {/* Alerts */}
                  {error && (
                    <div className="pub-alert error">
                      <span>⚠️</span><span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className="pub-alert success">
                      <span>✅</span><span>¡Publicado exitosamente! Redirigiendo...</span>
                    </div>
                  )}

                  {/* Textarea */}
                  <textarea
                    className="pub-textarea"
                    placeholder="¿Qué está haciendo tu peludo hoy?"
                    value={momentText}
                    onChange={e => setMomentText(e.target.value)}
                    disabled={loading}
                    rows={4}
                  />

                  {/* Images gallery */}
                  {images.length > 0 && (
                    <div>
                      <p className="section-label">📸 Imágenes ({images.length}/{MAX_IMAGES})</p>
                      <div className="gallery-grid">
                        {images.map((img, idx) => (
                          <div className="gallery-item" key={idx}>
                            <img src={img.preview} alt={`img-${idx}`} />
                            <button className="gallery-remove" onClick={() => clearImage(idx)} disabled={loading}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video preview */}
                  {videos.length > 0 && (
                    <div>
                      <p className="section-label">🎥 Video</p>
                      <div className="video-wrap">
                        <video src={videos[0].preview} controls />
                        <button className="video-remove" onClick={clearVideo} disabled={loading}>✕</button>
                      </div>
                    </div>
                  )}

                  {/* Upload zones */}
                  {(images.length < MAX_IMAGES || videos.length === 0) && (
                    <div className={`upload-row ${images.length >= MAX_IMAGES || videos.length > 0 ? 'grid-cols-1' : ''}`}
                      style={{ gridTemplateColumns: images.length >= MAX_IMAGES && videos.length > 0 ? 'none' : undefined }}>

                      {images.length < MAX_IMAGES && videos.length === 0 && (
                        <label className="upload-zone">
                          <div className="upload-icon img-icon">📸</div>
                          <p className="upload-label">Agregar imagen</p>
                          <p className="upload-hint">Hasta {MAX_IMAGES - images.length} más · JPG, PNG, WEBP</p>
                          <input type="file" multiple accept="image/*" onChange={handleImages} disabled={loading} />
                        </label>
                      )}

                      {videos.length === 0 && (
                        <label className="upload-zone video-zone">
                          <div className="upload-icon vid-icon">🎬</div>
                          <p className="upload-label">Agregar video</p>
                          <p className="upload-hint">Hasta 100MB · MP4, WebM</p>
                          <input type="file" accept="video/*" onChange={handleVideos} disabled={loading} />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Clear all */}
                  {(images.length > 0 || videos.length > 0) && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="clear-btn" onClick={clearAll} disabled={loading}>
                        🗑️ Limpiar todo
                      </button>
                    </div>
                  )}

                  {/* Loading */}
                  {loading && (
                    <div className="pub-loading">
                      <div className="spinner" />
                      <p>
                        {uploadProgress < 40 ? "Subiendo imágenes..." :
                          uploadProgress < 70 ? "Subiendo video..." :
                            uploadProgress < 90 ? "Guardando publicación..." : "¡Casi listo!"}
                      </p>
                      <div className="prog-wrap">
                        <div className="prog-bar" style={{ width: `${uploadProgress}%` }} />
                      </div>
                      <p className="pub-pct">{uploadProgress}%</p>
                    </div>
                  )}
                </div>

                <hr className="pub-divider" />

                {/* Footer */}
                <div className="pub-footer">
                  <span className="pub-counter">
                    {images.length > 0 || videos.length > 0
                      ? `${images.length} imagen${images.length !== 1 ? 'es' : ''}${videos.length > 0 ? ' · 1 video' : ''}`
                      : momentText.length > 0 ? `${momentText.length} caracteres` : 'Comparte algo con la comunidad'}
                  </span>
                  <button
                    className="pub-btn"
                    onClick={publishMoment}
                    disabled={loading || (!momentText.trim() && images.length === 0 && videos.length === 0)}
                  >
                    {loading ? '...' : '🐾 Publicar'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Publicar;