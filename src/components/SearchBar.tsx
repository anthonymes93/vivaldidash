import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      onSubmit={handleSearch}
      className="glass search-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '600px',
        maxWidth: '90%',
        padding: '8px 24px',
        marginBottom: '6vh',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}
    >
      <Search size={20} color="rgba(255, 255, 255, 0.5)" />
      <input
        type="text"
        placeholder="Search Google..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          flex: 1,
          padding: '12px 16px',
          fontSize: '18px',
          fontWeight: 300,
        }}
      />
    </motion.form>
  );
};

export default SearchBar;
