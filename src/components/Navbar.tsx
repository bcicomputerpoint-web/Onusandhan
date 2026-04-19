import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { LogOut, User, LayoutDashboard, Settings } from 'lucide-react';
import { Button } from './ui';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4 max-w-7xl justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-sm">
            O
          </div>
          <span className="text-xl font-semibold tracking-tight text-slate-900">Onusandhan</span>
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {user.role === 'Admin' ? (
                <Link to="/admin">
                  <Button variant="ghost" className="gap-2">
                    <Settings className="h-4 w-4" /> <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
              ) : null}
              <Link to="/dashboard">
                <Button variant="ghost" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" className="gap-2">
                  <User className="h-4 w-4" /> <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
              <Button variant="outline" className="gap-2" onClick={() => { logout(); navigate('/'); }}>
                <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Sign up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
