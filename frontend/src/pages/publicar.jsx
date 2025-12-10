import React, { useState } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import BottomNav from "../components/layout/BottomNav";
import PublishTextarea from "../components/common/PublishTextarea";
import ImagePreview from "../components/common/ImagePreview";
import PetInfo from "../components/common/PetInfo";
import PublishOptions from "../components/common/PublishOptions";
import PublishFooter from "../components/common/PublishFooter";

const Publicar = () => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [petData, setPetData] = useState({
    nombre: "",
    tipo: "",
    raza: "",
    edad: "",
    adopcion: false,
  });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
      setImageFile(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageFile(null);
  };

  const publish = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      // Validaciones
      if (!text.trim() && !imageFile) {
        setError("Debes escribir algo o subir una imagen");
        setLoading(false);
        return;
      }

      // Obtener token del usuario
      const token = localStorage.getItem('token');
      console.log('🔑 Token encontrado:', token ? '✅ Sí' : '❌ No');
      
      if (!token) {
        setError("Debes iniciar sesión para publicar");
        setLoading(false);
        return;
      }

      // Crear FormData para enviar imagen y datos
      const formData = new FormData();
      formData.append('contenido', text);
      formData.append('tipo', petData.adopcion ? 'adoption-story' : 'update');
      
      // Si hay imagen, agregarla
      if (imageFile) {
        console.log('📸 Imagen agregada:', imageFile.name, imageFile.size, 'bytes');
        formData.append('imagen', imageFile);
      }

      // Si hay información de mascota, agregarla
      if (petData.nombre || petData.tipo || petData.raza || petData.edad) {
        console.log('🐾 Info de mascota:', petData);
        formData.append('petInfo', JSON.stringify({
          nombre: petData.nombre,
          tipo: petData.tipo,
          raza: petData.raza,
          edad: petData.edad
        }));
      }

      formData.append('disponibleAdopcion', petData.adopcion);

      console.log('📤 Enviando petición a: http://localhost:5000/api/posts');
      console.log('📤 Método: POST');
      console.log('📤 Contenido:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

      // Enviar al backend
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('📥 Status Code:', response.status);
      console.log('📥 Status Text:', response.statusText);

      // Intentar leer la respuesta
      let data;
      const contentType = response.headers.get("content-type");
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log('📥 Respuesta JSON:', data);
      } else {
        const textResponse = await response.text();
        console.log('📥 Respuesta TEXT:', textResponse);
        throw new Error(`El servidor no respondió correctamente. Verifica que el backend esté corriendo en http://localhost:5000`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Publicación creada exitosamente:', data);

      // Limpiar formulario
      setText("");
      setImage(null);
      setImageFile(null);
      setPetData({
        nombre: "",
        tipo: "",
        raza: "",
        edad: "",
        adopcion: false,
      });

      setSuccess(true);
      
      // Redirigir al inicio después de 2 segundos
      setTimeout(() => {
        window.location.href = '/home';
      }, 2000);

    } catch (err) {
      console.error('❌ ERROR COMPLETO:', err);
      console.error('❌ Mensaje:', err.message);
      console.error('❌ Stack:', err.stack);
      
      // Mensajes de error más específicos
      let errorMessage = err.message;
      
      if (err.message.includes('Failed to fetch')) {
        errorMessage = 'No se puede conectar al servidor. Verifica que el backend esté corriendo en http://localhost:5000';
      } else if (err.message.includes('NetworkError')) {
        errorMessage = 'Error de red. Verifica tu conexión o que el backend esté activo.';
      }
      
      setError(errorMessage || 'Error al publicar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SIDEBAR IZQUIERDO - 3 columnas */}
          <div className="hidden lg:block lg:col-span-3">
            <Sidebar />
          </div>

          {/* CONTENIDO PRINCIPAL - 9 columnas */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              
              {/* Título */}
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  📝 Crear Publicación
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Comparte momentos con tus mascotas
                </p>
              </div>

              {/* Mensajes de estado */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <span>✅</span>
                  <span>¡Publicación creada exitosamente! Redirigiendo...</span>
                </div>
              )}

              {/* Área de texto */}
              <PublishTextarea 
                value={text}
                setValue={setText}
                disabled={loading}
              />

              {/* Preview de imagen */}
              {image && (
                <ImagePreview 
                  image={image} 
                  clearImage={clearImage}
                  disabled={loading}
                />
              )}

              {/* Información de mascota */}
              <PetInfo 
                petData={petData} 
                setPetData={setPetData}
                disabled={loading}
              />

              {/* Opciones de publicación */}
              <PublishOptions 
                handleImage={handleImage}
                disabled={loading}
              />

              {/* Footer con botón publicar */}
              <PublishFooter 
                publish={publish}
                loading={loading}
                disabled={loading || (!text.trim() && !imageFile)}
              />

              {/* Indicador de carga */}
              {loading && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="text-gray-600 mt-2">Publicando...</p>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  );
};

export default Publicar;