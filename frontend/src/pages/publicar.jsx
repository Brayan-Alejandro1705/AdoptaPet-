import React, { useState } from "react";
import Header from "../components/common/Header";
import Sidebar from "../components/common/Sidebar";
import BottomNav from "../components/layout/BottomNav";
import PublishTextarea from "../components/common/PublishTextarea";
import ImagePreview from "../components/common/ImagePreview";
import PetInfo from "../components/common/PetInfo";
import PublishOptions from "../components/common/PublishOptions";
import PublishFooter from "../components/common/PublishFooter";

const Publicar = () => {
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [petData, setPetData] = useState({
    nombre: "",
    tipo: "",
    raza: "",
    edad: "",
    adopcion: false,
  });

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) setImage(URL.createObjectURL(file));
  };

  const clearImage = () => setImage(null);

  const publish = () => {
    console.log("Publicando...");
    console.log({ text, image, petData });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-8">
      <Header />
      
      <div className="max-w-7xl mx-auto px-3 md:px-4 pt-4 md:pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          
          {/* SIDEBAR IZQUIERDO - 3 columnas */}
          <div className="hidden md:block md:col-span-3">
            <Sidebar />
          </div>

          {/* CONTENIDO PRINCIPAL - 9 columnas */}
          <main className="col-span-1 md:col-span-9">
            <div className="bg-white rounded-3xl shadow-lg p-4 md:p-6">
              <PublishTextarea value={text} setValue={setText} />
              <ImagePreview image={image} clearImage={clearImage} />
              <PetInfo petData={petData} setPetData={setPetData} />
              <PublishOptions handleImage={handleImage} />
              <PublishFooter publish={publish} />
            </div>
          </main>
          
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Publicar;