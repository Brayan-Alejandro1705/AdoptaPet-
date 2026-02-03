//esta pagina es de amigos
import { X, Send, MessageCircle } from 'lucide-react';
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
      // Obtener el ID del amigo (puede venir como id o _id)
      const friendId = friend.id || friend._id;
      
      console.log('🔍 Friend completo:', friend);
      console.log('🔍 Friend ID final:', friendId);
      console.log(`📨 Enviando mensaje a ${friend.name}: ${message}`);
      
      if (!friendId) {
        throw new Error('No se pudo obtener el ID del usuario');
      }
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Debes iniciar sesión para enviar mensajes');
        setLoading(false);
        return;
      }
      
      // 1. Crear o obtener el chat
      console.log('🔄 Creando/obteniendo chat con ID:', friendId);
      const chatResponse = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          otherUserId: friendId
        })
      });
      
      const chatData = await chatResponse.json();
      console.log('📦 Respuesta del servidor:', chatData);
      
      // El backend devuelve directamente el objeto del chat, no dentro de un wrapper
      if (!chatData.id) {
        throw new Error(chatData.error || 'Error al crear chat');
      }
      
      const chatId = chatData.id;
      console.log('✅ Chat creado/obtenido:', chatId);
      
      // 2. Enviar el mensaje
      console.log('📤 Enviando mensaje...');
      const messageResponse = await fetch(`http://127.0.0.1:5000/api/chat/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: message  // El backend usa 'text' según el modelo Message
        })
      });
      
      const messageData = await messageResponse.json();
      console.log('📦 Respuesta del mensaje:', messageData);
      
      // Verificar si el mensaje se envió correctamente
      if (messageResponse.status !== 200 && messageResponse.status !== 201) {
        throw new Error(messageData.error || 'Error al enviar mensaje');
      }
      
      console.log('✅ Mensaje enviado correctamente');
      
      // 3. Cerrar modal
      onClose();
      
      // 4. Redirigir a mensajes
      navigate('/mensajes');
      
      // 5. Mostrar confirmación después de navegar
      setTimeout(() => {
        alert(`✅ Mensaje enviado a ${friend.name}!\n\n¡Ya puedes chatear!`);
      }, 500);
      
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      alert(`Error al enviar mensaje: ${error.message}\n\nVerifica tu conexión e intenta de nuevo.`);
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
              {friend.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{friend.name}</h3>
              <p className="text-sm text-gray-500">{friend.online ? 'En línea' : 'Desconectado'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
            disabled={loading}
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Área de mensaje */}
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
            💡 El chat se creará automáticamente y serás redirigido a la página de mensajes
          </p>
        </div>

        {/* Footer con botones */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !message.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-700 to-pink-800 hover:shadow-lg text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Enviando...
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