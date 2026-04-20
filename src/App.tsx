import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, getDocFromCache, getDocFromServer } from 'firebase/firestore';
import { auth, db } from './firebase';
import { Language, translations, TranslationKey } from './lib/translations';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import AdminAnalytics from './pages/AdminAnalytics';
import LmsDashboard from './pages/LmsDashboard';
import AssignmentSubmission from './pages/AssignmentSubmission';
import LmsManagement from './pages/LmsManagement';
import CourseDetail from './pages/CourseDetail';
import Navbar from './components/Navbar';
import { DashboardLayout } from './components/dashboard/DashboardLayout';

interface AppUser {
  uid: string;
  email: string | null;
  role: string;
  full_name?: string;
  photo_url?: string;
  token?: string; // for backward compatibility in components if needed, though we won't use it for APIs
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  
  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-[#f4f7f9]"><span className="text-slate-500 font-medium tracking-tight">{t('lbl_loading')}</span></div>;
  }
  
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== 'Admin') return <Navigate to="/dashboard" replace />;
  
  return (
    <DashboardLayout isAdmin={user.role === 'Admin'}>
      {children}
    </DashboardLayout>
  );
};

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('onusandhan_lang');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('onusandhan_lang', lang);
  };

  const t = (key: TranslationKey): string => {
    return translations[key]?.[language] || translations[key]?.['en'] || key;
  };

  useEffect(() => {
    // Initial health check to verify Firebase connectivity
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'system', 'health'));
      } catch (error: any) {
        if(error?.message?.includes('offline')) {
          console.warn("Firestore appears to be offline. Verify your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const pDoc = await getDoc(doc(db, `users/${firebaseUser.uid}/profile`, 'info'));
          const profileData = pDoc.exists() ? pDoc.data() : {};
          
          const isAdminEmail = firebaseUser.email === 'bcicomputerpoint@gmail.com' || firebaseUser.email === 'admin@onusandhan.com';
          const role = isAdminEmail ? 'Admin' : (userDoc.exists() ? userDoc.data().role : 'Scholar');
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: role,
            full_name: profileData.full_name || firebaseUser.email?.split('@')[0],
            photo_url: profileData.photo_url
          });
        } catch (error) {
           console.error("Error fetching user role:", error);
           setUser({ uid: firebaseUser.uid, email: firebaseUser.email, role: 'Scholar' });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshAuth = async () => {
    if (!auth.currentUser) return;
    const firebaseUser = auth.currentUser;
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      const pDoc = await getDoc(doc(db, `users/${firebaseUser.uid}/profile`, 'info'));
      const profileData = pDoc.exists() ? pDoc.data() : {};
      
      const isAdminEmail = firebaseUser.email === 'bcicomputerpoint@gmail.com' || firebaseUser.email === 'admin@onusandhan.com';
      const role = isAdminEmail ? 'Admin' : (userDoc.exists() ? userDoc.data().role : 'Scholar');
      
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        role: role,
        full_name: profileData.full_name || firebaseUser.email?.split('@')[0],
        photo_url: profileData.photo_url
      });
    } catch (e) {
      console.error(e);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshAuth }}>
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <Router>
          <div className="min-h-screen bg-[#f4f7f9] font-sans text-slate-900">
            <Routes>
              <Route path="/" element={<><Navbar /><Home /></>} />
              <Route path="/login" element={<><Navbar /><Login /></>} />
              <Route path="/register" element={<><Navbar /><Register /></>} />
              
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/lms" element={<ProtectedRoute><LmsDashboard /></ProtectedRoute>} />
              <Route path="/lms/assignment/:assignmentId/upload" element={<ProtectedRoute><AssignmentSubmission /></ProtectedRoute>} />
              <Route path="/lms/course/:courseId" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminPanel /></ProtectedRoute>} />
              <Route path="/admin/lms" element={<ProtectedRoute requireAdmin={true}><LmsManagement /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin={true}><AdminAnalytics /></ProtectedRoute>} />
            </Routes>
          </div>
        </Router>
      </LanguageContext.Provider>
    </AuthContext.Provider>
  );
}
