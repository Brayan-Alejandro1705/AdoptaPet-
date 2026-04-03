import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { MessageCircle, UserPlus, Clock } from 'lucide-react';
import { connectionService } from '../services/connectionService';

export default function ContactButton({ userId, petId = null, userName = 'este usuario', onChatOpen }) {
  const [status, setStatus] = useState('none'); // none, pending, connected
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwnProfile = currentUser.id === userId;

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    if (isOwnProfile) {
      setLoading(false);
      return;
    }

    try {
      const result = await connectionService.checkConnectionStatus(userId);
      setStatus(result.status);
    } catch (error) {
      console.error('Error al verificar estado:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async () => {
    setSending(true);
    try {
      await connectionService.sendRequest(
        userId,
        `¡Hola! Me gustaría conectar contigo.`,
        petId
      );
      setStatus('pending');
      toast.success('Solicitud de conexión enviada');
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al enviar solicitud');
      }
    } finally {
      setSending(false);
    }
  };

  const handleGoToChat = () => {
    if (onChatOpen) {
      onChatOpen();
    } else {
      window.location.href = '/Chat';
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className="w-full bg-gray-200 text-gray-500 py-3 px-6 rounded-lg flex items-center justify-center gap-2"
      >
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
        Cargando...
      </button>
    );
  }

  if (isOwnProfile) {
    return null;
  }

  if (status === 'connected') {
    return (
      <button
        onClick={handleGoToChat}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg"
      >
        <MessageCircle className="w-5 h-5" />
        Ir al Chat
      </button>
    );
  }

  if (status === 'pending') {
    return (
      <button
        disabled
        className="w-full bg-yellow-100 text-yellow-700 py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 cursor-not-allowed"
      >
        <Clock className="w-5 h-5" />
        Solicitud Pendiente
      </button>
    );
  }

  return (
    <button
      onClick={handleSendRequest}
      disabled={sending}
      className={`
        w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg
        ${sending
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
        }
      `}
    >
      {sending ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          Enviando...
        </>
      ) : (
        <>
          <UserPlus className="w-5 h-5" />
          Enviar Solicitud
        </>
      )}
    </button>
  );
}