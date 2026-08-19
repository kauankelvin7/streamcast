import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
  className?: string;
}

/**
 * Premium Search Bar for Streamcast
 * Expands horizontally on click
 */
export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node) && query === '') {
        setIsExpanded(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
        setQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [query]);

  const handleToggle = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onSearch) onSearch(val);
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative flex items-center', className)}>
      <motion.div
        initial={false}
        animate={{
          width: isExpanded ? '280px' : '40px',
          backgroundColor: isExpanded ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0)',
          borderColor: isExpanded ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'h-10 flex items-center rounded-full border transition-colors duration-300 overflow-hidden backdrop-blur-md',
          isExpanded && 'px-3'
        )}
      >
        <button
          onClick={handleToggle}
          className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors shrink-0"
        >
          <Search size={20} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex-1 flex items-center"
            >
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Filmes, séries, elenco..."
                className="w-full bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted"
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="p-1 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
