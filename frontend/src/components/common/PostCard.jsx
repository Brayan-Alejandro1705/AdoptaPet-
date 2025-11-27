//este archivo es de la pagina adoptar

import { useState } from 'react';

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);

  const toggleLike = () => {
    if (liked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setLiked(!liked);
  };

  return (
    <article className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
      <div className="p-4 md:p-5">
        <div className="flex gap-3 items-center mb-3 md:mb-4">
          <img src={post.userAvatar} className="w-11 h-11 md:w-12 md:h-12 rounded-full shadow-md" alt={post.userName} />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base md:text-lg truncate">{post.userName}</h3>
            <p className="text-xs md:text-sm text-gray-500">{post.time} • 📍 {post.location}</p>
          </div>
          <button className="text-gray-400 hover:text-gray-600 active:text-gray-600 text-2xl p-2">⋯</button>
        </div>
        <p className="mb-3 md:mb-4 text-sm md:text-base text-gray-700 leading-relaxed">{post.content}</p>
      </div>
      
      <img src={post.image} className="w-full aspect-square md:aspect-auto md:h-96 object-cover" alt="Post" />
      
      <div className="p-4 md:p-5">
        {/* Stats */}
        <div className="flex items-center justify-between text-xs md:text-sm text-gray-500 mb-3">
          <span>❤️ <span className="hidden md:inline">{likes} me gusta</span><span className="md:hidden">{likes}</span></span>
          <span>💬 <span className="hidden md:inline">{post.comments} comentarios</span><span className="md:hidden">{post.comments}</span></span>
        </div>
        
        {/* Action buttons - RESPONSIVE */}
        <div className="flex justify-around items-center pt-3 border-t border-gray-100">
          <button 
            onClick={toggleLike}
            className="flex md:flex-row flex-col items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-xl hover:bg-red-50 active:bg-red-50 text-gray-600 hover:text-red-500 active:text-red-500 font-medium transition-all group"
          >
            <span className={`text-2xl group-hover:scale-125 group-active:scale-125 transition-transform ${liked ? 'animate-pulse' : ''}`}>
              {liked ? '❤️' : '♡'}
            </span>
            <span className="text-xs md:text-base">Me gusta</span>
          </button>

          <button className="flex md:flex-row flex-col items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-xl hover:bg-blue-50 active:bg-blue-50 text-gray-600 hover:text-blue-500 active:text-blue-500 font-medium transition-all group">
            <span className="text-2xl group-hover:scale-125 group-active:scale-125 transition-transform">💬</span>
            <span className="text-xs md:text-base">Comentar</span>
          </button>

          <button className="flex md:flex-row flex-col items-center gap-1 md:gap-2 px-3 md:px-4 py-2 rounded-xl hover:bg-green-50 active:bg-green-50 text-gray-600 hover:text-green-500 active:text-green-500 font-medium transition-all group">
            <span className="text-2xl group-hover:scale-125 group-active:scale-125 transition-transform">🔄</span>
            <span className="text-xs md:text-base">Compartir</span>
          </button>
        </div>
      </div>
    </article>
  );
}