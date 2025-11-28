import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Adoptar from './pages/Adoptar';
import Login from './pages/Login';
import Perfil from './pages/Perfil';
import Notificaciones from './pages/Notificaciones';
import Publicar from './pages/publicar';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/adoptar" element={<Adoptar />} />
        <Route path="/login" element={<Login />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/notificaciones" element={<Notificaciones/>} />
        <Route path="/publicar" element={<Publicar/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;