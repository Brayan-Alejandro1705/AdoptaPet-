import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';

import SettingsOption from '../components/common/SettingsOption';
import CuentaModal from '../components/common/CuentaModal';
import NotificacionesModal from '../components/common/NotificacionesModal';
import PublicacionesModal from '../components/common/PublicacionesModal';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}`;

const Ajustes = () => {
  const [modalCuenta, setModalCuenta] = useState(false);
  const [modalNotificaciones, setModalNotificaciones] = useState(false);
  const [modalPublicaciones, setModalPublicaciones] = useState(false);

  const [settings, setSettings] = useState({
    privacidadPorDefecto: 'publico',
    permitirComentarios: true,
    permitirCompartir: true,
    guardarBorradores: true,
    ocultarLikes: false,
    archivarAutomatico: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    likes: true,
    comments: true,
    followers: true,
    mentions: true,
    messages: true,
  });

  const token = localStorage.getItem('token');

  // ✅ Cargar ajustes de publicaciones
  useEffect(() => {
    fetch(`${API_URL}/api/users/me/post-settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        // ✅ FIX: condición corregida
        if (data && data.success !== false) {
          setSettings(prev => ({ ...prev, ...data }));
        }
      })
      .catch(err => console.error("Error obteniendo ajustes:", err));
  }, []);

  // ✅ Cargar ajustes de notificaciones
  useEffect(() => {
    fetch(`${API_URL}/api/users/notification-settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.notificationSettings) {
          setNotificationSettings(data.notificationSettings);
        }
      })
      .catch(err => console.error("Error obteniendo notificaciones:", err));
  }, []);

  // ✅ Guardar ajustes de publicaciones
  const handleGuardar = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/me/post-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          privacidadPorDefecto: settings.privacidadPorDefecto,
          permitirComentarios: settings.permitirComentarios,
          permitirCompartir: settings.permitirCompartir,
        }),
      });
      const data = await res.json();
      if (data) {
        alert("✔️ Ajustes guardados correctamente");
      } else {
        alert("❌ No se pudieron guardar los ajustes");
      }
    } catch (error) {
      console.error("Error guardando ajustes:", error);
    }
  };

  // ✅ FIX: manejo de error mejorado
  const handleGuardarNotificaciones = async () => {
    const res = await fetch(`${API_URL}/api/users/notification-settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(notificationSettings),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Error al guardar notificaciones");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      <Sidebar />

      <div className="max-w-4xl mx-auto px-4 py-8 md:ml-64">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

          <SettingsOption
            icon="👤"
            title="Cuenta"
            onClick={() => setModalCuenta(true)}
          />

          <SettingsOption
            icon="🔔"
            title="Notificaciones"
            onClick={() => setModalNotificaciones(true)}
          />

          <SettingsOption
            icon="📝"
            title="Publicaciones"
            onClick={() => setModalPublicaciones(true)}
          />

        </div>
      </div>

      {/* Modales */}
      <CuentaModal
        isOpen={modalCuenta}
        onClose={() => setModalCuenta(false)}
        settings={settings}
        setSettings={setSettings}
      />

      <NotificacionesModal
        isOpen={modalNotificaciones}
        onClose={() => setModalNotificaciones(false)}
        notificationSettings={notificationSettings}
        setNotificationSettings={setNotificationSettings}
        onSave={handleGuardarNotificaciones}
      />

      <PublicacionesModal
        isOpen={modalPublicaciones}
        onClose={() => setModalPublicaciones(false)}
        settings={settings}
        setSettings={setSettings}
        onSave={handleGuardar}
      />
    </div>
  );
};

export default Ajustes;