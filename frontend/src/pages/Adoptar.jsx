import { useState } from 'react';
import PetCard from '../components/common/PetCard';
import PetModal from '../components/common/PetModal';
import FilterSection from '../components/adoptar/FilterSection';
import { PawPrint } from 'lucide-react';

// Datos dummy de mascotas
const DUMMY_PETS = [
  {
    id: 1,
    name: "Luna",
    type: "Perro",
    breed: "Golden Retriever",
    age: "2 años",
    size: "Grande",
    gender: "Hembra",
    location: "Bogotá",
    description: "Luna es una perrita muy cariñosa y juguetona. Le encanta estar con niños y otros perros. Es perfecta para una familia activa que disfrute de largas caminatas. Está completamente entrenada y sabe varios comandos básicos.",
    images: [
      "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=800",
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800"
    ],
    vaccinated: true,
    sterilized: true,
    featured: true,
    adoption_fee: "$0",
    contact: {
      organization: "Fundación Patitas Felices",
      phone: "+57 300 123 4567"
    }
  },
  {
    id: 2,
    name: "Max",
    type: "Perro",
    breed: "Labrador",
    age: "3 años",
    size: "Grande",
    gender: "Macho",
    location: "Medellín",
    description: "Max es un perro muy tranquilo y obediente. Es ideal para familias con espacio amplio. Le encanta nadar y jugar con pelotas. Es muy protector pero amigable con todos.",
    images: [
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800"
    ],
    vaccinated: true,
    sterilized: false,
    featured: false,
    adoption_fee: "$0",
    contact: {
      organization: "Rescate Animal Medellín",
      phone: "+57 301 234 5678"
    }
  },
  {
    id: 3,
    name: "Michi",
    type: "Gato",
    breed: "Mestizo",
    age: "1 año",
    size: "Pequeño",
    gender: "Macho",
    location: "Bogotá",
    description: "Michi es un gatito muy juguetón y cariñoso. Ama los mimos y dormir en lugares cálidos. Es independiente pero también le gusta la compañía. Perfecto para apartamento.",
    images: [
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800"
    ],
    vaccinated: true,
    sterilized: true,
    featured: true,
    adoption_fee: "$0",
    contact: {
      organization: "Gatos Sin Hogar",
      phone: "+57 302 345 6789"
    }
  },
  {
    id: 4,
    name: "Bella",
    type: "Perro",
    breed: "Poodle",
    age: "4 años",
    size: "Mediano",
    gender: "Hembra",
    location: "Cali",
    description: "Bella es una perrita muy elegante y educada. Es perfecta para personas mayores o familias tranquilas. No necesita mucho ejercicio y es muy compañera.",
    images: [
      "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?w=800"
    ],
    vaccinated: true,
    sterilized: true,
    featured: false,
    adoption_fee: "$50.000",
    contact: {
      organization: "Adopta Cali",
      phone: "+57 303 456 7890"
    }
  },
  {
    id: 5,
    name: "Rocky",
    type: "Perro",
    breed: "Bulldog",
    age: "5 años",
    size: "Mediano",
    gender: "Macho",
    location: "Barranquilla",
    description: "Rocky es un perro muy tranquilo y amoroso. Le encanta pasar tiempo con su familia y dormir siestas. Es excelente con niños y muy tolerante.",
    images: [
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800"
    ],
    vaccinated: false,
    sterilized: false,
    featured: false,
    adoption_fee: "$0",
    contact: {
      organization: "Rescate Caribe",
      phone: "+57 304 567 8901"
    }
  },
  {
    id: 6,
    name: "Princesa",
    type: "Gato",
    breed: "Persa",
    age: "2 años",
    size: "Pequeño",
    gender: "Hembra",
    location: "Bogotá",
    description: "Princesa es una gata elegante y tranquila. Le gusta estar en lugares altos observando todo. Es muy limpia y prefiere ambientes tranquilos.",
    images: [
      "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800"
    ],
    vaccinated: true,
    sterilized: true,
    featured: true,
    adoption_fee: "$100.000",
    contact: {
      organization: "Felinos Bogotá",
      phone: "+57 305 678 9012"
    }
  }
];

export default function Adoptar() {
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    size: '',
    age: '',
    location: '',
    featured: false,
    vaccinated: false,
    sterilized: false
  });

  const [selectedPet, setSelectedPet] = useState(null);

  // Función para filtrar mascotas
  const filterPets = () => {
    return DUMMY_PETS.filter(pet => {
      // Filtro de búsqueda por nombre
      if (filters.search && !pet.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Filtro por tipo
      if (filters.type && pet.type !== filters.type) {
        return false;
      }

      // Filtro por tamaño
      if (filters.size && pet.size !== filters.size) {
        return false;
      }

      // Filtro por edad (simplificado)
      if (filters.age) {
        const petAge = parseInt(pet.age);
        if (filters.age === 'Cachorro' && petAge > 1) return false;
        if (filters.age === 'Joven' && (petAge < 1 || petAge > 3)) return false;
        if (filters.age === 'Adulto' && (petAge < 3 || petAge > 7)) return false;
        if (filters.age === 'Senior' && petAge < 7) return false;
      }

      // Filtro por ubicación
      if (filters.location && pet.location !== filters.location) {
        return false;
      }

      // Filtros de checkboxes
      if (filters.featured && !pet.featured) return false;
      if (filters.vaccinated && !pet.vaccinated) return false;
      if (filters.sterilized && !pet.sterilized) return false;

      return true;
    });
  };

  const filteredPets = filterPets();

  const handleClearFilters = () => {
    setFilters({
      search: '',
      type: '',
      size: '',
      age: '',
      location: '',
      featured: false,
      vaccinated: false,
      sterilized: false
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-3 rounded-2xl">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              Encuentra tu Compañero
            </h1>
          </div>
          <p className="text-gray-600 ml-16">
            {filteredPets.length} mascota{filteredPets.length !== 1 ? 's' : ''} esperando un hogar
          </p>
        </div>

        {/* Filtros */}
        <FilterSection 
          filters={filters}
          onFilterChange={setFilters}
          onClearFilters={handleClearFilters}
        />

        {/* Grid de mascotas */}
        {filteredPets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map(pet => (
              <PetCard 
                key={pet.id}
                pet={pet}
                onViewDetails={() => setSelectedPet(pet)}
              />
            ))}
          </div>
        ) : (
          // Estado vacío
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl p-12 max-w-md mx-auto shadow-md">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                No hay mascotas
              </h3>
              <p className="text-gray-600 mb-6">
                No encontramos mascotas que coincidan con tus filtros
              </p>
              <button 
                onClick={handleClearFilters}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedPet && (
        <PetModal 
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
        />
      )}
    </div>
  );
}