import { useState } from "react";
import axios from "axios";

export default function RecuperarPassword() {

  const [email, setEmail] = useState("");

  const enviarCorreo = async () => {
    try {
      await axios.post("http://localhost:3000/api/auth/recuperar-password", {
        email
      });

      alert("Revisa tu correo para recuperar la contraseña");
    } catch (error) {
      alert("Error al enviar el correo");
    }
  };

  return (
    <div>
      <h2>Recuperar contraseña</h2>

      <input
        type="email"
        placeholder="Ingresa tu correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={enviarCorreo}>
        Enviar link de recuperación
      </button>
    </div>
  );
}