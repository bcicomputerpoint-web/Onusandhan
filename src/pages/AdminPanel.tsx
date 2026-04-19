import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { ProfileCard, SummaryCard, DataTable, LinkForm, ConfirmModal } from '../components/dashboard/DashboardComponents';
import { Users, FileText, CheckCircle, UserPlus, Shield, Activity, Eye, Check, X as XIcon, UploadCloud, Link as LinkIcon, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui';
import { collection, query, getDocs, addDoc, deleteDoc, doc, collectionGroup } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export default function AdminPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Thesis');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = async () => {
    try {
      const usersQuery = await getDocs(collection(db, 'users'));
      const itemsQuery = await getDocs(collectionGroup(db, 'drive_items'));
      
      const users = usersQuery.docs.map(d => ({ id: d.id, ...d.data() }));
      const items = itemsQuery.docs.map(d => ({ id: d.id, ...d.data(), parentPath: d.ref.parent.parent?.path }));

      // Simulate profile retrieval per user (since user contains email and role)
      const recentUsers = users.map((u: any) => ({ ...u, email: u.email, full_name: u.email }));

      setStats({
        totalUsers: users.length,
        totalDocs: items.filter((i: any) => i.item_type === 'Document').length,
        totalLinks: items.filter((i: any) => i.item_type === 'Link').length,
        recentUsers: recentUsers.slice(0, 10),
        recentItems: items.sort((a: any, b: any) => b.created_at - a.created_at).slice(0, 50)
      });
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    }
  };

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const handleAdminLinkSubmit = async (data: any) => {
    if (!selectedUserId) return;
    setUploadState('uploading');
    try {
       const linkData = {
         title: data.title,
         item_type: 'Link',
         category: data.category,
         external_url: data.url,
         abstract: data.description,
         user_id: selectedUserId,
         created_at: Date.now(),
         visibility: 'Private'
       };
       await addDoc(collection(db, `users/${selectedUserId}/drive_items`), linkData);
       setUploadState('success');
       await fetchStats();
       setTimeout(() => setUploadState('idle'), 3000);
    } catch (e) {
       alert('Network error during link save');
       setUploadState('error');
    }
  };

  const handleAdminUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedUserId) return;
    const file = e.target.files[0];
    
    setUploadState('uploading');
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      const contentType = uploadRes.headers.get('content-type');
      let resData;
      
      if (contentType && contentType.includes('application/json')) {
         resData = await uploadRes.json();
      } else {
         const textData = await uploadRes.text();
         throw new Error(`Server returned non-JSON response (${uploadRes.status}): ` + textData.substring(0, 100));
      }

      if (!uploadRes.ok) {
         throw new Error(resData?.error || 'Failed to upload file to backend');
      }
      
      const downloadUrl = resData.url;

      const docData = {
        title: file.name,
        item_type: 'Document',
        category: selectedCategory,
        file_path: downloadUrl,
        user_id: selectedUserId,
        created_at: Date.now(),
        visibility: 'Private'
      };
      
      await addDoc(collection(db, `users/${selectedUserId}/drive_items`), docData);
      setUploadState('success');
      await fetchStats();
      setTimeout(() => setUploadState('idle'), 3000);
    } catch (e: any) {
      console.error('Admin Upload Error:', e);
      alert(`Upload failed: ${e.message || 'Unknown error'}`);
      setUploadState('error');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const adminProfile = {
      photo: '', name: user?.email ? user.email.split('@')[0] : 'System Admin', role: 'System Administrator',
      course: 'Configuration', university: 'Platform Oversight',
      session: 'Full Access', email: user?.email || 'admin@onusandhan.com', mobile: 'System Logged'
  };

  const userCols = [
    { header: 'ID', accessor: 'id', cell: (r:any) => <span className="font-mono text-[12px] text-slate-400">#{r.id}</span> },
    { header: 'Name', accessor: 'full_name', cell: (r:any) => <span className="font-semibold text-slate-800 tracking-tight">{r.full_name || 'N/A'}</span> },
    { header: 'Role', accessor: 'role', cell: (r:any) => <span className="text-slate-600 font-medium">{r.role}</span> },
    { header: 'Email', accessor: 'email', cell: (r:any) => <span className="text-slate-600 text-[13px]">{r.email}</span> },
    { header: 'Registered', accessor: 'created_at', cell: (r:any) => <span className="text-slate-500 text-[13px] font-medium">{new Date(r.created_at).toLocaleDateString()}</span> },
    { header: 'Actions', cell: () => <button className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg font-medium transition-colors">Manage</button> }
  ];
  
  const executeDelete = async () => {
    if (!itemToDelete?.parentPath || !itemToDelete?.id) return; // Need parentPath to locate the specific user
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, `${itemToDelete.parentPath}/drive_items`, itemToDelete.id));
      
      if (itemToDelete.file_path) {
         await fetch(`/api/delete-file?file_path=${encodeURIComponent(itemToDelete.file_path)}`, {
           method: 'DELETE'
         });
      }
      
      await fetchStats(); // refresh everything
    } catch (e) {
      console.error('Network error deleting item', e);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const confirmDelete = (row: any) => {
    setItemToDelete(row);
  };

  const docCols = [
    { header: 'Title', accessor: 'title', cell: (r:any) => (
      <div className="flex flex-col">
        <span className="font-semibold text-slate-800 truncate max-w-[200px] tracking-tight" title={r.title}>{r.title}</span>
        {r.item_type === 'Link' ? 
           <span className="text-[12px] text-indigo-600 font-medium mt-0.5 truncate max-w-[200px]">{r.external_url}</span> : 
           <span className="text-[12px] text-slate-500 font-medium mt-0.5 truncate flex">{r.file_path ? 'File mapped' : '---'}</span>
        }
      </div>
    )},
    { header: 'Category', accessor: 'category', cell: (r:any) => <span className="text-slate-600 font-medium">{r.category}</span> },
    { header: 'Type', accessor: 'item_type', cell: (r:any) => <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${r.item_type === 'Link' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>{r.item_type}</span> },
    { header: 'Date', cell: (r:any) => <span className="text-slate-500 text-[13px] font-medium">{new Date(r.created_at).toLocaleDateString()}</span> }
  ];

  const docActions = (r: any) => (
    <div className="flex bg-transparent justify-end gap-1">
       {r.item_type === 'Link' ? (
          <a href={r.external_url} target="_blank" className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 p-2 rounded-lg transition-colors" title="Visit">
            <LinkIcon className="w-[18px] h-[18px]" />
          </a>
       ) : (
          <a href={r.file_path} target="_blank" className="text-slate-400 hover:text-indigo-600 hover:bg-slate-100 p-2 rounded-lg transition-colors" title="Open">
            <Eye className="w-[18px] h-[18px]"/>
          </a>
       )}
       <button onClick={() => confirmDelete(r)} className="text-slate-400 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-colors" title="Delete">
         <Trash2 className="w-[18px] h-[18px]"/>
       </button>
    </div>
  );

  return (
     <div className="space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-8">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 flex items-center justify-center rounded-xl shadow-sm">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                 <h1 className="text-[24px] font-bold text-slate-800 tracking-tight">Admin Dashboard</h1>
                 <p className="text-[14px] text-slate-500 font-medium mt-1">Platform management and analytics overview.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <Button variant="outline" className="text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg px-5 font-medium transition-colors shadow-sm">Settings</Button>
              <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 text-white rounded-lg px-5 font-medium border-none transition-colors">Report</Button>
            </div>
         </div>

         {/* Top Section: Profile + Summaries */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
            <div className="lg:col-span-4 xl:col-span-3 h-full">
               <ProfileCard details={adminProfile} onEdit={() => {}} isAdmin={true} />
            </div>
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col pt-1">
               <h2 className="text-[17px] font-medium text-[#1f1f1f] mb-4">Platform Overview</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
                  <SummaryCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} />
                  <SummaryCard title="Total Admins" value="-" icon={Shield} />
                  <SummaryCard title="Uploaded Docs" value={stats?.totalDocs || 0} icon={FileText} />
                  <SummaryCard title="Links Added" value={stats?.totalLinks || 0} icon={Activity} />
               </div>
            </div>
         </div>

         {/* Admin Upload Section */}
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
            <h2 className="text-[17px] font-bold text-slate-800 mb-5 flex items-center gap-2 tracking-tight">
              <UploadCloud className="w-[18px] h-[18px] text-slate-500" /> Upload Document on Behalf of User
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Select User</label>
                <select 
                  className="w-full text-[14px] rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white outline-none shadow-sm transition-all"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">-- Choose User --</option>
                  {stats?.recentUsers?.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Document Category</label>
                <select 
                  className="w-full text-[14px] rounded-lg border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white outline-none shadow-sm transition-all"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="Marksheets">Marksheets</option>
                  <option value="Seminar">Seminar Docs</option>
                  <option value="Workshop">Workshop Certs</option>
                  <option value="FDP">FDP Certificates</option>
                  <option value="Offer Letter">Offer Letter</option>
                  <option value="CW DMC">CW DMC</option>
                  <option value="CW Certificate">CW Certificate</option>
                  <option value="RDC">RDC</option>
                  <option value="Synopsis">Synopsis</option>
                  <option value="Proposal">Proposal</option>
                  <option value="Thesis">Thesis</option>
                  <option value="Summary">Summary</option>
                  <option value="Publication">Publication</option>
                  <option value="Conference">Conference</option>
                  <option value="Similarity">Similarity</option>
                  <option value="AI Report">AI Report</option>
                </select>
              </div>
              <div className="flex items-end">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleAdminUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
                <Button 
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 text-white rounded-lg font-medium transition-colors" 
                  disabled={!selectedUserId || uploadState === 'uploading'}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadState === 'uploading' ? 'Uploading...' : uploadState === 'success' ? 'Uploaded Successfully!' : 'Select & Upload File'}
                </Button>
              </div>
            </div>
            {!selectedUserId && <p className="text-[12px] text-red-600 mt-2 font-semibold tracking-wider">* Please select a user first before uploading or saving links.</p>}
         </div>

         {/* Admin Link Storage Section */}
         <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
            <h2 className="text-[17px] font-bold text-slate-800 mb-5 flex items-center gap-2 tracking-tight">
              <LinkIcon className="w-[18px] h-[18px] text-slate-500" /> Save External Link on Behalf of User
            </h2>
            <div className="mb-6">
               <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Select User</label>
               <select 
                 className="w-full md:w-1/3 text-[14px] rounded-lg border border-slate-300 px-3 py-2.5 bg-white outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                 value={selectedUserId}
                 onChange={(e) => setSelectedUserId(e.target.value)}
               >
                 <option value="">-- Choose User --</option>
                 {stats?.recentUsers?.map((u: any) => (
                   <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                 ))}
               </select>
            </div>
            
            <div className={`transition-opacity ${!selectedUserId ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                <LinkForm onSubmit={handleAdminLinkSubmit} isSubmitting={uploadState === 'uploading'} />
            </div>
         </div>

         {/* Tables Section */}
         <div className="pt-8">
            <div className="mb-4">
               <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">Recent Registrations</h2>
            </div>
            <DataTable columns={userCols} data={stats?.recentUsers || []} />
         </div>
         
         <div className="pt-8">
            <div className="mb-4">
               <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">All Uploaded Documents & Links</h2>
            </div>
            <DataTable columns={docCols} data={stats?.recentItems || []} actions={docActions} />
         </div>

         <ConfirmModal
            isOpen={!!itemToDelete}
            title="Delete Item"
            message={`Are you sure you want to delete "${itemToDelete?.title || 'this item'}"? This action cannot be undone.`}
            onConfirm={executeDelete}
            onCancel={() => setItemToDelete(null)}
            isProcessing={isDeleting}
         />
      </div>
   )
}
