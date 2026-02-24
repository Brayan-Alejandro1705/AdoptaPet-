import { Link, useLocation } from 'react-router-dom';

export default function BottomNav({ onOpenModal }) {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50">
      <div className="flex justify-around items-center py-2">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 px-4 py-2 active:scale-95 transition ${
            location.pathname === '/' ? 'text-purple-600' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl">🏠</span>
          <span className="text-xs font-medium">Inicio</span>
        </Link>

        <Link
          to="/adoptar"
          className={`flex flex-col items-center gap-1 px-4 py-2 active:scale-95 transition ${
            location.pathname === '/adoptar' ? 'text-purple-600' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl">🐕</span>
          <span className="text-xs font-medium">Adoptar</span>
        </Link>

        <button
          onClick={onOpenModal}
          className="flex flex-col items-center gap-1 px-4 py-2 text-gray-500 active:text-purple-600 active:scale-95 transition"
        >
          <span className="text-2xl">➕</span>
          <span className="text-xs font-medium">Publicar</span>
        </button>

        <Link
          to="/amigos"
          className={`flex flex-col items-center gap-1 px-4 py-2 active:scale-95 transition ${
            location.pathname === '/amigos' ? 'text-purple-600' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl">👥</span>
          <span className="text-xs font-medium">Amigos</span>
        </Link>

        <Link
          to="/ajustes"
          className={`flex flex-col items-center gap-1 px-4 py-2 active:scale-95 transition ${
            location.pathname === '/ajustes' ? 'text-purple-600' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl">⚙️</span>
          <span className="text-xs font-medium">Ajustes</span>
        </Link>
      </div>
    </nav>
  );
}