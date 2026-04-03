import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { UserPlus, Check, X, MessageCircle, Clock } from 'lucide-react';
import { connectionService } from '../services/connectionService';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';

export default function ConnectionRequests() {
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('received'); // received, sent
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const [received, sent] = await Promise.all([
        connectionService.getReceivedRequests(),
        connectionService.getSentRequests()
      ]);
      setReceivedRequests(received);
      setSentRequests(sent);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await connectionService.acceptRequest(requestId);
      toast.success('Solicitud aceptada. ¡Ahora pueden chatear!');
      loadRequests();
    } catch (error) {
      toast.error('Error al aceptar solicitud');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await connectionService.rejectRequest(requestId);
      toast.success('Solicitud rechazada');
      loadRequests();
    } catch (error) {
      toast.error('Error al rechazar solicitud');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#efeae2] pb-20 md:pb-8">
        <Header />
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando solicitudes...</p>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#efeae2] pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          <div className="hidden md:block md:col-span-3">
            <Sidebar />
          </div>

          <main className="col-span-1 md:col-span-9">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              
              {/* Header */}
              <div className="p-6 border-b bg-gradient-to-r from-purple-500 to-pink-500">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-6 h-6" />
                  Solicitudes de Conexión
                </h1>
                <p className="text-purple-100 mt-1">
                  Gestiona tus conexiones y solicitudes pendientes
                </p>
              </div>

              {/* Tabs */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('received')}
                  className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                    activeTab === 'received'
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Recibidas ({receivedRequests.length})
                </button>
                <button
                  onClick={() => setActiveTab('sent')}
                  className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                    activeTab === 'sent'
                      ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Enviadas ({sentRequests.length})
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {activeTab === 'received' ? (
                  <div className="space-y-4">
                    {receivedRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No tienes solicitudes pendientes</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Las solicitudes que recibas aparecerán aquí
                        </p>
                      </div>
                    ) : (
                      receivedRequests.map(request => (
                        <div
                          key={request._id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition"
                        >
                          <img
                            src={request.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.sender?.nombre || 'Usuario')}&background=random`}
                            alt={request.sender?.nombre}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">
                              {request.sender?.nombre}
                            </h3>
                            <p className="text-sm text-gray-500">{request.sender?.email}</p>
                            {request.message && (
                              <p className="text-sm text-gray-600 mt-1">"{request.message}"</p>
                            )}
                            {request.petRelated && (
                              <p className="text-xs text-purple-600 mt-1">
                                Relacionado con: {request.petRelated.nombre}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(request.createdAt).toLocaleDateString('es-CO')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(request._id)}
                              className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition"
                              title="Aceptar"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(request._id)}
                              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition"
                              title="Rechazar"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sentRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No has enviado solicitudes</p>
                        <p className="text-gray-400 text-sm mt-2">
                          Las solicitudes que envíes aparecerán aquí
                        </p>
                      </div>
                    ) : (
                      sentRequests.map(request => (
                        <div
                          key={request._id}
                          className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50"
                        >
                          <img
                            src={request.receiver?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.receiver?.nombre || 'Usuario')}&background=random`}
                            alt={request.receiver?.nombre}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">
                              {request.receiver?.nombre}
                            </h3>
                            <p className="text-sm text-gray-500">{request.receiver?.email}</p>
                            {request.message && (
                              <p className="text-sm text-gray-600 mt-1">"{request.message}"</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Enviada el {new Date(request.createdAt).toLocaleDateString('es-CO')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-yellow-600">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm font-semibold">Pendiente</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}