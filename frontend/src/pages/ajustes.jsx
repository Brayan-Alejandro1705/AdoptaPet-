import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';

import SettingsOption from '../components/common/SettingsOption';
import CuentaModal from '../components/common/CuentaModal';
import NotificacionesModal from '../components/common/NotificacionesModal';
import PublicacionesModal from '../components/common/PublicacionesModal';
import EtiquetadoModal from '../components/common/EtiquetadoModal';

const API_URL = "http://localhost:5000";

const Ajustes = () => {
  const [modalCuenta, setModalCuenta] = useState(false);
  const [modalNotificaciones, setModalNotificaciones] = useState(false);
  const [modalPublicaciones, setModalPublicaciones] = useState(false);
  const [modalEtiquetado, setModalEtiquetado] = useState(false);

  // Estado global de ajustes de publicaciones/cuenta
  const [settings, setSettings] = useState({
    privacidadPorDefecto: 'publico',
    permitirComentarios: true,
    permitirCompartir: true,
    guardarBorradores: true,
    ocultarLikes: false,
    archivarAutomatico: false,
  });

  // ✅ Estado específico para notificaciones
  const [notificationSettings, setNotificationSettings] = useState({
    likes: true,
    comments: true,
    followers: true,
    mentions: true,
    messages: true,
  });

  const token = localStorage.getItem('token');

  // Obtener ajustes generales
  useEffect(() => {
    fetch(`${API_URL}/api/settings`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(err => console.error("Error obteniendo ajustes:", err));
  }, []);

  // Guardar ajustes generales
  const handleGuardar = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        alert("✔️ Ajustes guardados correctamente");
      } else {
        alert("❌ No se pudieron guardar los ajustes");
      }
    } catch (error) {
      console.error("Error guardando ajustes:", error);
    }
  };

  // Guardar ajustes de notificaciones
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
    if (!data.success) throw new Error("Error al guardar notificaciones");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      <Sidebar />

      <div className="max-w-4xl mx-auto px-4 py-8 ml-64">
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

          <SettingsOption
            icon="🏷️"
            title="Etiquetado"
            onClick={() => setModalEtiquetado(true)}
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

      {/* ✅ CORREGIDO: props correctas para NotificacionesModal */}
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
      />

      <EtiquetadoModal
        isOpen={modalEtiquetado}
        onClose={() => setModalEtiquetado(false)}
        settings={settings}
        setSettings={setSettings}
      />
    </div>
  );
};

export default Ajustes;