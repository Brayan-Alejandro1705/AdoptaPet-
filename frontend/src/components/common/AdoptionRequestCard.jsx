export default function AdoptionRequestCard({ name, pet, time }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-gray-100 transition-all duration-300">
      <img
        src={`https://ui-avatars.com/api/?name=${name}&size=80&background=random`}
        alt="usuario"
        className="w-16 h-16 rounded-full border-2 border-purple-300"
      />

      <div className="flex-1">
        <h3 className="text-lg font-bold text-gray-800">{name}</h3>
        <p className="text-gray-600 text-sm">
          Interesado en adoptar a <span className="font-semibold">{pet}</span>
        </p>
        <p className="text-gray-500 text-xs mt-1">{time}</p>
      </div>

      <div className="flex gap-2">
        <button className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-all duration-300">
          Aceptar
        </button>
        <button className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-all duration-300">
          Rechazar
        </button>
      </div>
    </div>
  );
}
