import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Adoptar from "./pages/Adoptar";
import Registro from "./pages/Registro";  // ✅ Agregar esta línea

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/adoptar" element={<Adoptar />} />
        <Route path="/registro" element={<Registro />} />  {/* ✅ Agregar esta línea */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;