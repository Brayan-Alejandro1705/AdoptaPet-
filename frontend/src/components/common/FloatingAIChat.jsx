import React, { useState, useRef, useEffect } from 'react';
import { Send, Camera, X, Minus, AlertCircle } from 'lucide-react';

export default function FloatingAIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '¡Hola! 👋 Soy VetAssist, tu asistente veterinario de confianza 🐾\n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Notificación de nuevo mensaje cuando el chat está cerrado
  useEffect(() => {
    if (!isOpen && messages.length > 1 && messages[messages.length - 1].sender === 'ai') {
      setHasNewMessage(true);
    }
  }, [messages, isOpen]);

  // Limpiar notificación al abrir
  useEffect(() => {
    if (isOpen) {
      setHasNewMessage(false);
    }
  }, [isOpen]);

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

  // Enviar mensaje
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
        const response = await fetch('http://localhost:5000/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            message: inputMessage,
            conversationHistory: messages
          })
        });

        const data = await response.json();

        if (data.success) {
          aiResponse = data.data.message;
        } else {
          aiResponse = '❌ Hubo un error. Intenta de nuevo.';
        }

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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* VENTANA DEL CHAT */}
      {isOpen && (
        <div className={`fixed z-50 transition-all duration-300 ${
          isMinimized 
            ? 'bottom-28 right-6 w-80' 
            : 'bottom-28 right-6 w-96 h-[500px] md:w-[380px] md:h-[550px]'
        }`}>
          <div className="bg-white rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden">
            
            {/* HEADER */}
            <div className="bg-gradient-to-r from-orange-400 to-amber-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1">
                  {/* 🐶 Imagen del perro */}
                  <img 
                    src="/robot-dog.png" 
                    alt="VetAssist" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">VetAssist IA</h3>
                  <p className="text-orange-100 text-xs">Tu asistente veterinario</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 rounded-full p-1.5 transition"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-1.5 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* CONTENIDO (solo si no está minimizado) */}
            {!isMinimized && (
              <>
                {/* MENSAJES */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#efeae2]">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
                          message.sender === 'user'
                            ? 'bg-[#d9fdd3] text-gray-900'
                            : 'bg-white text-gray-900'
                        }`}
                      >
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Uploaded"
                            className="w-full rounded-lg mb-2 max-h-48 object-cover"
                          />
                        )}
                        
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.text}
                        </p>
                        
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[10px] text-gray-500">
                            {message.timestamp.toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* PREVIEW DE IMAGEN */}
                {imagePreview && (
                  <div className="px-4 py-2 bg-gray-50 border-t">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">Imagen lista</p>
                    </div>
                  </div>
                )}

                {/* INPUT */}
                <div className="p-3 bg-white border-t">
                  <div className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition flex-shrink-0"
                      disabled={loading}
                    >
                      <Camera className="w-4 h-4 text-gray-600" />
                    </button>

                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={imageFile ? "Pregunta sobre la imagen..." : "Escribe un mensaje..."}
                      className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-orange-500 outline-none resize-none text-sm"
                      rows="1"
                      disabled={loading}
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={(!inputMessage.trim() && !imageFile) || loading}
                      className={`p-2 rounded-full transition flex-shrink-0 ${
                        (!inputMessage.trim() && !imageFile) || loading
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-400 to-amber-600 text-white hover:shadow-lg'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2 text-[10px] text-gray-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>Sube fotos o pregunta sobre mascotas</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* PERRO FLOTANTE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-24 h-24 z-50 hover:scale-110 transition-transform duration-300 group"
        style={{ background: 'transparent', border: 'none' }}
      >
        {/* 🐶 Solo la imagen del perro */}
        <img 
          src="/robot-dog.png" 
          alt="VetAssist" 
          className="w-full h-full object-contain drop-shadow-2xl"
        />
        
        {/* Badge de notificación */}
        {hasNewMessage && !isOpen && (
          <div className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}
      </button>

      {/* Estilos adicionales para animaciones */}
      <style>{`
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </>
  );
}