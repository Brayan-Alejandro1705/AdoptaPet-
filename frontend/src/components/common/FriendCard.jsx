//esta pagina es de amigos
import { MessageCircle, User } from 'lucide-react';

export default function FriendCard({ friend, onViewProfile, onSendMessage }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-5">
      <div className="flex items-center gap-4 mb-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-800 flex items-center justify-center text-white text-2xl font-bold">
            {friend.name.charAt(0)}
          </div>
          {friend.online && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-800">{friend.name}</h3>
          <p className="text-sm text-gray-500">
            {friend.mutualFriends} {friend.mutualFriends === 1 ? 'amigo' : 'amigos'} en común
          </p>
          <p className="text-xs text-gray-400">{friend.online ? 'En línea' : `Últ. vez ${friend.lastSeen}`}</p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewProfile(friend)}
          className="flex-1 flex items-center justify-center gap-2 bg  bg-green-500 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-semibold transition-all"
        >
          <User size={18} />
          <span className="hidden sm:inline">Ver Perfil</span>
        </button>
        <button
          onClick={() => onSendMessage(friend)}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-800  hover:shadow-lg text-white px-4 py-2 rounded-xl font-semibold transition-all"
        >
          <MessageCircle size={18} />
          <span className="hidden sm:inline">Mensaje</span>
        </button>
      </div>
    </div>
  );
}