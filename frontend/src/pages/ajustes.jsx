import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import SettingsOption from '../components/common/SettingsOption';
import CuentaModal from '../components/common/CuentaModal';
import NotificacionesModal from '../components/common/NotificacionesModal';
import PublicacionesModal from '../components/common/PublicacionesModal';
import EtiquetadoModal from '../components/common/EtiquetadoModal';

const Ajustes = () => {
  const [modalCuenta, setModalCuenta] = useState(false);
  const [modalNotificaciones, setModalNotificaciones] = useState(false);
  const [modalPublicaciones, setModalPublicaciones] = useState(false);
  const [modalEtiquetado, setModalEtiquetado] = useState(false);

  const [settings, setSettings] = useState({
    privacidadPorDefecto: 'publico',
    permitirComentarios: true,
    permitirCompartir: true,
    guardarBorradores: true,
    ocultarLikes: false,
    archivarAutomatico: false,
  });

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch('http://localhost:4000/api/settings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => { if (data.success && data.settings) setSettings(data.settings); })
      .catch(err => console.error('Error obteniendo ajustes:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto px-3 md:px-6 pt-4 md:pt-6">

          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-5">⚙️ Ajustes</h1>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <SettingsOption icon="👤" title="Cuenta"         onClick={() => setModalCuenta(true)} />
            <SettingsOption icon="🔔" title="Notificaciones" onClick={() => setModalNotificaciones(true)} />
            <SettingsOption icon="📝" title="Publicaciones"  onClick={() => setModalPublicaciones(true)} />
            <SettingsOption icon="🏷️" title="Etiquetado"    onClick={() => setModalEtiquetado(true)} />
          </div>
        </div>
      </div>

      <BottomNav />

      <CuentaModal        isOpen={modalCuenta}         onClose={() => setModalCuenta(false)}         settings={settings} setSettings={setSettings} />
      <NotificacionesModal isOpen={modalNotificaciones} onClose={() => setModalNotificaciones(false)} settings={settings} setSettings={setSettings} />
      <PublicacionesModal  isOpen={modalPublicaciones}  onClose={() => setModalPublicaciones(false)}  settings={settings} setSettings={setSettings} />
      <EtiquetadoModal     isOpen={modalEtiquetado}     onClose={() => setModalEtiquetado(false)}     settings={settings} setSettings={setSettings} />
    </div>
  );
};

export default Ajustes;