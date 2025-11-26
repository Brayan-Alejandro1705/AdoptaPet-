import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Adoptar from "./pages/Adoptar";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/adoptar" element={<Adoptar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;