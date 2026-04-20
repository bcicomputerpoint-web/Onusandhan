import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useLanguage } from '../App';
import { LogOut, User, LayoutDashboard, Settings, Globe } from 'lucide-react';
import { Button } from './ui';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, setLanguage: setLangState, t } = useLanguage();
  const navigate = useNavigate();

  const setLanguage = async (lang: any) => {
    setLangState(lang);
    if (user?.uid) {
      try {
        const pRef = doc(db, `users/${user.uid}/profile`, 'info');
        await updateDoc(pRef, { preferred_language: lang });
      } catch (err) {
        console.error("Failed to sync language to profile:", err);
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4 max-w-7xl justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm">
            O
          </div>
          <span className="text-xl font-semibold tracking-tight text-slate-900">{t('onusandhan_logo')}</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl mr-2">
             <button 
               onClick={() => setLanguage('en')}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
             >
               EN
             </button>
             <button 
               onClick={() => setLanguage('bn')}
               className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${language === 'bn' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
             >
               বাংলা
             </button>
          </div>

          {user ? (
            <>
              {user.role === 'Admin' ? (
                <Link to="/admin">
                  <Button variant="ghost" className="gap-2">
                    <Settings className="h-4 w-4" /> <span className="hidden sm:inline">{t('nav_admin')}</span>
                  </Button>
                </Link>
              ) : null}
              <Link to="/dashboard">
                <Button variant="ghost" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">{t('nav_dashboard')}</span>
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" className="gap-2">
                  <User className="h-4 w-4" /> <span className="hidden sm:inline">{t('nav_profile')}</span>
                </Button>
              </Link>
              <Button variant="outline" className="gap-2" onClick={() => { logout(); navigate('/'); }}>
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">{t('nav_logout')}</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">{t('nav_login')}</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">{t('nav_register')}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
