import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, createContext, useContext, useEffect } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
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

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-slate-50"><span className="text-slate-500 font-medium">Loading user session...</span></div>;
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

  useEffect(() => {
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
      <Router>
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
          <Routes>
            <Route path="/" element={<><Navbar /><Home /></>} />
            <Route path="/login" element={<><Navbar /><Login /></>} />
            <Route path="/register" element={<><Navbar /><Register /></>} />
            
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminPanel /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
