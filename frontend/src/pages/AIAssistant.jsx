import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import { Send, Upload, Sparkles, Camera, AlertCircle } from 'lucide-react';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hola, soy VetAssist, tu asistente veterinario de AdoptaPet. Estoy aquí para ayudarte con el cuidado de tus mascotas.\n\nPuedo asesorarte sobre nutrición, comportamiento, salud y bienestar de perros y gatos. También puedo analizar fotos de mascotas si las subes.\n\n¿Cómo te llamas y en qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Manejar selección de imagen
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remover imagen seleccionada
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Enviar mensaje o imagen
  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !imageFile) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión para usar el asistente');
      return;
    }

    // Agregar mensaje del usuario
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage,
      image: imagePreview,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      let aiResponse;

      // Si hay imagen, usar endpoint de identificación de raza
      if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Image = reader.result;

          const response = await fetch('http://localhost:5000/api/ai/identify-breed', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              imageBase64: base64Image
            })
          });

          const data = await response.json();

          if (data.success) {
            const analysis = data.data;
            aiResponse = `🔍 **Análisis de la imagen:**\n\n` +
              `🐾 **Animal:** ${analysis.animal}\n` +
              `🏷️ **Raza:** ${analysis.raza}\n` +
              `📊 **Confianza:** ${analysis.confianza}%\n` +
              `📅 **Edad:** ${analysis.edad}\n` +
              `📏 **Tamaño:** ${analysis.tamaño}\n\n` +
              `**Razas probables:**\n${analysis.razasProbables.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n` +
              `**Características:**\n${analysis.caracteristicas.map(c => `• ${c}`).join('\n')}`;
          } else {
            aiResponse = '❌ No pude analizar la imagen. Asegúrate de que sea una foto clara de un perro o gato.';
          }

          // Agregar respuesta de la IA
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            sender: 'ai',
            text: aiResponse,
            timestamp: new Date()
          }]);

          setLoading(false);
          removeImage();
        };
        reader.readAsDataURL(imageFile);

      } else {
        // Si solo hay texto, usar endpoint de chat CON HISTORIAL
        const response = await fetch('http://localhost:5000/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: inputMessage,
            conversationHistory: messages  // ✅ Enviar historial completo
          })
        });

        const data = await response.json();

        if (data.success) {
          aiResponse = data.data.message;
        } else {
          aiResponse = '❌ Hubo un error. Intenta de nuevo.';
        }

        // Agregar respuesta de la IA
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiResponse,
          timestamp: new Date()
        }]);

        setLoading(false);
      }

    } catch (error) {
      console.error('❌ Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: '❌ Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        timestamp: new Date()
      }]);
      setLoading(false);
      removeImage();
    }
  };

  // Enviar con Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-24 lg:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SIDEBAR */}
          <div className="hidden lg:block lg:col-span-3">
            <Sidebar />
          </div>

          {/* CHAT PRINCIPAL */}
          <div className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-xl h-[calc(100vh-10rem)] flex flex-col overflow-hidden">
              
              {/* HEADER DEL CHAT */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Asistente IA AdoptaPet</h2>
                  <p className="text-purple-100 text-sm">Experto en cuidado de mascotas 🐾</p>
                </div>
              </div>

              {/* MENSAJES */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#efeae2]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-3 shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-[#d9fdd3] text-gray-900'
                          : 'bg-white text-gray-900'
                      }`}
                    >
                      {/* Imagen si existe */}
                      {message.image && (
                        <img
                          src={message.image}
                          alt="Uploaded"
                          className="w-full rounded-lg mb-2 max-h-64 object-cover"
                        />
                      )}
                      
                      {/* Texto */}
                      <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      
                      {/* Timestamp */}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[11px] text-gray-500">
                          {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Indicador de carga */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* PREVIEW DE IMAGEN */}
              {imagePreview && (
                <div className="px-6 py-3 bg-gray-50 border-t">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">Imagen lista para analizar</p>
                  </div>
                </div>
              )}

              {/* INPUT DE MENSAJE */}
              <div className="p-4 bg-white border-t">
                <div className="flex items-end gap-2">
                  {/* Botón subir imagen */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition"
                    disabled={loading}
                  >
                    <Camera className="w-5 h-5 text-gray-600" />
                  </button>

                  {/* Input de texto */}
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={imageFile ? "Opcional: agrega una pregunta sobre la imagen..." : "Escribe tu mensaje..."}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-purple-500 outline-none resize-none"
                    rows="1"
                    disabled={loading}
                  />

                  {/* Botón enviar */}
                  <button
                    onClick={handleSendMessage}
                    disabled={(!inputMessage.trim() && !imageFile) || loading}
                    className={`p-3 rounded-full transition ${
                      (!inputMessage.trim() && !imageFile) || loading
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                {/* Info */}
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Sube una foto para identificar razas o pregunta sobre cuidado de mascotas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}