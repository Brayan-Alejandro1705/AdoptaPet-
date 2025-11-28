import React from "react";

const ImagePreview = ({ image, clearImage }) => {
  if (!image) return null;

  return (
    <div className="mt-3 md:mt-4 relative">
      <img src={image} className="w-full rounded-xl max-h-64 md:max-h-96 object-cover" />
      
      <button
        onClick={clearImage}
        className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white w-8 h-8 rounded-full 
        hover:bg-opacity-90 transition"
      >
        ×
      </button>
    </div>
  );
};

export default ImagePreview;
