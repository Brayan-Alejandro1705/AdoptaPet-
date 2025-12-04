// este codigo es de la pagina de Ajustes
import React from 'react';
import Modal from './Modal';
import SubOption from './SubOption';

const PublicacionesModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Publicaciones">
    <SubOption 
      title="Quien puede ver mis publicaciones" 
      onClick={() => alert('Abriendo: Quien puede ver mis publicaciones')} 
    />
    <SubOption 
      title="Comentarios" 
      onClick={() => alert('Abriendo: Comentarios')} 
    />
    <SubOption 
      title="Likes" 
      onClick={() => alert('Abriendo: Likes')} 
    />
    <SubOption 
      title="Compartidos" 
      onClick={() => alert('Abriendo: Compartidos')} 
    />
  </Modal>
);

export default PublicacionesModal;