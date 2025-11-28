import React from "react";

const PublishFooter = ({ publish }) => {
  return (
    <div className="sticky bottom-0 bg-gray-50 px-4 md:px-6 py-3 rounded-b-3xl">
      <button
        onClick={publish}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 rounded-xl 
        hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
      >
        Publicar
      </button>
    </div>
  );
};

export default PublishFooter;
