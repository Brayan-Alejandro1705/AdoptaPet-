// este codigo es de la pagina de Ajustes
import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import SettingsOption from '../components/common/SettingsOption';
import CuentaModal from '../components/common/CuentaModal';
import NotificacionesModal from '../components/common/NotificacionesModal';
import PublicacionesModal from '../components/common/PublicacionesModal';
import EtiquetadoModal from '../components/common/EtiquetadoModal';

const Ajustes = () => {
  // Estados para abrir/cerrar modales
  const [modalCuenta, setModalCuenta] = useState(false);
  const [modalNotificaciones, setModalNotificaciones] = useState(false);
  const [modalPublicaciones, setModalPublicaciones] = useState(false);
  const [modalEtiquetado, setModalEtiquetado] = useState(false);

  // Estado global de ajustes
  const [settings, setSettings] = useState({
    privacidadPorDefecto: "publico",
    permitirComentarios: true,
    permitirCompartir: true,
    guardarBorradores: true,
    ocultarLikes: false,
    archivarAutomatico: false,
  });

  const token = localStorage.getItem("token");

  // ==============================================
  // 🟣 OBTENER AJUSTES DESDE BACKEND
  // ==============================================
  useEffect(() => {
    fetch("http://localhost:4000/api/settings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(err => console.error("Error obteniendo ajustes:", err));
  }, []);

  // ==============================================
  // 🟢 GUARDAR AJUSTES EN EL BACKEND
  // ==============================================
  const handleGuardar = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/settings", {
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

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
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

      <NotificacionesModal 
        isOpen={modalNotificaciones} 
        onClose={() => setModalNotificaciones(false)} 
        settings={settings}
        setSettings={setSettings}
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
