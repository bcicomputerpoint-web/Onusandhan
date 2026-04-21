import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, useLanguage } from '../App';
import { BookOpen, UserCircle, LogOut, Code, Menu, Search, Folder, MessageSquare, BookMarked, Globe, CreditCard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();

  const isMenuOpen = false;

  const LanguageSwitcher = () => (
    <div className="flex items-center gap-0.5 bg-slate-100 p-1 rounded-xl">
      <button 
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-lg text-[10px] uppercase font-black transition-all ${language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
      >
        EN
      </button>
      <button 
        onClick={() => setLanguage('bn')}
        className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${language === 'bn' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
      >
        বাংলা
      </button>
    </div>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img src="/logo.png" alt="Onusandhan" className="w-8 h-8 object-cover rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                Onusandhan
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <LanguageSwitcher />
            
            {user ? (
              <>
                {user.role === 'Admin' ? (
                  <Link to="/admin" className={`text-sm font-medium flex items-center gap-2 ${location.pathname.startsWith('/admin') ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
                    <Code className="w-4 h-4" /> Admin
                  </Link>
                ) : (
                  <Link to="/dashboard" className={`text-sm font-medium flex items-center gap-2 ${location.pathname.startsWith('/dashboard') ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
                    <Folder className="w-4 h-4" /> Dashboard
                  </Link>
                )}
                
                <Link to="/lms" className={`text-sm font-medium flex items-center gap-2 ${location.pathname.startsWith('/lms') ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
                  <BookOpen className="w-4 h-4" /> Courses
                </Link>

                <div className="h-4 w-px bg-slate-200 mx-2"></div>
                
                <Link to="/profile" className={`flex items-center gap-2 text-sm font-medium ${location.pathname === '/profile' ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}>
                  {user.photo_url ? (
                     <img src={user.photo_url} alt="Profile" className="w-6 h-6 rounded-full border border-slate-200 object-cover" />
                  ) : (
                     <UserCircle className="w-5 h-5" />
                  )}
                  Profile
                </Link>
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign in</Link>
                <Link to="/register" className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
                  Create Account
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button could go here */}
          <div className="md:hidden flex items-center gap-4">
             <LanguageSwitcher />
             <button className="text-slate-500">
               <Menu className="w-6 h-6" />
             </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
