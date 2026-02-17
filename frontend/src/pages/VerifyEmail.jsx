import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // ✅ CORREGIDO: Obtener email desde query param o localStorage como fallback
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Fallback: intentar obtener desde localStorage
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.email) {
          setEmail(user.email);
        }
      } catch (e) {
        console.error('No se pudo obtener el email del localStorage');
      }
    }
  }, [searchParams]);

  // Manejar cambio en inputs de código
  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    if (!/^[0-9]*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus al siguiente input
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
  };

  // Manejar backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  // Pegar código desde portapapeles
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^[0-9]*$/.test(pastedData)) return;

    const newCode = pastedData.split('');
    while (newCode.length < 6) newCode.push('');
    setCode(newCode);

    // Focus al último dígito
    if (pastedData.length === 6) {
      document.getElementById('code-5')?.focus();
    } else {
      document.getElementById(`code-${pastedData.length}`)?.focus();
    }
  };

  // Verificar código
  const handleVerify = async (e) => {
    e.preventDefault();
    const fullCode = code.join('');

    if (fullCode.length !== 6) {
      setError('Por favor ingresa el código completo');
      return;
    }

    if (!email) {
      setError('No se encontró el email. Vuelve a registrarte.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // ✅ CORREGIDO: Usar localhost en vez de 127.0.0.1
      const response = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          code: fullCode
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ ' + data.message);
        
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 2000);
      } else {
        setError('❌ ' + data.message);
        
        if (data.expired) {
          setTimeout(() => {
            setError('');
          }, 3000);
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Reenviar código
  const handleResend = async () => {
    if (!email) {
      setError('Email no proporcionado');
      return;
    }

    setResending(true);
    setError('');
    setMessage('');

    try {
      // ✅ CORREGIDO: Usar localhost en vez de 127.0.0.1
      const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('📧 Código reenviado. Revisa tu correo.');
        setCode(['', '', '', '', '', '']);
        document.getElementById('code-0')?.focus();
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al reenviar código');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card principal */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Logo e iconos */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Verifica tu email
            </h1>
            <p className="text-gray-600">
              Hemos enviado un código de 6 dígitos a
            </p>
            <p className="text-purple-600 font-semibold mt-1">
              {email || 'tu correo electrónico'}
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleVerify} className="space-y-6">
            {/* Inputs del código */}
            <div className="flex justify-center gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Mensajes */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {message}
              </div>
            )}

            {/* Botón verificar */}
            <button
              type="submit"
              disabled={loading || code.join('').length !== 6}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verificando...
                </span>
              ) : (
                'Verificar código'
              )}
            </button>
          </form>

          {/* Reenviar código */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-2">
              ¿No recibiste el código?
            </p>
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-purple-600 font-semibold hover:text-purple-700 disabled:opacity-50 text-sm"
            >
              {resending ? 'Reenviando...' : 'Reenviar código'}
            </button>
          </div>

          {/* Volver al login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Volver al login
            </button>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>⏰ El código expira en 15 minutos</p>
          <p className="mt-2">🔒 Revisa también tu carpeta de spam</p>
        </div>
      </div>
    </div>
  );
}