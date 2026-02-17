import React, { useState } from 'react';
import { X, Users, Globe, Lock, ChevronDown } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, post, userAvatar, userName }) {
  const [shareText, setShareText] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Aquí iría la llamada al backend para compartir el post
      const response = await fetch('http://localhost:5000/api/posts/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          originalPostId: post._id,
          shareText: shareText,
          privacy: privacy
        })
      });

      if (response.ok) {
        alert('✅ Publicación compartida exitosamente');
        onClose();
        setShareText('');
      } else {
        alert('❌ Error al compartir la publicación');
      }
    } catch (error) {
      console.error('Error al compartir:', error);
      alert('❌ Error al compartir la publicación');
    }
  };

  const privacyOptions = [
    { value: 'public', icon: Globe, label: 'Público', description: 'Cualquiera puede ver esto' },
    { value: 'friends', icon: Users, label: 'Amigos', description: 'Solo tus amigos' },
    { value: 'private', icon: Lock, label: 'Solo yo', description: 'Solo tú puedes ver esto' }
  ];

  const selectedPrivacy = privacyOptions.find(opt => opt.value === privacy);
  const PrivacyIcon = selectedPrivacy.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Compartir</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* Info de privacidad */}
          <p className="text-sm text-gray-600 mb-4">
            Los enlaces que compartes son exclusivos para ti y pueden usarse para mejorar las sugerencias y los anuncios que ves.{' '}
            <span className="text-blue-600 cursor-pointer hover:underline">Más información.</span>
          </p>

          {/* User info y privacidad */}
          <div className="flex items-center gap-3 mb-4">
            <img
              src={userAvatar}
              alt={userName}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{userName}</p>
              
              {/* Privacy selector */}
              <div className="relative">
                <button
                  onClick={() => setShowPrivacyMenu(!showPrivacyMenu)}
                  className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition text-sm"
                >
                  <PrivacyIcon className="w-4 h-4" />
                  <span className="font-medium">{selectedPrivacy.label}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Privacy dropdown */}
                {showPrivacyMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowPrivacyMenu(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border z-20 w-72">
                      {privacyOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              setPrivacy(option.value);
                              setShowPrivacyMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                          >
                            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
                              <Icon className="w-5 h-5 text-gray-700" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800 text-sm">{option.label}</p>
                              <p className="text-xs text-gray-500">{option.description}</p>
                            </div>
                            {privacy === option.value && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Text input */}
          <textarea
            value={shareText}
            onChange={(e) => setShareText(e.target.value)}
            placeholder="Di algo sobre esto..."
            className="w-full p-3 border-0 outline-none resize-none text-gray-800 placeholder-gray-400 text-lg"
            rows="3"
          />

          {/* Original post preview */}
          <div className="mt-4 border rounded-lg overflow-hidden bg-gray-50">
            {/* Post author */}
            <div className="p-3 flex items-center gap-2 bg-white border-b">
              <img
                src={post.author?.avatar || userAvatar}
                alt={post.author?.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-sm text-gray-800">{post.author?.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                  })}
                </p>
              </div>
            </div>

            {/* Post content */}
            <div className="p-3">
              {post.content && (
                <p className="text-gray-800 text-sm mb-2 line-clamp-3">{post.content}</p>
              )}

              {/* Post image */}
              {post.media?.images && post.media.images.length > 0 && (
                <img
                  src={`http://localhost:5000${post.media.images[0]}`}
                  alt="Post"
                  className="w-full rounded-lg max-h-60 object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={handleShare}
            disabled={!shareText.trim() && privacy === 'public'}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            Compartir ahora
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}