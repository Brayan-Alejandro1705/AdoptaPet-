//este archivo es de la pagina adoptar
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between">

        {/* Logo + Nombre */}
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer hover:scale-105 transition-transform">
          <span className="text-3xl md:text-4xl drop-shadow-lg">🐾</span>
          <h1 className="text-xl md:text-2xl font-bold tracking-wide text-white drop-shadow-md">AdoptaPet</h1>
        </div>

        {/* Search - DESKTOP ONLY */}
        <div className="hidden md:flex flex-1 max-w-xl mx-6 relative">
          <input 
            type="text"
            placeholder="Buscar mascotas, refugios..."
            className="w-full px-6 py-3 pr-12 border-2 border-white/30 bg-white/90 backdrop-blur rounded-full focus:ring-4 focus:ring-white/50 focus:border-white outline-none shadow-lg transition-all"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
        </div>

        {/* Icons */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/mensajes" className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#8b5cf6" strokeWidth="2.5" viewBox="0 0 24 24" className="w-5 h-5 md:w-6 md:h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6A8.38 8.38 0 0 1 11.5 3h1A8.5 8.5 0 0 1 21 11.5z"/>
            </svg>
          </Link>

          <Link to="/notificaciones" className="relative w-10 h-10 md:w-11 md:h-11 rounded-full bg-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5 md:w-6 md:h-6 stroke-[#f59e0b] stroke-[2.5]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 18.75a1.5 1.5 0 1 1-3 0M4.5 9a7.5 7.5 0 1 1 15 0c0 3.15.75 4.5 1.5 5.25H3c.75-.75 1.5-2.1 1.5-5.25Z"/>
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse shadow-md">3</span>
          </Link>

          <Link to="/perfil" className="w-10 h-10 md:w-11 md:h-11 rounded-full transition-transform hover:scale-110 active:scale-95 shadow-lg cursor-pointer block">
            <img src="https://via.placeholder.com/44" alt="Perfil" className="w-full h-full rounded-full border-2 md:border-3 border-white object-cover" />
          </Link>
          
          <Link to="/perfil" className="hidden md:block ml-2 text-white font-semibold hover:underline">
            Nombre de Usuario
          </Link>
        </div>
      </div>

      {/* Search - MOBILE ONLY */}
      <div className="md:hidden px-3 pb-3">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar mascotas..." 
            className="w-full px-4 py-2 pr-10 border-2 border-white/30 bg-white/90 backdrop-blur rounded-full focus:ring-2 focus:ring-white/50 outline-none shadow-lg text-sm"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
      </div>
    </header>
  );
}