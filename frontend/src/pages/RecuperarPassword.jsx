import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

export default function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const enviarCorreo = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await axios.post(`${API_BASE}/api/auth/recuperar-password`, { email });
      setSent(true);
    } catch (err) {
      setError("❌ Error al enviar el correo. Verifica que el correo esté registrado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen relative overflow-hidden">

      {/* Fondo con blur */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-sm"
        style={{ backgroundImage: "url('https://us.123rf.com/450wm/isselee/isselee2210/isselee221000042/192975949-gran-grupo-de-gatos-y-perros-mirando-a-la-c%C3%A1mara-sobre-fondo-azul.jpg?ver=6')" }}
      />

      {/* Overlay oscuro */}
      <div className="absolute inset-0 bg-black bg-opacity-40" />

      {/* Card */}
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96 relative z-10">

        <Link
          to="/login"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio de sesión
        </Link>

        {!sent ? (
          <>
            <div className="flex flex-col items-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full mb-3">
                <Mail className="w-6 h-6 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold text-center text-blue-600">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-center text-gray-500 text-sm mt-2">
                Ingresa tu correo y te enviaremos un enlace para restablecerla.
              </p>
            </div>

            <form onSubmit={enviarCorreo} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-gray-700">Correo</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-400 text-white py-2 rounded-lg hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">¡Correo enviado!</h2>
            <p className="text-gray-500 text-sm">
              Si <span className="font-semibold text-gray-700">{email}</span> está
              registrado, recibirás un enlace en los próximos minutos.
            </p>
            <p className="text-gray-400 text-xs">Revisa también tu carpeta de spam.</p>
            <Link
              to="/login"
              className="mt-2 w-full text-center bg-blue-400 text-white py-2 rounded-lg hover:bg-blue-500 transition"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}