import { Link } from 'react-router-dom';
import { Heart, PawPrint, Search, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      
      {/* Header Temporal */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-xl">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800">AdoptaPet</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              Inicio
            </Link>
            <Link to="/adoptar" className="text-gray-700 hover:text-purple-600 font-medium transition-colors">
              Adoptar
            </Link>
          </nav>

          <Link 
            to="/adoptar" 
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Ver Mascotas
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6">
            Encuentra tu
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"> Compañero </span>
            Perfecto
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Miles de mascotas están esperando un hogar. Dale amor a quien más lo necesita.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/adoptar" 
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:scale-105"
            >
              🐾 Adoptar Ahora
            </Link>
            <button className="bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold border-2 border-gray-200 hover:border-purple-300 transition-all">
              📖 Cómo Funciona
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white rounded-2xl p-6 shadow-md text-center">
            <div className="text-4xl mb-2">🐕</div>
            <div className="text-3xl font-bold text-purple-600 mb-1">500+</div>
            <div className="text-gray-600">Mascotas Disponibles</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md text-center">
            <div className="text-4xl mb-2">❤️</div>
            <div className="text-3xl font-bold text-pink-600 mb-1">2,000+</div>
            <div className="text-gray-600">Adopciones Exitosas</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-md text-center">
            <div className="text-4xl mb-2">🏠</div>
            <div className="text-3xl font-bold text-blue-600 mb-1">150+</div>
            <div className="text-gray-600">Organizaciones Aliadas</div>
          </div>
        </div>

        {/* Featured Pets Preview */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              🌟 Mascotas Destacadas
            </h2>
            <Link 
              to="/adoptar" 
              className="text-purple-600 font-semibold hover:text-purple-700 transition-colors"
            >
              Ver todas →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pet Card 1 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-white rounded-xl h-48 mb-4 flex items-center justify-center text-6xl">
                🐕
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Luna</h3>
              <p className="text-gray-600 mb-4">Golden Retriever • 2 años</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                <span>Bogotá</span>
              </div>
              <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold group-hover:shadow-md transition-all">
                Ver Detalles
              </button>
            </div>

            {/* Pet Card 2 */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-white rounded-xl h-48 mb-4 flex items-center justify-center text-6xl">
                🐱
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Michi</h3>
              <p className="text-gray-600 mb-4">Mestizo • 1 año</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                <span>Medellín</span>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-2 rounded-lg font-semibold group-hover:shadow-md transition-all">
                Ver Detalles
              </button>
            </div>

            {/* Pet Card 3 */}
            <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer group">
              <div className="bg-white rounded-xl h-48 mb-4 flex items-center justify-center text-6xl">
                🐶
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Max</h3>
              <p className="text-gray-600 mb-4">Labrador • 3 años</p>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                <span>Cali</span>
              </div>
              <button className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white py-2 rounded-lg font-semibold group-hover:shadow-md transition-all">
                Ver Detalles
              </button>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para cambiar una vida?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Cada adopción es una segunda oportunidad. Encuentra tu compañero hoy.
          </p>
          <Link 
            to="/adoptar" 
            className="inline-block bg-white text-purple-600 px-10 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Explorar Mascotas
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white mt-20 py-8 border-t">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>© 2024 AdoptaPet. Todos los derechos reservados.</p>
        </div>
      </footer>

    </div>
  );
}