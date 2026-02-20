import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import { Send, Camera, AlertCircle, Sparkles } from 'lucide-react';

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Hola, soy Simon BOT, tu asistente veterinario de AdoptaPet. Estoy aquí para ayudarte con el cuidado de tus mascotas.\n\nPuedo asesorarte sobre nutrición, comportamiento, salud y bienestar de perros y gatos. También puedo analizar fotos de mascotas si las subes.\n\n¿Cómo te llamas y en qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('La imagen es muy grande. Máximo 5MB.'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !imageFile) return;
    const token = localStorage.getItem('token');
    if (!token) { alert('Debes iniciar sesión para usar el asistente'); return; }

    const userMessage = {
      id: Date.now(), sender: 'user',
      text: inputMessage, image: imagePreview, timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      let aiResponse;
      if (imageFile) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const response = await fetch('http://localhost:5000/api/ai/identify-breed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ imageBase64: reader.result })
          });
          const data = await response.json();
          if (data.success) {
            const a = data.data;
            aiResponse = `🔍 **Análisis de la imagen:**\n\n🐾 **Animal:** ${a.animal}\n🏷️ **Raza:** ${a.raza}\n📊 **Confianza:** ${a.confianza}%\n📅 **Edad:** ${a.edad}\n📏 **Tamaño:** ${a.tamaño}\n\n**Razas probables:**\n${a.razasProbables.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\n**Características:**\n${a.caracteristicas.map(c => `• ${c}`).join('\n')}`;
          } else {
            aiResponse = '❌ No pude analizar la imagen. Asegúrate de que sea una foto clara de un perro o gato.';
          }
          setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiResponse, timestamp: new Date() }]);
          setLoading(false);
          removeImage();
        };
        reader.readAsDataURL(imageFile);
      } else {
        const response = await fetch('http://localhost:5000/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ message: inputMessage, conversationHistory: messages })
        });
        const data = await response.json();
        aiResponse = data.success ? data.data.message : '❌ Hubo un error. Intenta de nuevo.';
        setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiResponse, timestamp: new Date() }]);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error:', error);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: '❌ Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.', timestamp: new Date() }]);
      setLoading(false);
      removeImage();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      <Sidebar />

      {/* md:ml-64 para dejar espacio al sidebar fijo */}
      <div className="md:ml-64 pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto px-3 md:px-6 pt-4 md:pt-6 h-[calc(100vh-64px-80px)] md:h-[calc(100vh-64px)] flex flex-col">

          {/* Chat container */}
          <div className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden flex-1 min-h-0">

            {/* Header del chat */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 md:p-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-white font-bold text-base md:text-lg leading-tight">Asistente IA AdoptaPet</h2>
                <p className="text-purple-100 text-xs md:text-sm">Experto en cuidado de mascotas 🐾</p>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3 bg-[#efeae2] min-h-0">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-lg px-3 py-2.5 shadow-sm ${
                    message.sender === 'user' ? 'bg-[#d9fdd3] text-gray-900' : 'bg-white text-gray-900'
                  }`}>
                    {message.image && (
                      <img src={message.image} alt="Uploaded" className="w-full rounded-lg mb-2 max-h-48 object-cover" />
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-gray-400">
                        {message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Preview imagen */}
            {imagePreview && (
              <div className="px-3 py-2 bg-gray-50 border-t flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={imagePreview} alt="Preview" className="w-14 h-14 rounded-lg object-cover" />
                    <button onClick={removeImage}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">
                      ×
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">Imagen lista para analizar</p>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 md:p-4 bg-white border-t flex-shrink-0">
              <div className="flex items-end gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full transition flex-shrink-0"
                  disabled={loading}
                >
                  <Camera className="w-5 h-5 text-gray-600" />
                </button>

                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={imageFile ? 'Opcional: agrega una pregunta...' : 'Escribe tu mensaje...'}
                  className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-2xl focus:border-purple-400 outline-none resize-none text-sm"
                  rows="1"
                  disabled={loading}
                />

                <button
                  onClick={handleSendMessage}
                  disabled={(!inputMessage.trim() && !imageFile) || loading}
                  className={`p-2.5 rounded-full transition flex-shrink-0 ${
                    (!inputMessage.trim() && !imageFile) || loading
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                  }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-1.5 text-xs text-gray-400 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                <span>Sube una foto para identificar razas o pregunta sobre mascotas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}