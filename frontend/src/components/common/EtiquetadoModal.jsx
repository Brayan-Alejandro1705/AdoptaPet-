import React, { useState } from 'react';

const EtiquetadoModal = ({ isOpen, onClose }) => {
  const [configuracion, setConfiguracion] = useState({
    quienPuedeEtiquetar: 'todos',
    aprobarEtiquetas: false,
    mostrarEtiquetasEnPerfil: true
  });

  

  const [nuevoUsuario, setNuevoUsuario] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleQuienPuedeChange = (valor) => {
    setConfiguracion(prev => ({
      ...prev,
      quienPuedeEtiquetar: valor
    }));
  };

  const toggleConfiguracion = (key) => {
    setConfiguracion(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleGuardar = async () => {
    setLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('✅ Configuración de etiquetado guardada');
      onClose();
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('❌ Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">🏷️ Etiquetado</h2>
            <button 
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6">
          
          {/* Quién puede etiquetarte */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 text-lg">¿Quién puede etiquetarte?</h3>

            <div className="space-y-2">
              <OpcionEtiquetado 
                valor="todos"
                label="Todos"
                seleccionado={configuracion.quienPuedeEtiquetar === 'todos'}
                onClick={() => handleQuienPuedeChange('todos')}
              />

              <OpcionEtiquetado 
                valor="amigos"
                label="Solo amigos"
                seleccionado={configuracion.quienPuedeEtiquetar === 'amigos'}
                onClick={() => handleQuienPuedeChange('amigos')}
              />

              <OpcionEtiquetado 
                valor="nadie"
                label="Nadie"
                seleccionado={configuracion.quienPuedeEtiquetar === 'nadie'}
                onClick={() => handleQuienPuedeChange('nadie')}
              />
            </div>
          </div>

          {/* Opciones de privacidad */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-gray-700 text-lg">Privacidad</h3>

            <ConfigToggle 
              label="Aprobar etiquetas manualmente"
              descripcion="Revisa las etiquetas antes de que aparezcan"
              checked={configuracion.aprobarEtiquetas}
              onChange={() => toggleConfiguracion('aprobarEtiquetas')}
            />

            <ConfigToggle 
              label="Mostrar etiquetas en perfil"
              descripcion="Las etiquetas aparecen en tu perfil"
              checked={configuracion.mostrarEtiquetasEnPerfil}
              onChange={() => toggleConfiguracion('mostrarEtiquetasEnPerfil')}
            />
          </div>

         

          {/* Botón Guardar */}
          <button 
            onClick={handleGuardar}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-purple-500 to-blue-500  text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------- */
/* Subcomponentes                  */
/* ------------------------------- */

const OpcionEtiquetado = ({ valor, label, seleccionado, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
      seleccionado 
        ? 'border-purple-700 bg-purple-100' 
        : 'border-gray-200 hover:border-purple-500'
    }`}
  >
    <div className="flex items-center justify-between">
      <div className="font-semibold text-gray-700">{label}</div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          seleccionado ? 'border-purple-500 bg-purple-500' : 'border-gray-300'
        }`}
      >
        {seleccionado && <div className="w-2 h-2 bg-white rounded-full" />}
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
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 ${
        checked ? 'bg-purple-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default EtiquetadoModal;
