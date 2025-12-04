import React, { useState } from 'react';

const PublicacionesModal = ({ isOpen, onClose }) => {
  const [configuracion, setConfiguracion] = useState({
    privacidadPorDefecto: 'publico',
    permitirComentarios: true,
    permitirCompartir: true,
    guardarBorradores: true,
    ocultarLikes: false,
    archivarAutomatico: false
  });

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handlePrivacidadChange = (valor) => {
    setConfiguracion(prev => ({
      ...prev,
      privacidadPorDefecto: valor
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
      // Aquí conecta con tu API
      // const response = await fetch('/api/posts/settings', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(configuracion)
      // });
      
      // Simulación de guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('✅ Configuración de publicaciones guardada');
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
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-purple-600 hover:scrollbar-thumb-blue-600">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-500 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">📝 Publicaciones</h2>
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
          {/* Privacidad por defecto */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 text-lg">Privacidad por defecto</h3>
            <p className="text-sm text-gray-500">Elige quién puede ver tus publicaciones</p>
            
            <div className="space-y-2">
              <PrivacidadOption 
                valor="publico"
                label="🌍 Público"
                descripcion="Todos pueden ver"
                seleccionado={configuracion.privacidadPorDefecto === 'publico'}
                onClick={() => handlePrivacidadChange('publico')}
              />
              
              <PrivacidadOption 
                valor="amigos"
                label="👥 Amigos"
                descripcion="Solo tus amigos"
                seleccionado={configuracion.privacidadPorDefecto === 'amigos'}
                onClick={() => handlePrivacidadChange('amigos')}
              />
              
              <PrivacidadOption 
                valor="privado"
                label="🔒 Privado"
                descripcion="Solo tú"
                seleccionado={configuracion.privacidadPorDefecto === 'privado'}
                onClick={() => handlePrivacidadChange('privado')}
              />
            </div>
          </div>

          {/* Opciones de interacción */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold text-gray-700 text-lg">Interacción</h3>
            
            <ConfigToggle 
              label="Permitir comentarios"
              descripcion="Los usuarios pueden comentar"
              checked={configuracion.permitirComentarios}
              onChange={() => toggleConfiguracion('permitirComentarios')}
            />
            
            <ConfigToggle 
              label="Permitir compartir"
              descripcion="Otros pueden compartir tus posts"
              checked={configuracion.permitirCompartir}
              onChange={() => toggleConfiguracion('permitirCompartir')}
            />
          </div>

          {/* Opciones adicionales */}
          <div className="border-purple-700 pt-6 space-y-4">
            <h3 className="font-semibold text-gray-700 text-lg">Opciones adicionales</h3>
            
            <ConfigToggle 
              label="Guardar borradores automáticamente"
              descripcion="Guarda tus posts mientras escribes"
              checked={configuracion.guardarBorradores}
              onChange={() => toggleConfiguracion('guardarBorradores')}
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

// Componente para opciones de privacidad
const PrivacidadOption = ({ valor, label, descripcion, seleccionado, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-4 rounded-xl border-[2.5px] transition-all ${
      seleccionado 
        ? 'border-purple-500 bg-purple-100' 
        : 'border-gray-300 hover:border-purple-400'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <div className="font-semibold text-gray-700">{label}</div>
        <div className="text-sm text-gray-500">{descripcion}</div>
      </div>

      {/* CÍRCULO DE SELECCIÓN IGUAL AL DEL MODAL DE ETIQUETADO */}
      <div
        className={`w-5 h-5 rounded-full border-[2.5px] flex items-center justify-center transition-all ${
          seleccionado 
            ? 'border-purple-500' 
            : 'border-gray-400'
        }`}
      >
        {seleccionado && (
          <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
        )}
      </div>
    </div>
  </button>
);


// Componente para toggles de configuración
const ConfigToggle = ({ label, descripcion, checked, onChange }) => (
  <div className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div className="flex-1">
      <div className="text-gray-700 font-medium">{label}</div>
      <div className="text-sm text-gray-500">{descripcion}</div>
    </div>
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ml-4 flex-shrink-0 ${
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

export default PublicacionesModal;