import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_NOTIFICATIONS = {
  likes: true,
  comments: true,
  followers: true,
  mentions: true,
  messages: true,
};

const NOTIFICATION_SECTIONS = [
  {
    title: "Actividad",
    items: [
      { key: "likes", label: "❤️ Likes en mis publicaciones" },
      { key: "comments", label: "💬 Comentarios" },
      { key: "followers", label: "👥 Nuevos seguidores" },
      { key: "mentions", label: "📢 Menciones" },
    ],
  },
  {
    title: "Mensajes",
    items: [{ key: "messages", label: "✉️ Nuevos mensajes" }],
  },
];

const NotificacionesModal = ({ isOpen, onClose }) => {
  const [notifSettings, setNotifSettings] = useState(DEFAULT_NOTIFICATIONS);
  const [original, setOriginal] = useState(DEFAULT_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);

  const token = localStorage.getItem("token");

  const dirty =
    JSON.stringify(notifSettings) !== JSON.stringify(original);

  // Cargar ajustes al abrir el modal
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setLoadingInitial(true);
      try {
        const res = await fetch(`${API_URL}/api/users/notification-settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.notificationSettings) {
          const merged = { ...DEFAULT_NOTIFICATIONS, ...data.notificationSettings };
          setNotifSettings(merged);
          setOriginal(merged);
        }
      } catch (err) {
        console.error("Error al cargar notificaciones:", err);
      } finally {
        setLoadingInitial(false);
      }
    };

    load();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleNotificacion = (key) =>
    setNotifSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleGuardar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/notification-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notifSettings),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Error al guardar");

      setOriginal(notifSettings);
      toast.success("Configuración de notificaciones guardada");
      onClose();
    } catch (error) {
      console.error("Error al guardar notificaciones:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">🔔 Notificaciones</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              type="button"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          {loadingInitial ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              <span className="ml-3 text-gray-500">Cargando ajustes...</span>
            </div>
          ) : (
            <>
              {NOTIFICATION_SECTIONS.map((section, i) => (
                <div key={i} className="space-y-3">
                  <h3 className="font-semibold text-gray-700 text-lg border-b pb-2">
                    {section.title}
                  </h3>
                  {section.items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-gray-700">{item.label}</span>
                      <button
                        onClick={() => toggleNotificacion(item.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          notifSettings[item.key] ? "bg-blue-600" : "bg-gray-300"
                        }`}
                        type="button"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            notifSettings[item.key]
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              ))}

              <button
                onClick={handleGuardar}
                disabled={loading || !dirty}
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificacionesModal;