import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineUser, HiOutlineSquares2X2 } from 'react-icons/hi2';

export const Navbar = ({ isAuthenticated, userRole, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-700 to-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">SC</span>
            </div>
            <span className="font-bold text-xl text-blue-700 hidden sm:inline">SunoCampus</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {!isAuthenticated && (
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Home
              </Link>
            )}
            <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
              About
            </Link>

            {isAuthenticated ? (
              <>
                {userRole === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-red-600 font-medium transition-colors inline-flex items-center gap-1">
                    <HiOutlineShieldCheck size={18} /> Admin
                  </Link>
                )}
                {(userRole === 'contributor' || userRole === 'admin') && (
                  <Link to="/contributor" className="text-gray-700 hover:text-blue-600 font-medium transition-colors inline-flex items-center gap-1">
                    <HiOutlineSquares2X2 size={18} /> Dashboard
                  </Link>
                )}
                <Link to="/profile" className="text-gray-700 hover:text-blue-600 font-medium transition-colors inline-flex items-center gap-1">
                  <HiOutlineUser size={18} /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 font-medium transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg hover:shadow-lg hover:-translate-y-1 font-medium transition-all duration-300"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t animate-slideDown">
            {!isAuthenticated && (
              <Link to="/" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors">
                Home
              </Link>
            )}
            <Link to="/about" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors">
              About
            </Link>

            {isAuthenticated ? (
              <>
                {userRole === 'admin' && (
                  <Link to="/admin" className="flex items-center gap-1.5 py-2 text-gray-700 hover:text-red-600 transition-colors" onClick={() => setMenuOpen(false)}>
                    <HiOutlineShieldCheck size={18} /> Admin
                  </Link>
                )}
                {(userRole === 'contributor' || userRole === 'admin') && (
                  <Link to="/contributor" className="flex items-center gap-1.5 py-2 text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>
                    <HiOutlineSquares2X2 size={18} /> Dashboard
                  </Link>
                )}
                <Link to="/profile" className="flex items-center gap-1.5 py-2 text-gray-700 hover:text-blue-600 transition-colors" onClick={() => setMenuOpen(false)}>
                  <HiOutlineUser size={18} /> Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full mt-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-center transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-gray-700 hover:text-blue-600 transition-colors">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center transition-colors"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

