// este codigo es de la pagina de Ajustes
import React from 'react';
import Modal from './Modal';
import SubOption from './SubOption';

const EtiquetadoModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Etiquetado">
    <SubOption 
      title="Quien puede etiquetarme" 
      onClick={() => alert('Abriendo: Quien puede etiquetarme')} 
    />
    <SubOption 
      title="Revisar etiquetas" 
      onClick={() => alert('Abriendo: Revisar etiquetas')} 
    />
    <SubOption 
      title="Quien puede ver lo que publican en mi perfil" 
      onClick={() => alert('Abriendo: Quien puede ver lo que publican en mi perfil')} 
    />
  </Modal>
);

export default EtiquetadoModal;