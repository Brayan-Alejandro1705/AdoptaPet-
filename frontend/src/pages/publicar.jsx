import React, { useState, useRef, useEffect } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";

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
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, { method: "POST", body: formData });
  if (!res.ok) { const err = await res.json(); throw new Error(err.error?.message || "Error al subir"); }
  const data = await res.json();
  return { url: data.secure_url, type: resourceType, duration: resourceType === "video" ? data.duration : null };
};

const Publicar = () => {
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [momentText, setMomentText] = useState("");
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const mediaInputRef = useRef(null);

  // Acepta tanto imágenes como videos en un solo input
  const handleMediaFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    const videoFiles = files.filter(f => f.type.startsWith("video/"));

    // Procesar imágenes
    if (imageFiles.length > 0) {
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        setError(`Máximo ${MAX_IMAGES} imágenes permitidas`);
      } else {
        const toAdd = imageFiles.slice(0, remaining).map(file => ({
          preview: URL.createObjectURL(file), file, type: "image"
        }));
        setImages(prev => [...prev, ...toAdd]);
        setError(null);
      }
    }

    // Procesar video (solo 1)
    if (videoFiles.length > 0) {
      if (videos.length >= MAX_VIDEOS) {
        setError("Solo puedes subir 1 video");
      } else {
        const file = videoFiles[0];
        if (file.size > MAX_VIDEO_SIZE) {
          setError("El video no puede superar 100MB");
        } else {
          setVideos([{ preview: URL.createObjectURL(file), file, type: "video" }]);
          setError(null);
        }
      }
    }

    e.target.value = '';
  };

  const clearImage = (index) => setImages(prev => {
    const n = [...prev]; URL.revokeObjectURL(n[index].preview); n.splice(index, 1); return n;
  });
  const clearVideo = () => { if (videos.length > 0) { URL.revokeObjectURL(videos[0].preview); setVideos([]); } };
  const clearAll = () => {
    images.forEach(i => URL.revokeObjectURL(i.preview));
    videos.forEach(v => URL.revokeObjectURL(v.preview));
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
        const up = await Promise.all(images.map(({ file }) => uploadToCloudinary(file, "image")));
        mediaItems = [...mediaItems, ...up]; setUploadProgress(40);
      }
      if (videos.length > 0) {
        setUploadProgress(40);
        const vd = await uploadToCloudinary(videos[0].file, "video");
        mediaItems = [...mediaItems, vd]; setUploadProgress(70);
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
    } catch (err) { setError(err.message || "Error al publicar. Intenta de nuevo."); }
    finally { setLoading(false); }
  };

  const hasMedia = images.length > 0 || videos.length > 0;
  const canPublish = !loading && (momentText.trim().length > 0 || hasMedia);
  const mediaFull = images.length >= MAX_IMAGES && videos.length >= MAX_VIDEOS;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .p-root { min-height:100vh; background:#f5f3ff; font-family:'Plus Jakarta Sans',sans-serif; }

        .p-card {
          background:#fff;
          border-radius:20px;
          border:1px solid #e5e7eb;
          box-shadow:0 2px 20px rgba(109,40,217,0.08);
          overflow:visible;
        }

        /* Top */
        .p-top { display:flex; gap:14px; padding:22px 24px 14px; }

        .p-avatar {
          width:46px; height:46px; border-radius:50%;
          background:linear-gradient(135deg,#7c3aed,#a78bfa);
          display:flex; align-items:center; justify-content:center;
          font-size:21px; flex-shrink:0;
          box-shadow:0 2px 12px rgba(124,58,237,0.3);
        }

        .p-textarea-wrap { flex:1; }

        .p-heading { font-size:15px; font-weight:700; color:#111827; margin:0 0 8px; }

        .p-textarea {
          width:100%; border:none; outline:none; resize:none;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:15px; color:#1f2937; background:transparent;
          min-height:90px; line-height:1.65;
        }
        .p-textarea::placeholder { color:#9ca3af; }

        .p-divider { height:1px; background:#f3f4f6; margin:0 24px; }

        /* Media previews */
        .p-previews { padding:14px 24px 0; display:flex; flex-direction:column; gap:12px; }

        .p-gallery-label { font-size:11.5px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.07em; margin-bottom:8px; }

        .p-gallery {
          display:grid; grid-template-columns:repeat(4,1fr); gap:8px;
        }
        .p-gallery-item {
          position:relative; border-radius:12px; overflow:hidden;
          aspect-ratio:1; background:#ede9fe;
        }
        .p-gallery-item img { width:100%; height:100%; object-fit:cover; display:block; }
        .p-del {
          position:absolute; top:5px; right:5px;
          width:22px; height:22px; border-radius:50%;
          background:rgba(0,0,0,0.55); backdrop-filter:blur(4px);
          border:none; color:#fff; font-size:11px; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          opacity:0; transition:opacity 0.18s;
        }
        .p-gallery-item:hover .p-del { opacity:1; }

        .p-video-wrap { border-radius:14px; overflow:hidden; position:relative; background:#0a0a0a; }
        .p-video-wrap video { width:100%; max-height:200px; object-fit:contain; display:block; }
        .p-del-vid {
          position:absolute; top:8px; right:8px;
          width:28px; height:28px; border-radius:50%;
          background:rgba(0,0,0,0.6); backdrop-filter:blur(6px);
          border:none; color:#fff; font-size:13px; cursor:pointer;
          display:flex; align-items:center; justify-content:center;
          opacity:0; transition:opacity 0.18s;
        }
        .p-video-wrap:hover .p-del-vid { opacity:1; }

        /* Progress */
        .p-prog { padding:12px 24px 0; }
        .p-prog-track { height:5px; background:#ede9fe; border-radius:99px; overflow:hidden; }
        .p-prog-fill { height:100%; background:linear-gradient(90deg,#7c3aed,#a78bfa); border-radius:99px; transition:width 0.4s ease; }
        .p-prog-meta { display:flex; justify-content:space-between; font-size:12px; color:#9ca3af; margin-top:5px; }

        /* Alerts */
        .p-alert {
          margin:4px 24px 0;
          border-radius:12px; padding:10px 14px;
          display:flex; align-items:center; gap:8px;
          font-size:13.5px; font-weight:500;
        }
        .p-alert.err { background:#fef2f2; color:#dc2626; border:1px solid #fecaca; }
        .p-alert.ok  { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; }

        /* Toolbar */
        .p-toolbar {
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 24px 18px;
        }
        .p-tools { display:flex; align-items:center; gap:10px; }

        /* Single media button */
        .p-media-btn {
          display:inline-flex; align-items:center; gap:6px;
          padding:7px 14px;
          border-radius:50px;
          border:2px solid #8b5cf6;
          background:#f5f3ff; color:#7c3aed;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:13px; font-weight:600;
          cursor:pointer;
          transition:all 0.2s ease;
          user-select:none;
        }
        .p-media-btn:hover:not(:disabled) {
          background:#ede9fe;
          border-color:#7c3aed;
          transform:translateY(-1px);
          box-shadow:0 3px 12px rgba(124,58,237,0.2);
        }
        .p-media-btn:disabled { opacity:0.35; cursor:not-allowed; }
        .p-media-btn-icon { font-size:15px; }

        /* Badge */
        .p-badge {
          font-size:12px; color:#7c3aed;
          background:#f5f3ff; border:1px solid #ddd6fe;
          border-radius:20px; padding:4px 10px; font-weight:600;
        }

        /* Clear */
        .p-clear {
          background:none; border:none; font-size:12px; color:#9ca3af;
          cursor:pointer; font-family:inherit; padding:0; transition:color 0.18s;
        }
        .p-clear:hover { color:#dc2626; }

        /* Publish btn */
        .p-pub-btn {
          display:inline-flex; align-items:center; gap:7px;
          background:linear-gradient(135deg,#7c3aed 0%,#a78bfa 100%);
          color:#fff; border:none; border-radius:50px;
          padding:10px 22px;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:14px; font-weight:600; cursor:pointer;
          transition:all 0.22s ease;
          box-shadow:0 3px 16px rgba(124,58,237,0.38);
        }
        .p-pub-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 24px rgba(124,58,237,0.45); }
        .p-pub-btn:disabled { opacity:0.4; cursor:not-allowed; box-shadow:none; transform:none; }

        @keyframes spin { to { transform:rotate(360deg); } }
        .p-spin { width:14px; height:14px; border-radius:50%; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; animation:spin 0.7s linear infinite; }

        @media (max-width:640px) {
          .p-top { padding:16px 16px 12px; }
          .p-toolbar { padding:12px 16px 16px; }
          .p-divider { margin:0 16px; }
          .p-previews { padding:12px 16px 0; }
          .p-alert { margin:4px 16px 0; }
          .p-prog { padding:10px 16px 0; }
          .p-gallery { grid-template-columns:repeat(3,1fr); }
        }
      `}</style>

      <div className="p-root">
        <Header />

        <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 lg:pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="hidden lg:block lg:col-span-3"><Sidebar /></div>

            <div className="lg:col-span-9">
              <div className="p-card">

                {/* Top */}
                <div className="p-top">
                  <div className="p-avatar">🐾</div>
                  <div className="p-textarea-wrap">
                    <p className="p-heading">Comparte un momento</p>
                    <textarea
                      className="p-textarea"
                      placeholder="¿Qué está haciendo tu peludo hoy?"
                      value={momentText}
                      onChange={e => setMomentText(e.target.value)}
                      disabled={loading}
                      rows={4}
                    />
                  </div>
                </div>

                {/* Alerts */}
                {error && <div className="p-alert err">⚠️ {error}</div>}
                {success && <div className="p-alert ok">✅ ¡Publicado exitosamente! Redirigiendo...</div>}

                {/* Previews */}
                {(images.length > 0 || videos.length > 0) && (
                  <div className="p-previews">
                    {images.length > 0 && (
                      <div>
                        <p className="p-gallery-label">📸 Fotos ({images.length}/{MAX_IMAGES})</p>
                        <div className="p-gallery">
                          {images.map((img, idx) => (
                            <div className="p-gallery-item" key={idx}>
                              <img src={img.preview} alt={`img-${idx}`} />
                              <button className="p-del" onClick={() => clearImage(idx)} disabled={loading}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {videos.length > 0 && (
                      <div>
                        <p className="p-gallery-label">🎬 Video</p>
                        <div className="p-video-wrap">
                          <video src={videos[0].preview} controls />
                          <button className="p-del-vid" onClick={clearVideo} disabled={loading}>✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress */}
                {loading && (
                  <div className="p-prog">
                    <div className="p-prog-track">
                      <div className="p-prog-fill" style={{ width:`${uploadProgress}%` }} />
                    </div>
                    <div className="p-prog-meta">
                      <span>
                        {uploadProgress < 40 ? "Subiendo imágenes..." :
                         uploadProgress < 70 ? "Subiendo video..." :
                         uploadProgress < 90 ? "Guardando publicación..." : "¡Casi listo!"}
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                <div className="p-divider" style={{ marginTop:'14px' }} />

                {/* Toolbar */}
                <div className="p-toolbar">
                  <div className="p-tools">

                    {/* Botón único para foto/video */}
                    <button
                      className="p-media-btn"
                      onClick={() => mediaInputRef.current?.click()}
                      disabled={loading || mediaFull}
                      title="Agregar foto o video"
                    >
                      <span className="p-media-btn-icon">📎</span>
                      Foto / Video
                    </button>

                    {/* Input unificado: acepta imagen y video */}
                    <input
                      ref={mediaInputRef}
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleMediaFiles}
                      style={{ display:'none' }}
                    />

                    {hasMedia && (
                      <span className="p-badge">
                        {images.length > 0 && `${images.length} foto${images.length > 1 ? 's' : ''}`}
                        {images.length > 0 && videos.length > 0 && ' · '}
                        {videos.length > 0 && '1 video'}
                      </span>
                    )}

                    {hasMedia && (
                      <button className="p-clear" onClick={clearAll} disabled={loading}>
                        Limpiar todo
                      </button>
                    )}
                  </div>

                  <button className="p-pub-btn" onClick={publishMoment} disabled={!canPublish}>
                    {loading && <span className="p-spin" />}
                    {loading ? 'Publicando...' : 'Publicar'}
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