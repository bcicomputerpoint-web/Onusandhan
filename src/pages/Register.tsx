import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { Button } from '../components/ui';
import { CheckCircle, PlayCircle } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('Research Scholar');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredRole, setRegisteredRole] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setError('');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      const userRef = doc(db, 'users', result.user.uid);
      const isAdminEmail = email === 'bcicomputerpoint@gmail.com' || email === 'admin@onusandhan.com';
      const role = isAdminEmail ? 'Admin' : userType;
      
      await setDoc(userRef, {
         email: result.user.email,
         role: role,
         createdAt: Date.now()
      });
      await setDoc(doc(db, `users/${result.user.uid}/profile`, 'info'), {
         full_name: name || (isAdminEmail ? 'System Administrator' : 'Anonymous User')
      });
      
      setRegisteredRole(role);
      setShowSuccess(true);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
         setError('Email/password accounts are not enabled. Please enable them in the Firebase Console (Authentication > Sign-in method) or use Google.');
      } else {
         setError(err.message || 'Registration failed');
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      
      const userRef = doc(db, 'users', result.user.uid);
      const userDoc = await getDoc(userRef);
      let role = userType;
      
      const isAdminEmail = result.user.email === 'bcicomputerpoint@gmail.com' || result.user.email === 'admin@onusandhan.com';
      
      if (!userDoc.exists()) {
         role = isAdminEmail ? 'Admin' : userType;
         await setDoc(userRef, {
            email: result.user.email,
            role: role,
            createdAt: Date.now()
         });
         await setDoc(doc(db, `users/${result.user.uid}/profile`, 'info'), {
            full_name: result.user.displayName || (isAdminEmail ? 'System Administrator' : 'Anonymous User')
         });
      } else {
         role = userDoc.data().role || 'Scholar';
         if (isAdminEmail && role !== 'Admin') {
            role = 'Admin';
            await setDoc(userRef, { role: 'Admin' }, { merge: true });
         }
      }
      
      setRegisteredRole(role);
      setShowSuccess(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('Popup blocked: This URL is not authorized. Please add this domain to Firebase Console > Authentication > Settings > Authorized Domains.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Popup closed instantly! Fix: Click "Open App in New Tab" at the top right of the screen, or allow third-party cookies in your browser settings.');
      } else {
        setError(err.message || 'Failed to initiate Google registration');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-transparent overflow-hidden">
      {/* Informational Left Pane for Desktop */}
      <div className="hidden lg:flex flex-1 bg-slate-900 items-center justify-center relative p-12 overflow-hidden">
         {/* Background Decor */}
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[100px] -mr-48 -mt-48 rounded-full"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 blur-[100px] -ml-48 -mb-48 rounded-full"></div>
         
         <div className="relative z-10 w-full max-w-2xl flex flex-col">
            <div className="mb-10">
               <span className="inline-block bg-indigo-500/20 text-indigo-400 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-4">Onusandhan Network</span>
               <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">Join the community <br/><span className="text-indigo-400">of world-class scholars.</span></h1>
               <p className="text-lg text-slate-400 mt-6 max-w-lg leading-relaxed">Unlock advanced student management, digital thesis repositories, and collaborative research tools today.</p>
            </div>

            {/* Video Placeholder Section */}
            <div className="group relative rounded-3xl overflow-hidden aspect-video shadow-2xl border border-white/10 bg-slate-800">
               <iframe 
                  className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0&autoplay=0&mute=1&loop=1" 
                  title="Onusandhan Registration Guide"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
               ></iframe>
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex flex-col justify-end p-8 pointer-events-none">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/20">
                        <PlayCircle className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-white">Academic Tour</p>
                        <p className="text-xs text-slate-300 mt-0.5">Explore the LMS & Research Drive</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Logic/Form Right/Main Pane */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md p-10 my-8 rounded-[32px] border border-slate-200 bg-white shadow-premium">
          <div className="text-center mb-8">
             <div className="flex justify-center mb-6">
                 <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M12 2L2 22H22L12 2Z" fill="#6366f1"/>
                   <path d="M12 2L2 22H12L22 2Z" fill="#4f46e5" fillOpacity="0.8"/>
                   <path d="M22 22H2L12 12L22 22Z" fill="#4338ca"/>
                 </svg>
             </div>
            <h2 className="text-[32px] font-bold tracking-tight text-slate-800">Get Started</h2>
            <p className="text-[15px] font-medium text-slate-500 mt-2">Join for free today</p>
          </div>
          
          {error && <div className="p-3 mb-6 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100 font-medium">{error}</div>}

          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            <div>
              <label className="block text-[13px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Full Name</label>
              <input 
                type="text" 
                required 
                className="w-full text-[14px] rounded-xl border border-slate-300 px-3 py-3 bg-white outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="John Doe"
              />
            </div>
            
            <div>
              <label className="block text-[13px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                required 
                className="w-full text-[14px] rounded-xl border border-slate-300 px-3 py-3 bg-white outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="name@university.edu"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Academic Role</label>
              <select
                className="w-full text-[14px] rounded-xl border border-slate-300 px-3 py-3 bg-white outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium"
                value={userType}
                onChange={e => setUserType(e.target.value)}
              >
                <option value="Research Scholar">Research Scholar</option>
                <option value="Student">Student</option>
                <option value="Centre">Academic Centre</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[13px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Choose Password</label>
              <input 
                type="password" 
                required 
                minLength={6}
                className="w-full text-[14px] rounded-xl border border-slate-300 px-3 py-3 bg-white outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Min. 6 characters"
              />
            </div>
            
            <Button type="submit" variant="primary" className="w-full h-12 mt-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 text-white rounded-xl font-bold transition-all hover:-translate-y-0.5">
              Create Profile
            </Button>
          </form>

          <div className="flex items-center my-8">
            <div className="flex-1 border-t border-slate-100"></div>
            <span className="px-4 text-[12px] text-slate-400 font-bold uppercase tracking-widest">or</span>
            <div className="flex-1 border-t border-slate-100"></div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <Button type="button" variant="outline" className="w-full h-12 flex items-center justify-center gap-3 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-sm font-bold" onClick={handleGoogleLogin}>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Quick Join with Google
            </Button>

            <p className="text-[14px] text-slate-500 font-medium text-center">Already have account? <button onClick={() => navigate('/login')} className="text-indigo-600 hover:underline font-bold">Sign In</button></p>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl ring-1 ring-slate-200 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-[24px] font-bold text-slate-800 mb-2">Registration Successful</h3>
            <p className="text-slate-500 text-[15px] mb-8 leading-relaxed">
              Your account as <span className="font-bold text-slate-700">{registeredRole}</span> has been created. You can now access your research dashboard.
            </p>
            <Button 
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
              onClick={() => navigate(registeredRole === 'Admin' ? '/admin' : '/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
