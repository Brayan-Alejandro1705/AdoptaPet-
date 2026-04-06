import React from 'react';
import { AlertCircle, Trash2, HelpCircle, X } from 'lucide-react';

/**
 * Enhanced ConfirmModal for AdoptaPet
 * Features: Glassmorphism, animated transitions, context-aware icons.
 */
const ConfirmModal = ({ 
  isOpen, 
  title = "Confirmar acción", 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Aceptar", 
  cancelText = "Cancelar",
  type = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <Trash2 className="w-8 h-8 text-red-500" />;
      case 'warning': return <AlertCircle className="w-8 h-8 text-amber-500" />;
      default: return <HelpCircle className="w-8 h-8 text-blue-500" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'danger': return "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-red-200";
      case 'warning': return "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-200";
      default: return "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-blue-200";
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />
      
      {/* Modal Card */}
      <div className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
        
        {/* Decorative Top Bar */}
        <div className={`h-2 w-full ${type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />

        <div className="p-8">
          {/* Close Icon (Top Right) */}
          <button 
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>

          {/* Icon Section */}
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-2xl ${type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-amber-50' : 'bg-blue-50'}`}>
              {getIcon()}
            </div>
          </div>

          {/* Text Section */}
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600 leading-relaxed text-sm lg:text-base">
              {message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancel}
              className="flex-1 order-2 sm:order-1 px-6 py-3.5 rounded-2xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 order-1 sm:order-2 px-6 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${getButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;