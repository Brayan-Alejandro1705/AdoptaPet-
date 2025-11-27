//este archivo es de la pagina adoptar

export default function RightSidebar() {
  return (
    <aside className="hidden md:block md:col-span-3 space-y-4">
      
      {/* Mascotas sugeridas */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span>⭐</span> Mascotas destacadas
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50 cursor-pointer transition">
            <img src="https://placedog.net/100" className="w-12 h-12 rounded-full object-cover shadow-md" alt="Luna" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Luna</p>
              <p className="text-xs text-gray-500">Pastor Alemán</p>
            </div>
            <button className="text-purple-500 hover:text-purple-600">👁️</button>
          </div>
          
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50 cursor-pointer transition">
            <img src="https://placekitten.com/100/100" className="w-12 h-12 rounded-full object-cover shadow-md" alt="Michi" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Michi</p>
              <p className="text-xs text-gray-500">Gato Persa</p>
            </div>
            <button className="text-purple-500 hover:text-purple-600">👁️</button>
          </div>
          
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50 cursor-pointer transition">
            <img src="https://placedog.net/101" className="w-12 h-12 rounded-full object-cover shadow-md" alt="Rocky" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Rocky</p>
              <p className="text-xs text-gray-500">Labrador</p>
            </div>
            <button className="text-purple-500 hover:text-purple-600">👁️</button>
          </div>
        </div>
        
        <button className="w-full mt-4 py-2 text-purple-600 hover:text-purple-700 font-medium text-sm">
          Ver más →
        </button>
      </div>

      {/* Enlaces útiles */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <h3 className="font-bold text-sm mb-3 text-gray-500 uppercase">Enlaces útiles</h3>
        <div className="space-y-2 text-sm">
          <a href="#" className="block text-gray-600 hover:text-purple-600 transition">Sobre nosotros</a>
          <a href="#" className="block text-gray-600 hover:text-purple-600 transition">Ayuda</a>
          <a href="#" className="block text-gray-600 hover:text-purple-600 transition">Términos</a>
          <a href="#" className="block text-gray-600 hover:text-purple-600 transition">Privacidad</a>
        </div>
        <p className="text-xs text-gray-400 mt-4">© 2025 AdoptaPet</p>
      </div>
    </aside>
  );
}