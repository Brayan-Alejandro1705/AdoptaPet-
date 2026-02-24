import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import { Send, Star, MessageSquare, Lightbulb, Bug, Heart, ChevronLeft } from 'lucide-react';

const FORMSPREE_URL = 'https://formspree.io/f/xojnpzry';

const TIPOS = [
  { id: 'sugerencia', label: 'Sugerencia',  icon: Lightbulb,       color: 'from-yellow-400 to-orange-400' },
  { id: 'error',      label: 'Error / Bug', icon: Bug,             color: 'from-red-400 to-rose-500'     },
  { id: 'mejora',     label: 'Mejora',      icon: Star,            color: 'from-blue-400 to-violet-500'  },
  { id: 'otro',       label: 'Otro',        icon: MessageSquare,   color: 'from-green-400 to-teal-500'   },
];

export default function Feedback() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [tipo, setTipo]       = useState('sugerencia');
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [mensaje, setMensaje] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mensaje.trim()) { setError('Por favor escribe tu mensaje.'); return; }
    if (rating === 0)    { setError('Por favor selecciona una valoración.'); return; }

    setSending(true);
    setError('');

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:  user?.nombre || user?.name || 'Usuario anónimo',
          email:   user?.email  || 'No especificado',
          tipo:    TIPOS.find(t => t.id === tipo)?.label || tipo,
          rating:  `${'⭐'.repeat(rating)} (${rating}/5)`,
          mensaje: mensaje.trim(),
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        setError('Hubo un error al enviar. Intenta de nuevo.');
      }
    } catch {
      setError('Hubo un error al enviar. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pb-24 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 pt-6">

          {/* Título */}
          <div className="mb-6">
            <button onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-4 transition">
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Comentarios y Sugerencias</h1>
                <p className="text-gray-500 text-sm">Tu opinión nos ayuda a mejorar AdoptaPet</p>
              </div>
            </div>
          </div>

          {/* Card principal */}
          {sent ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Gracias por tu feedback!</h2>
              <p className="text-gray-500 mb-8">Tu mensaje ha sido enviado. Lo revisaremos pronto.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setSent(false); setMensaje(''); setRating(0); }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm">
                  Enviar otro
                </button>
                <button onClick={() => navigate('/')}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition text-sm">
                  Ir al inicio
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Tipo de feedback */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="font-semibold text-gray-700 mb-3 text-sm">¿De qué se trata?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TIPOS.map(t => {
                    const Icon = t.icon;
                    const isActive = tipo === t.id;
                    return (
                      <button key={t.id} type="button" onClick={() => setTipo(t.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                          isActive
                            ? `bg-gradient-to-br ${t.color} text-white border-transparent shadow-md scale-[1.03]`
                            : 'border-gray-100 text-gray-600 hover:border-purple-200 hover:bg-purple-50'
                        }`}>
                        <Icon className="w-5 h-5" />
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Valoración con estrellas */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="font-semibold text-gray-700 mb-3 text-sm">¿Cómo calificarías AdoptaPet?</p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      className="transition-transform hover:scale-110 active:scale-95">
                      <Star
                        className={`w-9 h-9 transition-colors ${
                          n <= (hovered || rating)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-200 fill-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-gray-400 mt-2">
                    {['', '😞 Muy malo', '😕 Malo', '😐 Regular', '😊 Bueno', '🤩 Excelente'][rating]}
                  </p>
                )}
              </div>

              {/* Mensaje */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="font-semibold text-gray-700 mb-3 text-sm">Tu mensaje</p>
                <textarea
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  placeholder="Cuéntanos qué mejorarías, qué te gustó o qué problema encontraste..."
                  rows={5}
                  maxLength={1000}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 text-sm text-gray-700 placeholder-gray-400 transition"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-400">{mensaje.length}/1000</span>
                  {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                </div>
              </div>

              {/* Info del usuario (solo lectura) */}
              {(user?.nombre || user?.name) && (
                <div className="bg-purple-50 border border-purple-100 rounded-2xl px-5 py-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(user?.nombre || user?.name || 'U')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-purple-800 truncate">
                      Enviando como: {user?.nombre || user?.name}
                    </p>
                    <p className="text-xs text-purple-500 truncate">{user?.email || 'Sin email'}</p>
                  </div>
                </div>
              )}

              {/* Botón enviar */}
              <button type="submit" disabled={sending}
                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 text-base">
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar feedback
                  </>
                )}
              </button>

            </form>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}