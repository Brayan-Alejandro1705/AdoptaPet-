import React, { useState, useRef, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import { Send, Camera, AlertCircle, Sparkles, X, Minus } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const INITIAL_MESSAGE = {
  id: 1,
  sender: 'ai',
  text: 'Hola, soy Simon BOT, tu asistente veterinario de AdoptaPet. Estoy aquí para ayudarte con el cuidado de tus mascotas.\n\nPuedo asesorarte sobre nutrición, comportamiento, salud y bienestar de perros y gatos. También puedo analizar fotos de mascotas si las subes.\n\n¿Cómo te llamas y en qué puedo ayudarte hoy?',
  timestamp: new Date()
};

export default function AIAssistant() {
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);

  const dragOffset = useRef({ x: 0, y: 0 });
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPosition({
      x: window.innerWidth - 400 - 24,
      y: window.innerHeight - 600 - 24
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const onMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('textarea')) return;
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!isDragging) return;
      const newX = Math.max(0, Math.min(window.innerWidth - 380, e.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
    };
    const onMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const onTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('textarea')) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragOffset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };
  };

  useEffect(() => {
    const onTouchMove = (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const newX = Math.max(0, Math.min(window.innerWidth - 380, touch.clientX - dragOffset.current.x));
      const newY = Math.max(0, Math.min(window.innerHeight - 60, touch.clientY - dragOffset.current.y));
      setPosition({ x: newX, y: newY });
      e.preventDefault();
    };
    const onTouchEnd = () => setIsDragging(false);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 5MB.');
      return;
    }
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

  // ✅ CORREGIDO: Cloudinary → Gemini analyze-pet
  const analyzeImageWithAI = async (file, token) => {
    // PASO 1: Subir a Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'adopta_pet_unsigned');
    formData.append('folder', 'adopta-pet/ai-analysis');

    const cloudRes = await fetch(
      'https://api.cloudinary.com/v1_1/dn9x4ccqk/image/upload',
      { method: 'POST', body: formData }
    );
    const cloudData = await cloudRes.json();

    if (!cloudData.secure_url) throw new Error('Error al subir imagen a Cloudinary');

    // PASO 2: Analizar con Gemini
    const response = await fetch(`${API_BASE}/api/ai/analyze-pet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ imageUrl: cloudData.secure_url })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return '❌ No pude analizar la imagen. Asegúrate de que sea una foto clara de un animal.';
    }

    return data.analysis;
  };

  // ✅ CORREGIDO: /api/ai/chatbot en lugar de /api/ai/chat
  const sendTextMessage = async (message, token) => {
    const response = await fetch(`${API_BASE}/api/ai/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return '❌ Hubo un error al procesar tu mensaje. Intenta de nuevo.';
    }

    return data.reply;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() && !imageFile) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Debes iniciar sesión para usar el asistente');
      return;
    }

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
        aiResponse = await analyzeImageWithAI(imageFile, token);
      } else {
        aiResponse = await sendTextMessage(inputMessage, token);
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiResponse,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('❌ Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: '❌ Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
      removeImage();
    }
  };

  if (position.x === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Header />
        <Sidebar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Header />
      <Sidebar />

      {isOpen && (
        <div
          ref={chatRef}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            width: 370,
            zIndex: 9999,
            cursor: isDragging ? 'grabbing' : 'default',
            userSelect: 'none',
            transition: isDragging ? 'none' : 'box-shadow 0.2s',
            boxShadow: isDragging
              ? '0 24px 60px rgba(109,40,217,0.35)'
              : '0 8px 32px rgba(109,40,217,0.2)',
            borderRadius: 20,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: isMinimized ? 'auto' : 560,
            }}
          >
            {/* Header / Drag handle */}
            <div
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: isDragging ? 'grabbing' : 'grab',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, opacity: 0.6, marginRight: 2 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 3 }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#fff' }} />
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#fff' }} />
                  </div>
                ))}
              </div>

              <div style={{
                width: 36, height: 36, background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0
              }}>
                <Sparkles style={{ width: 18, height: 18, color: '#fff' }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.2 }}>Simon BOT</p>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, margin: 0 }}>Asistente veterinario 🐾</p>
              </div>

              <button
                onClick={() => setIsMinimized(m => !m)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  color: '#fff', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
                title={isMinimized ? 'Expandir' : 'Minimizar'}
              >
                <Minus style={{ width: 14, height: 14 }} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  color: '#fff', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}
                title="Cerrar"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Chat body */}
            {!isMinimized && (
              <>
                {/* Mensajes */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '12px',
                  background: '#efeae2', display: 'flex', flexDirection: 'column', gap: 8,
                  maxHeight: 360, minHeight: 200
                }}>
                  {messages.map((message) => (
                    <div key={message.id} style={{
                      display: 'flex',
                      justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        maxWidth: '82%',
                        background: message.sender === 'user' ? '#d9fdd3' : '#fff',
                        borderRadius: message.sender === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        padding: '8px 12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                      }}>
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Uploaded"
                            style={{ width: '100%', borderRadius: 8, marginBottom: 6, maxHeight: 140, objectFit: 'cover' }}
                          />
                        )}
                        <p style={{
                          fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word', margin: 0, color: '#1f2937'
                        }}>
                          {message.text}
                        </p>
                        <p style={{ fontSize: 10, color: '#9ca3af', margin: '4px 0 0', textAlign: 'right' }}>
                          {message.timestamp.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' })}
                        </p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{
                        background: '#fff',
                        borderRadius: '4px 16px 16px 16px',
                        padding: '10px 14px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                      }}>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          {[0, 0.15, 0.3].map((delay, i) => (
                            <div key={i} style={{
                              width: 8, height: 8, borderRadius: '50%', background: '#7c3aed',
                              animation: 'bounce 1s infinite', animationDelay: `${delay}s`
                            }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Preview imagen */}
                {imagePreview && (
                  <div style={{
                    padding: '8px 12px', background: '#f9fafb',
                    borderTop: '1px solid #f3f4f6', flexShrink: 0
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ position: 'relative' }}>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }}
                        />
                        <button
                          onClick={removeImage}
                          style={{
                            position: 'absolute', top: -6, right: -6,
                            width: 18, height: 18, borderRadius: '50%',
                            background: '#ef4444', border: 'none', color: '#fff',
                            fontSize: 11, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center'
                          }}
                        >×</button>
                      </div>
                      <p style={{ fontSize: 11, color: '#6b7280', margin: 0 }}>
                        Imagen lista para analizar con Gemini ✨
                      </p>
                    </div>
                  </div>
                )}

                {/* Input */}
                <div style={{
                  padding: '10px 12px', background: '#fff',
                  borderTop: '1px solid #f3f4f6', flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: imageFile ? '#ede9fe' : '#f3f4f6',
                        border: imageFile ? '2px solid #7c3aed' : 'none',
                        cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}
                      title="Subir imagen"
                    >
                      <Camera style={{ width: 17, height: 17, color: imageFile ? '#7c3aed' : '#6b7280' }} />
                    </button>

                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={imageFile ? 'Opcional: agrega una pregunta...' : 'Escribe tu mensaje...'}
                      disabled={loading}
                      rows={1}
                      style={{
                        flex: 1, padding: '8px 12px',
                        border: '2px solid #e5e7eb', borderRadius: 18,
                        outline: 'none', resize: 'none', fontSize: 13,
                        fontFamily: 'inherit', background: '#fff', color: '#1f2937',
                        lineHeight: 1.4
                      }}
                      onFocus={e => e.target.style.borderColor = '#7c3aed'}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={(!inputMessage.trim() && !imageFile) || loading}
                      style={{
                        width: 36, height: 36, borderRadius: '50%', border: 'none',
                        background: (!inputMessage.trim() && !imageFile) || loading
                          ? '#e5e7eb'
                          : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                        color: (!inputMessage.trim() && !imageFile) || loading ? '#9ca3af' : '#fff',
                        cursor: (!inputMessage.trim() && !imageFile) || loading ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}
                    >
                      <Send style={{ width: 16, height: 16 }} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                    <AlertCircle style={{ width: 11, height: 11, color: '#9ca3af', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      Sube una foto para que Gemini analice tu mascota
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Burbuja para reabrir */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24,
            width: 60, height: 60, borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
            border: 'none', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(124,58,237,0.45)',
            zIndex: 9999, fontSize: 26
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          title="Abrir Simon BOT"
        >
          🐾
        </button>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}