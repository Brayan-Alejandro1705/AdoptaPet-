import React from "react";

const PublishTextarea = ({ value, setValue, disabled }) => {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => setValue(e.target.value)}
      disabled={disabled}
      placeholder="¿Qué quieres compartir hoy?"
      className="w-full min-h-[120px] md:min-h-[150px] p-3 md:p-4 border border-gray-200 rounded-xl 
      focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none text-sm md:text-base text-gray-700 
      disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  );
};

export default PublishTextarea;
