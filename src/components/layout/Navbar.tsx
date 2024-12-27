import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Brain, ListPlus, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Navbar() {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    signOut();
  };

  const handleMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150); // Small delay before closing
  };

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-[2000px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-blue-900 text-2xl font-bold flex items-center gap-2">
              <Brain className="text-blue-600" size={24} />
              MedView
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-blue-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                  isActive ? 'bg-blue-50/80' : 'hover:bg-blue-50/50'
                }`
              }
            >
              <Brain size={18} />
              Classify
            </NavLink>
            <div 
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <NavLink
                to="/categories/graph"
                className={({ isActive }) =>
                  `text-blue-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    isActive || location.pathname.startsWith('/categories/') ? 'bg-blue-50/80' : 'hover:bg-blue-50/50'
                  }`
                }
              >
                <ListPlus size={18} />
                Categories
              </NavLink>
              <div 
                className={`absolute left-0 mt-1 bg-white rounded-lg shadow-lg border border-blue-100 py-1 min-w-[160px] transition-opacity duration-150 ${
                  dropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                style={{ marginTop: '0.25rem' }}
              >
                <NavLink
                  to="/categories/graph"
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm text-blue-800 hover:bg-blue-50/50 ${isActive ? 'bg-blue-50/80' : ''}`
                  }
                >
                  Graph View
                </NavLink>
                <NavLink
                  to="/categories/table"
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm text-blue-800 hover:bg-blue-50/50 ${isActive ? 'bg-blue-50/80' : ''}`
                  }
                >
                  Table View
                </NavLink>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-blue-800 hover:bg-blue-50/50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-blue-800 hover:bg-blue-50/50 p-2 rounded-lg"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-2">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `text-blue-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                    isActive ? 'bg-blue-50/80' : 'hover:bg-blue-50/50'
                  }`
                }
                onClick={() => setIsOpen(false)}
              >
                <Brain size={18} />
                Classify
              </NavLink>
              <div className="flex flex-col">
                <NavLink
                  to="/categories/graph"
                  className={({ isActive }) =>
                    `text-blue-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                      isActive || location.pathname.startsWith('/categories/') ? 'bg-blue-50/80' : 'hover:bg-blue-50/50'
                    }`
                  }
                  onClick={() => setIsOpen(false)}
                >
                  <ListPlus size={18} />
                  Categories
                </NavLink>
                <div className="ml-6 flex flex-col space-y-1 mt-1">
                  <NavLink
                    to="/categories/graph"
                    className={({ isActive }) =>
                      `block px-4 py-2 text-sm text-blue-800 hover:bg-blue-50/50 rounded-lg ${isActive ? 'bg-blue-50/80' : ''}`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    Graph View
                  </NavLink>
                  <NavLink
                    to="/categories/table"
                    className={({ isActive }) =>
                      `block px-4 py-2 text-sm text-blue-800 hover:bg-blue-50/50 rounded-lg ${isActive ? 'bg-blue-50/80' : ''}`
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    Table View
                  </NavLink>
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="text-blue-800 hover:bg-blue-50/50 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}