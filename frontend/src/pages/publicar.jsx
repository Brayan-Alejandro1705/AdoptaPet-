import React, { useState } from "react";
import Header from "../components/common/Header";
import PublishTextarea from "../components/common/PublishTextarea";
import ImagePreview from "../components/common/ImagePreview";
import PetInfo from "../components/common/PetInfo";
import PublishOptions from "../components/common/PublishOptions";
import PublishFooter from "../components/common/PublishFooter";

const Publicar = () => {
  const [text, setText] = useState("");
  const [image,
     setImage] = useState(null);
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
    <div className="p-4 md:p-6">
      <Header/>
      <PublishTextarea value={text} setValue={setText} />
      <ImagePreview image={image} clearImage={clearImage} />
      <PetInfo petData={petData} setPetData={setPetData} />
      <PublishOptions handleImage={handleImage} />
      <PublishFooter publish={publish} />
    </div>
  );
};

export default Publicar;
