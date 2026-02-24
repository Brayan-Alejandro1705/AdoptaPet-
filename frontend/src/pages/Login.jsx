import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const LOGIN_API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

  // ✅ CORREGIDO: redirigir a /home (no a /)
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/home', { replace: true });
    }
  }, []); // ✅ Sin 'navigate' en dependencias para evitar loops

  // Mostrar mensaje si viene de verificación exitosa
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setMessage('✅ Email verificado correctamente. Ahora puedes iniciar sesión.');
      setMessageType('success');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${LOGIN_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password
        })
      });

      const data = await response.json();
      console.log('📥 Respuesta del servidor:', data);

      if (response.ok && data.success) {
        if (data.token) localStorage.setItem('token', data.token);
        if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

        setMessage('✅ Login exitoso. Redirigiendo...');
        setMessageType('success');

        // ✅ CORREGIDO: redirigir a /home (no a /)
        setTimeout(() => navigate('/home', { replace: true }), 1500);

      } else if (data.requiresVerification) {
        setMessage('📧 Debes verificar tu email antes de entrar. Redirigiendo...');
        setMessageType('error');

        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(formData.email.trim())}`);
        }, 2000);

      } else {
        setMessage('❌ ' + (data.message || 'Email o contraseña incorrectos'));
        setMessageType('error');
        setIsLoading(false);
      }

    } catch (error) {
      console.error('❌ Error en login:', error);
      setMessage('❌ Error al conectar con el servidor.');
      setMessageType('error');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  return (
    <div className="flex items-center justify-center h-screen relative overflow-hidden">

      {/* Fondo con blur */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-sm"
        style={{ backgroundImage: "url('https://www.petdarling.com/wp-content/uploads/2021/04/animales-domesticos-1.jpg')" }}
      />

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />

      {/* Contenedor principal */}
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96 relative z-10">

        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
          Iniciar Sesión en Adoptapet
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label htmlFor="email" className="block text-gray-700">Correo</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-400 text-white py-2 rounded-lg hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Mensajes */}
        {message && (
          <p className={`text-center mt-4 text-sm ${
            messageType === 'success' ? 'text-green-600' : 'text-red-500'
          }`}>
            {message}
          </p>
        )}

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all duration-300 font-semibold mt-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        <p className="text-center mt-2 text-sm">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-blue-600 font-semibold hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;