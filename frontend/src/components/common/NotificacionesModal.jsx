// este codigo es de la pagina de Ajustes
import React from 'react';
import Modal from './Modal';
import SubOption from './SubOption';

const NotificacionesModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Notificaciones">
    <SubOption 
      title="Comentarios" 
      description="Notificaciones sobre comentarios en tus publicaciones" 
    />
    <SubOption 
      title="Nuevos seguidores" 
      description="Recibe alertas cuando alguien te siga" 
    />
    <SubOption 
      title="Etiquetas" 
      description="Cuando te etiqueten en publicaciones" 
    />
    <SubOption 
      title="Nuevas publicaciones" 
      description="Alertas sobre nuevas mascotas disponibles" 
    />
    <SubOption 
      title="Reacciones" 
      description="Me gusta y reacciones en tus publicaciones" 
    />
  </Modal>
);

export default NotificacionesModal;