import { Link } from 'react-router-dom';
import { Button } from '../components/ui';
import { Search, FolderOpen, ShieldCheck, GraduationCap } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-center max-w-7xl mx-auto">
      <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800 mb-8">
        <GraduationCap className="w-4 h-4 mr-2" />
        For Research Scholars & Authors
      </div>
      
      <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl max-w-4xl">
        Secure Academic Driving <br />
        <span className="text-indigo-600">Platform For Research</span>
      </h1>
      
      <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto">
        Onusandhan provides a personalized private drive to securely upload, organize, search, and manage your academic documents, publications, and resource links.
      </p>
      
      <div className="mt-10 flex gap-4 justify-center">
        <Link to="/register">
          <Button variant="primary" className="h-12 px-8 text-base">Get Started Free</Button>
        </Link>
        <Link to="/login">
          <Button variant="outline" className="h-12 px-8 text-base bg-white">Sign In</Button>
        </Link>
      </div>
      
      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-left">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Organize Research</h3>
          <p className="text-slate-600">Store and categorize everything from theses to conference papers and research proposals in one place.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-left">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center mb-6">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Secure & Private</h3>
          <p className="text-slate-600">Your documents remain private by default. Robust role-based access keeps your academic work fully protected.</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-left">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-6">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Unified Search</h3>
          <p className="text-slate-600">Easily search through documents and saved links including Google Scholar, ORCID, and Scopus profiles.</p>
        </div>
      </div>
    </div>
  );
}
