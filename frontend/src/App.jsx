import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Adoptar from './pages/Adoptar';
import Perfil from './pages/perfil';
import Notificaciones from './pages/Notificaciones';
import Registro from './pages/registro';
import VerifyEmail from './pages/VerifyEmail';
import Publicar from './pages/publicar';
import Chat from './pages/Chat';
import Ajustes from './pages/ajustes';
import Amigos from './pages/amigos';
import Adminpanel from './pages/AdminPanel';
import CrearAdopcion from './pages/CrearAdopcion';
import AIAssistant from './pages/AIAssistant';
import FloatingAIChat from './components/common/FloatingAIChat';
import Feedback from './pages/Feedback';

// ✅ Maneja /home con o sin token de Google en la URL
const GoogleCallbackOrHome = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get('token');

  useEffect(() => {
    if (tokenFromUrl) {
      const userStr = searchParams.get('user');
      localStorage.setItem('token', tokenFromUrl);
      if (userStr) {
        try {
          const userData = JSON.parse(decodeURIComponent(userStr));
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
          console.error('Error al parsear usuario:', e);
        }
      }
      navigate('/home', { replace: true });
    }
  }, []);

  if (tokenFromUrl) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4" />
          <p className="text-gray-500 text-sm">Iniciando sesión con Google...</p>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  return <Home />;
};

// 🎯 FloatingAIChat solo en rutas privadas
const FloatingAIChatCondicional = () => {
  const location = useLocation();
  const rutasPublicas = ['/login', '/registro', '/verify-email'];
  const esPublica = rutasPublicas.includes(location.pathname);
  const token = localStorage.getItem('token');
  if (esPublica || !token) return null;
  return <FloatingAIChat />;
};

// 🔒 Protege rutas privadas
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Redirigir raíz al login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ✅ /home maneja tanto Google OAuth como acceso normal */}
        <Route path="/home" element={<GoogleCallbackOrHome />} />
        <Route path="/Home" element={<GoogleCallbackOrHome />} />

        {/* Rutas privadas */}
        <Route path="/adoptar" element={<PrivateRoute><Adoptar /></PrivateRoute>} />
        <Route path="/adoptar/crear" element={<PrivateRoute><CrearAdopcion /></PrivateRoute>} />
        <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
        <Route path="/notificaciones" element={<PrivateRoute><Notificaciones /></PrivateRoute>} />
        <Route path="/publicar" element={<PrivateRoute><Publicar /></PrivateRoute>} />
        <Route path="/mensajes" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/ajustes" element={<PrivateRoute><Ajustes /></PrivateRoute>} />
        <Route path="/amigos" element={<PrivateRoute><Amigos /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><Adminpanel /></PrivateRoute>} />
        <Route path="/ai-assistant" element={<PrivateRoute><AIAssistant /></PrivateRoute>} />
        <Route path="/feedback" element={<PrivateRoute><Feedback /></PrivateRoute>} />
      </Routes>

      <FloatingAIChatCondicional />
    </BrowserRouter>
  );
}

export default App;