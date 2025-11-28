//este codigo es de la pagina notificaciones
import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
const NotificationCard = ({ notification, onMarkAsRead, onDelete }) => {
  const colorMap = {
    purple: 'border-purple-500',
    green: 'border-green-500',
    blue: 'border-blue-500',
    yellow: 'border-yellow-500',
    pink: 'border-pink-500',
    cyan: 'border-cyan-500',
    indigo: 'border-indigo-500'
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border-l-4 ${
        colorMap[notification.color] || 'border-gray-500'
      } ${notification.read ? 'opacity-85' : 'bg-gradient-to-r from-purple-50 to-white'}`}
      onClick={() => onMarkAsRead(notification.id)}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{notification.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-gray-800">{notification.title}</h3>
            {!notification.read && (
              <span className="flex-shrink-0 w-3 h-3 bg-purple-600 rounded-full"></span>
            )}
          </div>
          <p className="text-gray-600 mt-1">{notification.message}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {notification.time}
            </span>
            <button
              onClick={(e) => onDelete(notification.id, e)}
              className="text-sm text-red-500 hover:text-red-700 font-semibold transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;