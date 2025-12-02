import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Adoptar from './pages/Adoptar';
import Login from './pages/Login';
import Perfil from './pages/perfil';
import Notificaciones from './pages/Notificaciones';
import Registro from './pages/Registro';
import Publicar from './pages/publicar';
import Chat from './pages/Chat';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/adoptar" element={<Adoptar />} />
        <Route path="/login" element={<Login />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/notificaciones" element={<Notificaciones />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/publicar" element={<Publicar />} />
        <Route path="/mensajes" element={<Chat />} />  {/* ← CAMBIAR AQUÍ */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;