import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, FileText, LogOut } from 'lucide-react';
import ThemeToggle from '../common/ThemeToggle';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Features', path: '/#features' },
    { name: 'How It Works', path: '/#how-it-works' },
  ];

  return (
    <nav className="theme-header sticky top-0 z-50 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 text-indigo-600 font-bold text-xl group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 shadow-xs transition-transform group-hover:scale-105">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <span className="text-slate-900 font-extrabold tracking-tight">DocuQuery AI</span>
            </Link>
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.path}
                  className="px-3 py-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/app"
                  className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  to="/settings"
                  className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Settings
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-slate-600 hover:text-indigo-600 rounded-lg"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden theme-header px-4 py-4 space-y-2 border-t">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.path}
              className="block px-3 py-2 text-base font-semibold text-slate-700 hover:text-indigo-600"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </a>
          ))}
          <hr className="my-2 border-slate-200" />
          {user ? (
            <>
              <Link to="/app" className="block px-3 py-2 text-base font-semibold text-slate-700" onClick={() => setIsOpen(false)}>Dashboard</Link>
              <Link to="/settings" className="block px-3 py-2 text-base font-semibold text-slate-700" onClick={() => setIsOpen(false)}>Settings</Link>
              <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full text-left px-3 py-2 text-base font-semibold text-red-600">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block px-3 py-2 text-base font-semibold text-slate-700" onClick={() => setIsOpen(false)}>Login</Link>
              <Link to="/register" className="block px-3 py-2 text-base font-semibold text-indigo-600" onClick={() => setIsOpen(false)}>Register</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
