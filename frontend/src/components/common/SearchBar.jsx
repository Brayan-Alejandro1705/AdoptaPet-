import { Search } from 'lucide-react';

export default function SearchBar({ searchTerm, onSearchChange, placeholder = "Buscar..." }) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
      <input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-purple-500 transition-all"
      />
    </div>
  );
}