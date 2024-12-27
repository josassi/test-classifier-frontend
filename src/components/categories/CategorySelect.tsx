import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';
import { Category } from '../../types/category';

interface CategorySelectProps {
  categories: Category[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  skipId?: string;
}

export function CategorySelect({ categories, value, onChange, disabled, skipId }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper function to get all descendant IDs of a category
  const getDescendantIds = (category: Category): string[] => {
    const descendants: string[] = [category.id];
    category.children.forEach(child => {
      descendants.push(...getDescendantIds(child));
    });
    return descendants;
  };

  // Helper function to find a category by ID
  const findCategoryById = (id: string, cats: Category[]): Category | null => {
    for (const cat of cats) {
      if (cat.id === id) return cat;
      if (cat.children.length > 0) {
        const found = findCategoryById(id, cat.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Get all categories except the skipped one and its descendants
  const getAvailableCategories = (cats: Category[], level = 0): Array<{ id: string; name: string; level: number }> => {
    const result: Array<{ id: string; name: string; level: number }> = [];
    
    cats.forEach(cat => {
      // Skip the category and its descendants if it's the one being edited
      if (skipId && getDescendantIds(findCategoryById(skipId, categories) || { id: skipId, children: [] }).includes(cat.id)) {
        return;
      }
      result.push({ id: cat.id, name: cat.name, level });
      if (cat.children.length > 0) {
        result.push(...getAvailableCategories(cat.children, level + 1));
      }
    });
    
    return result;
  };

  const filteredCategories = getAvailableCategories(categories)
    .filter(cat => cat.name.toLowerCase().includes(search.toLowerCase()));

  const selectedCategory = value ? { id: value, name: findCategoryById(value, categories)?.name || '' } : null;

  const toggleOpen = () => !disabled && setIsOpen(!isOpen);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <button
          type="button"
          onClick={toggleOpen}
          disabled={disabled}
          className={`flex items-center gap-2 w-full px-3 py-2.5 bg-white/50 border border-blue-100 rounded-lg text-blue-900 placeholder-blue-400 cursor-pointer ${
            isOpen ? 'ring-2 ring-blue-400' : ''
          }`}
        >
          {selectedCategory ? (
            <span className="truncate">{selectedCategory.name}</span>
          ) : (
            <span className="text-blue-400">Select parent category</span>
          )}
          <ChevronDown
            size={16}
            className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white/90 backdrop-blur-sm border border-blue-100 rounded-lg shadow-lg">
            <div className="p-2">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-400"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-9 pr-3 py-2 bg-white/50 border border-blue-100 rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto p-1">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className="flex items-center w-full px-3 py-2 text-blue-900 hover:bg-blue-50 rounded-md text-sm"
              >
                No parent
              </button>

              {filteredCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onChange(category.id);
                    setIsOpen(false);
                  }}
                  disabled={category.id === skipId}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm ${
                    category.id === skipId
                      ? 'text-blue-300 cursor-not-allowed'
                      : 'text-blue-900 hover:bg-blue-50'
                  }`}
                >
                  {'  '.repeat(category.level)}
                  {category.name}
                </button>
              ))}

              {filteredCategories.length === 0 && search && (
                <div className="px-3 py-2 text-blue-400 text-sm">
                  No categories found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}