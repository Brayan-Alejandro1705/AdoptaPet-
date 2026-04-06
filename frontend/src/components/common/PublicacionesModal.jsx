import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";

const DEFAULT_SETTINGS = {
  privacidadPorDefecto: "publico",
  permitirComentarios: true,
  permitirCompartir: true,
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const PublicacionesModal = ({ isOpen, onClose }) => {
  const [configuracion, setConfiguracion] = useState(DEFAULT_SETTINGS);
  const [original, setOriginal] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(false);

  const token = localStorage.getItem("token");

  const dirty = useMemo(
    () => JSON.stringify(configuracion) !== JSON.stringify(original),
    [configuracion, original]
  );

  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      setLoadingInitial(true);
      try {
        const res = await fetch(`${API_URL}/api/users/me/post-settings`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("No se pudo cargar settings");
        const data = await res.json();

        const merged = { ...DEFAULT_SETTINGS, ...(data || {}) };
        setConfiguracion(merged);
        setOriginal(merged);
      } catch (e) {
        console.error("Error al cargar ajustes de publicaciones:", e);
        setConfiguracion(DEFAULT_SETTINGS);
        setOriginal(DEFAULT_SETTINGS);
      } finally {
        setLoadingInitial(false);
      }
    };

    load();
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrivacidadChange = (valor) =>
    setConfiguracion((prev) => ({ ...prev, privacidadPorDefecto: valor }));

  const toggleConfiguracion = (key) =>
    setConfiguracion((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleGuardar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/users/me/post-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(configuracion),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Error al guardar");
      }

      const data = await res.json().catch(() => ({}));
      const merged = { ...DEFAULT_SETTINGS, ...(data || configuracion) };
      setConfiguracion(merged);
      setOriginal(merged);

      toast.success("Configuración de publicaciones guardada");
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-100">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">📝 Publicaciones</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
              disabled={loading}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
              <span className="ml-3 text-gray-500">Cargando ajustes...</span>
            </div>
          ) : (
            <>
              {/* Privacidad por defecto */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-700 text-lg">
                  Privacidad por defecto
                </h3>
                <p className="text-sm text-gray-500">
                  Elige quién puede ver tus publicaciones
                </p>
                <div className="space-y-2">
                  <PrivacidadOption
                    label="🌍 Público"
                    descripcion="Todos pueden ver"
                    seleccionado={configuracion.privacidadPorDefecto === "publico"}
                    onClick={() => handlePrivacidadChange("publico")}
                  />
                  <PrivacidadOption
                    label="👥 Amigos"
                    descripcion="Solo tus amigos"
                    seleccionado={configuracion.privacidadPorDefecto === "amigos"}
                    onClick={() => handlePrivacidadChange("amigos")}
                  />
                  <PrivacidadOption
                    label="🔒 Privado"
                    descripcion="Solo tú"
                    seleccionado={configuracion.privacidadPorDefecto === "privado"}
                    onClick={() => handlePrivacidadChange("privado")}
                  />
                </div>
              </div>

              {/* Interacción */}
              <div className="border-t pt-6 space-y-4">
                <h3 className="font-semibold text-gray-700 text-lg">Interacción</h3>
                <ConfigToggle
                  label="Permitir comentarios"
                  descripcion="Los usuarios pueden comentar tus publicaciones"
                  checked={configuracion.permitirComentarios}
                  onChange={() => toggleConfiguracion("permitirComentarios")}
                />
                <ConfigToggle
                  label="Permitir compartir"
                  descripcion="Otros pueden compartir tus publicaciones"
                  checked={configuracion.permitirCompartir}
                  onChange={() => toggleConfiguracion("permitirCompartir")}
                />
              </div>

              {/* Guardar */}
              <button
                onClick={handleGuardar}
                disabled={loading || !dirty}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-500 to-blue-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={!dirty ? "No hay cambios por guardar" : "Guardar cambios"}
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

const PrivacidadOption = ({ label, descripcion, seleccionado, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl border-[2.5px] transition-all ${
      seleccionado
        ? "border-purple-500 bg-purple-50"
        : "border-gray-200 hover:border-purple-300"
    }`}
    type="button"
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="font-semibold text-gray-700">{label}</div>
        <div className="text-sm text-gray-500">{descripcion}</div>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-[2.5px] flex items-center justify-center transition-all ${
          seleccionado ? "border-purple-500" : "border-gray-300"
        }`}
      >
        {seleccionado && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />}
      </div>
    </div>
  </button>
);

const ConfigToggle = ({ label, descripcion, checked, onChange }) => (
  <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex-1">
      <div className="text-gray-700 font-medium">{label}</div>
      <div className="text-sm text-gray-500">{descripcion}</div>
    </div>
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ml-4 flex-shrink-0 ${
        checked ? "bg-purple-600" : "bg-gray-300"
      }`}
      type="button"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  </div>
);

export default PublicacionesModal;