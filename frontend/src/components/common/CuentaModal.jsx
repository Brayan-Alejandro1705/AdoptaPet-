// este codigo es de la pagina de Ajustes
import React from 'react';
import Modal from './Modal';
import SubOption from './SubOption';

const CuentaModal = ({ isOpen, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Cuenta">
    <SubOption 
      title="Contraseña" 
      onClick={() => alert('Abriendo: Contraseña')} 
    />
    <SubOption 
      title="Desactivar cuenta" 
      onClick={() => alert('Abriendo: Desactivar cuenta')} 
    />
  </Modal>
);

export default CuentaModal;