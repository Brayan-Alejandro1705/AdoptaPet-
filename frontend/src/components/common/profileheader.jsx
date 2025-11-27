export default function ProfileHeader({ user, onEdit }) {
  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
      {/* Cover */}
      <div className="h-48 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700"></div>

      {/* Info */}
      <div className="relative px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20">

          <img
            src={user.photo}
            alt="foto"
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white shadow-lg object-cover"
          />

          <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{user.name}</h1>
            <p className="text-gray-600 mb-2">{user.email}</p>
            <p className="text-gray-700 italic">{user.bio}</p>
          </div>

          <button
            onClick={onEdit}
            className="mt-4 sm:mt-0 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-2 rounded-full font-semibold hover:from-cyan-600 hover:to-cyan-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            Editar Perfil
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8 text-center">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-3xl font-bold text-purple-600">{user.posts}</div>
            <div className="text-sm text-gray-600">Información</div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-3xl font-bold text-cyan-600">{user.favorites}</div>
            <div className="text-sm text-gray-600">Favoritos</div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="text-3xl font-bold text-pink-600">{user.adoptions}</div>
            <div className="text-sm text-gray-600">Publicaciones</div>
          </div>
        </div>
      </div>
    </div>
  );
}
