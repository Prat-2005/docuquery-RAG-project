import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, FileText, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'How It Works', path: '/#how-it-works' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
              <FileText className="w-6 h-6" />
              <span>DocuQuery</span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/app" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                  Dashboard
                </Link>
                <Link to="/settings" className="text-sm font-medium text-slate-600 hover:text-indigo-600">
                  Settings
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-indigo-600"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-600 hover:text-indigo-600"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-indigo-600"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <hr className="my-2" />
          {user ? (
            <>
              <Link to="/app" className="block px-3 py-2 text-base font-medium text-slate-600" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <Link to="/settings" className="block px-3 py-2 text-base font-medium text-slate-600" onClick={() => setIsOpen(false)}>Settings</Link>
              <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 text-base font-medium text-red-600">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block px-3 py-2 text-base font-medium text-slate-600" onClick={() => setIsOpen(false)}>Login</Link>
              <Link to="/register" className="block px-3 py-2 text-base font-medium text-indigo-600" onClick={() => setIsOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
