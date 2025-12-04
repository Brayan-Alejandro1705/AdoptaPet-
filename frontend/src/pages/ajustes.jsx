// este codigo es de la pagina de Ajustes
import React, { useState } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
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
      <CuentaModal isOpen={modalCuenta} onClose={() => setModalCuenta(false)} />
      <NotificacionesModal isOpen={modalNotificaciones} onClose={() => setModalNotificaciones(false)} />
      <PublicacionesModal isOpen={modalPublicaciones} onClose={() => setModalPublicaciones(false)} />
      <EtiquetadoModal isOpen={modalEtiquetado} onClose={() => setModalEtiquetado(false)} />
    </div>
  );
};

export default Ajustes;