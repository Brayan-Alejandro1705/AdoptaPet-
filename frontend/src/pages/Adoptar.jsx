import { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import PetCard from '../components/common/PetCard';
import PetModal from '../components/common/PetModal';
import FilterSection from '../components/adoptar/FilterSection';
import { PawPrint } from 'lucide-react';

export default function Adoptar() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '', type: '', size: '', age: '', location: '',
    featured: false, vaccinated: false, sterilized: false
  });
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => { loadPets(); }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:5000/api/pets/adopcion');
      if (!response.ok) throw new Error('Error al cargar mascotas');
      const result = await response.json();

      let data;
      if (result.success && result.data) data = result.data;
      else if (Array.isArray(result)) data = result;
      else if (result.pets) data = result.pets;
      else throw new Error('Formato de respuesta inválido');
      if (!Array.isArray(data)) throw new Error('El servidor no devolvió un array de mascotas');

      const formattedPets = data.map(pet => {
        let photos = [];
        if (pet.photos?.length > 0) photos = pet.photos.map(p => `http://localhost:5000${p}`);
        else if (pet.mainPhoto) photos = [`http://localhost:5000${pet.mainPhoto}`];
        return {
          _id: pet._id, id: pet._id,
          name: pet.name || 'Sin nombre',
          species: pet.species || 'desconocido',
          type: pet.species ? (pet.species.charAt(0).toUpperCase() + pet.species.slice(1)) : 'Desconocido',
          breed: pet.breed || 'Mestizo',
          age: pet.age?.value || 0,
          ageFormatted: pet.age ? `${pet.age.value} ${pet.age.unit}` : 'Desconocida',
          size: pet.size || 'mediano',
          sizeFormatted: pet.size ? (pet.size.charAt(0).toUpperCase() + pet.size.slice(1)) : 'Mediano',
          gender: pet.gender || 'desconocido',
          genderFormatted: pet.gender ? (pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)) : 'Desconocido',
          location: pet.location || { city: 'No especificada' },
          description: pet.description || 'Sin descripción',
          photos, mainPhoto: pet.mainPhoto ? `http://localhost:5000${pet.mainPhoto}` : null,
          vaccinated: pet.healthInfo?.vaccinated || false,
          sterilized: pet.healthInfo?.sterilized || false,
          featured: pet.featured || false,
          status: pet.status || 'available',
          adoptionFee: pet.adoptionFee || '$0',
          healthInfo: pet.healthInfo || {},
          contact: {
            organization: pet.shelter?.name || pet.owner?.nombre || pet.owner?.name || 'Contacto no disponible',
            phone: pet.contactInfo?.phone || 'No disponible'
          },
          owner: pet.owner, createdAt: pet.createdAt
        };
      });
      setPets(formattedPets);
    } catch (err) {
      setError(err.message || 'Error al cargar las mascotas');
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterPets = () => pets.filter(pet => {
    if (filters.search && !pet.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.type && filters.type !== 'all' && pet.species !== filters.type.toLowerCase()) return false;
    if (filters.size && filters.size !== 'all' && pet.size !== filters.size.toLowerCase()) return false;
    if (filters.age && filters.age !== 'all') {
      const ageNum = parseInt(pet.age);
      if (filters.age === 'puppy' && ageNum > 1) return false;
      if (filters.age === 'young' && (ageNum < 1 || ageNum > 3)) return false;
      if (filters.age === 'adult' && (ageNum < 3 || ageNum > 7)) return false;
      if (filters.age === 'senior' && ageNum < 7) return false;
    }
    if (filters.location && pet.location?.city !== filters.location) return false;
    if (filters.featured && !pet.featured) return false;
    if (filters.vaccinated && !pet.vaccinated) return false;
    if (filters.sterilized && !pet.sterilized) return false;
    return true;
  });

  const filteredPets = filterPets();

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  const handleClearFilters = () => setFilters({ search: '', type: 'all', size: 'all', age: 'all', location: '', featured: false, vaccinated: false, sterilized: false });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-purple-500 mx-auto mb-3"></div>
          <p className="text-gray-600">Cargando mascotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <Sidebar />

      <div className="md:ml-64 pb-20 md:pb-8">
        <div className="max-w-5xl mx-auto px-3 md:px-6 pt-4 md:pt-6">

          {/* Título */}
          <div className="mb-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2.5 rounded-2xl shadow-lg">
                <PawPrint className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Encuentra tu Compañero</h1>
            </div>
            <p className="text-gray-500 text-sm ml-14">
              {filteredPets.length} mascota{filteredPets.length !== 1 ? 's' : ''} esperando un hogar
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              <p className="font-semibold">Error al cargar mascotas</p>
              <p>{error}</p>
              <button onClick={loadPets} className="mt-1 underline hover:no-underline text-xs">
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Filtros */}
          <FilterSection
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

          {/* Grid mascotas */}
          {filteredPets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPets.map(pet => (
                <PetCard key={pet._id} pet={pet} onClick={() => setSelectedPet(pet)} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-white rounded-3xl p-10 max-w-sm mx-auto shadow-sm border border-gray-100">
                {pets.length === 0 ? (
                  <>
                    <div className="text-5xl mb-3">🐾</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Aún no hay mascotas</h3>
                    <p className="text-gray-500 text-sm mb-5">Sé el primero en publicar una mascota en adopción</p>
                    <a href="/crear-adopcion"
                      className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all text-sm">
                      Publicar mascota
                    </a>
                  </>
                ) : (
                  <>
                    <div className="text-5xl mb-3">🔍</div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">Sin resultados</h3>
                    <p className="text-gray-500 text-sm mb-5">No encontramos mascotas que coincidan con tus filtros</p>
                    <button onClick={handleClearFilters}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all text-sm">
                      Limpiar filtros
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
      {selectedPet && <PetModal pet={selectedPet} onClose={() => setSelectedPet(null)} />}
    </div>
  );
}