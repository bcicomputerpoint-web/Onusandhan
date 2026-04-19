import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../App';
import { 
   LayoutDashboard, User, Folder, Upload, Link as LinkIcon, Settings, 
   LogOut, Search, Bell, Menu, Users, FileText, CheckSquare, Activity,
   Plus, HardDrive, Share2, Clock, Star, Trash, HelpCircle, UserCircle, Library
} from 'lucide-react';

export const Sidebar = ({ isAdmin, isOpen, setOpen }: { isAdmin: boolean, isOpen: boolean, setOpen: (v: boolean) => void }) => {
   const location = useLocation();
   const { logout } = useAuth();
   
   const userLinks = [
     { name: 'My Dashboard', path: '/dashboard', icon: LayoutDashboard },
     { name: 'My Profile', path: '/profile', icon: UserCircle },
     { name: 'Recent Activity', path: '/dashboard?tab=recent', icon: Clock },
     { name: 'Starred', path: '/dashboard?tab=starred', icon: Star },
     { name: 'Trash', path: '/dashboard?tab=trash', icon: Trash },
   ];
   
   const adminLinks = [
     { name: 'Overview', path: '/admin', icon: LayoutDashboard },
     { name: 'Users', path: '/admin/users', icon: Users },
     { name: 'All Documents', path: '/admin/docs', icon: Folder },
     { name: 'Analytics', path: '/admin/analytics', icon: Activity },
   ];
   
   const links = isAdmin ? adminLinks : userLinks;

   return (
      <>
        {isOpen && <div className="fixed inset-0 bg-slate-900/50 lg:hidden z-40 transition-opacity backdrop-blur-sm" onClick={() => setOpen(false)} />}
        <aside className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200 transform transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
           <div className="h-[72px] flex items-center px-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                    <span className="text-white font-bold text-lg leading-none">O</span>
                 </div>
                 <span className="text-[18px] font-bold text-slate-800 tracking-tight">Onusandhan</span>
              </div>
           </div>
           
           <div className="px-4 py-6">
              <button onClick={() => { setOpen(false); document.getElementById('document-uploads-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 h-11 w-full transition-all duration-200 font-medium shadow-sm shadow-indigo-200/50 hover:shadow-md hover:-translate-y-0.5">
                  <Plus className="w-5 h-5" />
                  <span className="text-[14px]">New Record</span>
              </button>
           </div>

           <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Menu</h4>
              {links.map((link) => {
                 const active = location.pathname === link.path || (link.path === '/admin' && location.pathname.startsWith('/admin'));
                 return (
                   <Link
                     key={link.name} 
                     to={link.path} 
                     onClick={() => setOpen(false)}
                     className={`flex items-center px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all duration-200 ${
                       active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                     }`}
                   >
                     <link.icon className={`w-[18px] h-[18px] mr-3 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                     {link.name}
                   </Link>
                 )
              })}
           </div>
           
           <div className="p-4 border-t border-slate-100 mt-auto">
             <button onClick={logout} className="flex items-center px-3 py-2.5 w-full text-[14px] font-medium text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors group">
                <LogOut className="w-[18px] h-[18px] mr-3 text-slate-400 group-hover:text-red-500 transition-colors" /> Sign out
             </button>
           </div>
        </aside>
      </>
   );
};

export const TopNav = ({ toggleSidebar, userRole, userName, photoUrl }: { toggleSidebar: () => void, userRole: string, userName: string, photoUrl?: string }) => {
   return (
     <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-30 sticky top-0 transition-all">
        <div className="flex items-center flex-1">
           <button onClick={toggleSidebar} className="lg:hidden p-2 text-slate-600 mr-3 hover:bg-slate-100 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
           </button>
           
           <div className="hidden md:flex items-center max-w-[480px] w-full relative group border border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 rounded-xl bg-slate-50 focus-within:bg-white h-[44px] px-3 transition-all">
              <Search className="w-[18px] h-[18px] text-slate-400 mr-2 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search records and documents..." 
                className="w-full bg-transparent border-none text-[14px] outline-none placeholder:text-slate-400 text-slate-800 py-1"
              />
           </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full transition-colors hidden sm:flex items-center justify-center">
              <HelpCircle className="w-[18px] h-[18px]" />
           </button>
           <button className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full transition-colors hidden sm:flex items-center justify-center">
              <Bell className="w-[18px] h-[18px]" />
           </button>
           <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block"></div>
           <div className="flex items-center gap-3 pl-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity">
              <div className="hidden md:flex flex-col items-end">
                 <span className="text-[13px] font-semibold text-slate-800 leading-tight">{userName}</span>
                 <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{userRole}</span>
              </div>
              <div className="w-[36px] h-[36px] rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white font-semibold text-[14px] shadow-sm ring-2 ring-white overflow-hidden">
                 {photoUrl ? <img src={photoUrl} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : userName?.charAt(0)?.toUpperCase()}
              </div>
           </div>
        </div>
     </header>
   );
};

export function DashboardLayout({ children, isAdmin = false }: { children: React.ReactNode, isAdmin?: boolean }) {
   const [sidebarOpen, setSidebarOpen] = useState(false);
   const { user } = useAuth();
   
   return (
     <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
        <Sidebar isAdmin={isAdmin} isOpen={sidebarOpen} setOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
           <TopNav 
              toggleSidebar={() => setSidebarOpen(true)} 
              userRole={user?.role || (isAdmin ? 'Admin' : 'Scholar')} 
              userName={user?.full_name || (isAdmin ? 'Administrator' : 'My Account')}
              photoUrl={user?.photo_url}
           />
           <main className="flex-1 overflow-y-auto w-full">
             <div className="p-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full min-h-full">
                {children}
             </div>
           </main>
        </div>
     </div>
   );
}
