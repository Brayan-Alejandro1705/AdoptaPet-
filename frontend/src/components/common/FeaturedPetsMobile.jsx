//este archivo es de la pagina adoptar



export default function FeaturedPetsMobile() {
  return (
    <div className="md:hidden bg-white rounded-2xl shadow-lg p-4">
      <h3 className="font-bold text-base mb-3 flex items-center gap-2">
        <span>⭐</span> Mascotas destacadas
      </h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <div className="flex-shrink-0 w-32">
          <img src="https://placedog.net/200" className="w-full h-32 rounded-xl object-cover shadow-md mb-2" alt="Luna" />
          <p className="font-semibold text-sm truncate">Luna</p>
          <p className="text-xs text-gray-500">Pastor Alemán</p>
        </div>
        
        <div className="flex-shrink-0 w-32">
          <img src="https://placekitten.com/200/200" className="w-full h-32 rounded-xl object-cover shadow-md mb-2" alt="Michi" />
          <p className="font-semibold text-sm truncate">Michi</p>
          <p className="text-xs text-gray-500">Gato Persa</p>
        </div>
        
        <div className="flex-shrink-0 w-32">
          <img src="https://placedog.net/201" className="w-full h-32 rounded-xl object-cover shadow-md mb-2" alt="Rocky" />
          <p className="font-semibold text-sm truncate">Rocky</p>
          <p className="text-xs text-gray-500">Labrador</p>
        </div>
      </div>
    </div>
  );
}