import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api`;

const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('Backend conectado:', data);
    return true;
  } catch (error) {
    console.error('Backend NO conectado:', error);
    return false;
  }
};

export default function Registro() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    testConnection().then(connected => {
      console.log(connected ? 'Conectado' : 'Desconectado');
    });
  }, []);

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    if (name === 'nombre') {
      if (value && !/^[a-zA-Z\s]+$/.test(value)) {
        newErrors.nombre = 'Solo letras y espacios';
      } else if (value && value.trim().length < 2) {
        newErrors.nombre = 'Minimo 2 caracteres';
      } else {
        delete newErrors.nombre;
      }
    }

    if (name === 'telefono') {
      const telefonoLimpio = value.replace(/\D/g, '');
      if (value && telefonoLimpio.length !== 10) {
        newErrors.telefono = 'Debe tener 10 digitos';
      } else {
        delete newErrors.telefono;
      }
    }

    if (name === 'password') {
      if (value && value.length < 6) {
        newErrors.password = 'Minimo 6 caracteres';
      } else {
        delete newErrors.password;
      }
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Las contrasenas no coinciden';
      } else if (formData.confirmPassword) {
        delete newErrors.confirmPassword;
      }
    }

    if (name === 'confirmPassword') {
      if (value && value !== formData.password) {
        newErrors.confirmPassword = 'Las contrasenas no coinciden';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'telefono') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, [name]: numericValue });
      validateField(name, numericValue);
    } else {
      setFormData({ ...formData, [name]: value });
      validateField(name, value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    const { nombre, email, password, confirmPassword, telefono } = formData;

    if (!nombre || !email || !password || !confirmPassword) {
      setMessage({ text: 'Por favor completa todos los campos obligatorios', type: 'error' });
      return;
    }

    if (!/^[a-zA-Z\s]+$/.test(nombre) || nombre.trim().length < 2) {
      setMessage({ text: 'Nombre invalido', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setMessage({ text: 'La contrasena debe tener al menos 6 caracteres', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ text: 'Las contrasenas no coinciden', type: 'error' });
      return;
    }

    if (telefono && telefono.length !== 10) {
      setMessage({ text: 'El telefono debe tener 10 digitos', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim(),
          password,
          passwordConfirm: confirmPassword,
          telefono: telefono || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({
          text: `✅ Registro exitoso. Redirigiendo para verificar tu correo...`,
          type: 'success'
        });

        setTimeout(() => {
          navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
        }, 1500);

      } else {
        setMessage({ text: data.message || 'Error en el Registro', type: 'error' });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ text: 'Error al conectar con el servidor', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (e) => {
    e.preventDefault();

    console.log('🔍 Iniciando Google Login...');

    try {
      const response = await fetch(`${API_BASE}/health`);
      const data = await response.json();

      console.log('✅ Backend activo:', data);

      if (data.services?.googleAuth === 'disabled') {
        setMessage({
          text: 'Google OAuth no está disponible. Verifica la configuración del servidor.',
          type: 'error'
        });
        return;
      }

      console.log('🔄 Redirigiendo a Google OAuth...');
      window.location.href = `${API_BASE}/api/auth/google`;

    } catch (err) {
      console.error('❌ Error al verificar backend:', err);
      setMessage({
        text: 'No se puede conectar con el servidor. Verifica que esté corriendo en el puerto 5000.',
        type: 'error'
      });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: "url('https://www.petdarling.com/wp-content/uploads/2021/04/animales-domesticos-1.jpg')" }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full">

        <div className="text-6xl mb-3 text-center">🐾</div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Unete a AdoptaPet</h1>
        <p className="text-gray-600 text-sm mb-8 text-center">Dale un hogar a tu nuevo mejor amigo</p>

        {message.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm font-medium text-center ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="text-left">
            <label htmlFor="nombre" className="block text-gray-700 font-medium mb-2 text-sm">
              Nombre completo
            </label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none transition-colors ${
                errors.nombre ? 'border-red-500' : 'border-gray-200 focus:border-purple-500'
              }`}
              required
            />
            {errors.nombre && (
              <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
            )}
          </div>

          <div className="text-left">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2 text-sm">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors"
              required
            />
          </div>

          <div className="text-left">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2 text-sm">
              Contrasena
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimo 6 caracteres"
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg text-sm focus:outline-none transition-colors ${
                  errors.password ? 'border-red-500' : 'border-gray-200 focus:border-purple-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div className="text-left">
            <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2 text-sm">
              Confirmar Contrasena
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repite tu contrasena"
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg text-sm focus:outline-none transition-colors ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-200 focus:border-purple-500'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="text-left">
            <label htmlFor="telefono" className="block text-gray-700 font-medium mb-2 text-sm">
              Telefono <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="10 digitos"
              maxLength="10"
              className={`w-full px-4 py-3 border-2 rounded-lg text-sm focus:outline-none transition-colors ${
                errors.telefono ? 'border-red-500' : 'border-gray-200 focus:border-purple-500'
              }`}
            />
            {errors.telefono && (
              <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Solo numeros, 10 digitos</p>
          </div>

          <button
            type="submit"
            disabled={loading || Object.keys(errors).length > 0}
            className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-purple-700 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="mt-5 text-gray-600 text-sm text-center">
          Ya tienes cuenta? <Link to="/login" className="text-purple-600 font-semibold hover:underline">Inicia sesion</Link>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="flex items-center justify-center w-full py-3.5 px-5 bg-white border-2 border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 hover:border-blue-500 hover:shadow-lg transition-all mb-5 mt-5"
        >
          <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Registrarse con Google
        </button>

        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
          <div className="flex items-center text-gray-600 text-xs">
            <Check className="text-purple-600 w-5 h-5 mr-2.5" />
            Acceso a miles de mascotas en adopcion
          </div>
          <div className="flex items-center text-gray-600 text-xs">
            <Check className="text-purple-600 w-5 h-5 mr-2.5" />
            Contacta directamente con refugios
          </div>
          <div className="flex items-center text-gray-600 text-xs">
            <Check className="text-purple-600 w-5 h-5 mr-2.5" />
            Guarda tus favoritos y recibe notificaciones
          </div>
        </div>
      </div>
    </div>
  );
}