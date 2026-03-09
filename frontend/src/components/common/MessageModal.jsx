//esta pagina es de amigos
import { X, Send } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MessageModal({ friend, onClose, onSendMessage }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!friend) return null;

  const handleSend = async () => {
    if (!message.trim()) {
      alert('Por favor escribe un mensaje');
      return;
    }

    setLoading(true);

    try {
      const friendId = friend.id || friend._id;

      if (!friendId) throw new Error('No se pudo obtener el ID del usuario');

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Debes iniciar sesión para enviar mensajes');
        return;
      }

      const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

      // PASO 1: Crear o abrir el chat
      const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otherUserId: friendId })
      });

      const chatData = await chatResponse.json();

      if (!chatData.id && !chatData._id) {
        throw new Error(chatData.error || 'Error al crear chat');
      }

      const chatId = chatData.id || chatData._id;

      // PASO 2: Navegar al chat pasando el mensaje en la URL
      // Chat.jsx lo detecta y lo envía automáticamente via socket
      const encodedMsg = encodeURIComponent(message.trim());

      onClose();
      navigate(`/mensajes?chat=${chatId}&autoMsg=${encodedMsg}`);

    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      alert(`Error al enviar mensaje: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-300 to-blue-500 flex items-center justify-center text-white text-lg font-bold">
              {friend.name?.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{friend.name}</h3>
              <p className="text-sm text-gray-500">{friend.online ? 'En línea' : 'Desconectado'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all" disabled={loading}>
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Mensaje */}
        <div className="p-6">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Escribe un mensaje para ${friend.name}...`}
            className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:border-purple-500 transition-all"
            autoFocus
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-2">
            💡 Serás redirigido al chat y el mensaje se enviará automáticamente
          </p>
        </div>

        {/* Botones */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-pink-800 hover:shadow-lg text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Abriendo chat...
              </>
            ) : (
              <>
                <Send size={20} />
                Enviar Mensaje
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}