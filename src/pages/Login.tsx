import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { Button, Input } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      
      // Bootstrap user if they don't exist
      const userRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef);
      let role = 'Scholar';
      
      const isAdminEmail = result.user.email === 'bcicomputerpoint@gmail.com' || result.user.email === 'admin@onusandhan.com';
      
      if (!userDoc.exists()) {
         role = isAdminEmail ? 'Admin' : 'Scholar';
         await setDoc(userRef, {
            email: result.user.email,
            role: role,
            createdAt: Date.now()
         });
         await setDoc(doc(db, `users/${result.user.uid}/profile`, 'info'), {
            full_name: result.user.displayName || (isAdminEmail ? 'System Administrator' : 'Anonymous Scholar')
         });
      } else {
         role = userDoc.data().role || 'Scholar';
         if (isAdminEmail && role !== 'Admin') {
            role = 'Admin';
            await setDoc(userRef, { role: 'Admin' }, { merge: true });
         }
      }
      
      navigate(role === 'Admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Popup blocked: This URL is not authorized. Please add this domain to Firebase Console > Authentication > Settings > Authorized Domains.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Popup closed instantly! Fix: Click "Open App in New Tab" at the top right of the screen, or allow third-party cookies in your browser settings.');
      } else {
        setError(err.message || 'Failed to initiate Google login');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      // Trying email/password - keep in mind standard AI Studio defaults to Provider only unless toggled
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      const userRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef);
      
      let role = userDoc.exists() ? userDoc.data().role : 'Scholar';
      const isAdminEmail = result.user.email === 'bcicomputerpoint@gmail.com' || result.user.email === 'admin@onusandhan.com';
      
      if (isAdminEmail && role !== 'Admin') {
         role = 'Admin';
         await setDoc(userRef, { role: 'Admin' }, { merge: true });
      }
      
      navigate(role === 'Admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
         setError('Email/Password login is not enabled in the Firebase Console. Please use Google Login below.');
      } else {
         setError(err.message || 'Login failed');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md p-10 rounded-[24px] border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="text-center mb-8">
           <div className="flex justify-center mb-6">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M12 2L2 22H22L12 2Z" fill="#F4B400"/>
                 <path d="M12 2L2 22H12L22 2Z" fill="#0F9D58" fillOpacity="0.8"/>
                 <path d="M22 22H2L12 12L22 22Z" fill="#4285F4"/>
               </svg>
           </div>
          <h2 className="text-[32px] font-bold tracking-tight text-slate-800">Sign in</h2>
          <p className="text-[15px] font-medium text-slate-500 mt-2">to continue to Onusandhan</p>
        </div>
        
        {error && <div className="p-3 mb-6 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Email</label>
            <input 
              type="email" 
              required 
              className="w-full text-[14px] rounded-lg border border-slate-300 px-3 py-2.5 bg-white outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Password</label>
            <input 
              type="password" 
              required 
              className="w-full text-[14px] rounded-lg border border-slate-300 px-3 py-2.5 bg-white outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <Button type="submit" variant="primary" className="w-full h-11 mt-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 text-white rounded-lg font-medium transition-colors">
            Sign In
          </Button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-4 text-[13px] text-slate-400 font-medium tracking-wide">or</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        <div className="flex flex-col items-center">
          <Button type="button" variant="outline" className="w-full h-11 flex items-center justify-center gap-3 rounded-lg border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm font-semibold" onClick={handleGoogleLogin}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-medium text-[14px]">Continue with Google</span>
          </Button>
        </div>
        
        <div className="mt-8 flex flex-col gap-3 text-center text-[14px] text-slate-500 font-medium">
          <div>
            Need an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-700 hover:underline font-semibold ml-1 transition-colors">Create account</Link>
          </div>
          <div>
             <button type="button" onClick={handleGoogleLogin} className="text-slate-400 hover:text-slate-600 hover:underline font-medium bg-transparent border-none p-0 cursor-pointer transition-colors">Admin Login</button>
          </div>
        </div>
      </div>
    </div>
  );
}
