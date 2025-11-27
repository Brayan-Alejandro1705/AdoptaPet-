import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Adoptar from "./pages/Adoptar";
import Perfil from "./pages/perfil";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/adoptar" element={<Adoptar />} />
        <Route path="/perfil" element={<Perfil />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;