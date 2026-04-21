import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { ProfileCard, SummaryCard, DataTable, LinkForm, ConfirmModal } from '../components/dashboard/DashboardComponents';
import { Users, FileText, CheckCircle, UserPlus, Shield, Activity, Eye, Check, X as XIcon, UploadCloud, Link as LinkIcon, Trash2, ExternalLink, Edit2, TrendingUp, Youtube, PlayCircle } from 'lucide-react';
import { Button } from '../components/ui';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, query, getDocs, getDoc, addDoc, deleteDoc, doc, collectionGroup, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase';

export default function AdminPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Thesis');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [userToEdit, setUserToEdit] = useState<any>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', mobile: '', university: '', session: '', role: 'Research Scholar', password: '' });
  const [editFormData, setEditFormData] = useState({ name: '', email: '', role: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [youtubeModalUser, setYoutubeModalUser] = useState<any>(null);
  const [ytForm, setYtForm] = useState({ title: '', url: '' });
  const [registrationError, setRegistrationError] = useState('');

  const fetchStats = async () => {
    try {
      const usersQuery = await getDocs(collection(db, 'users'));
      const itemsQuery = await getDocs(collectionGroup(db, 'drive_items'));
      const bookingsQuery = await getDocs(collection(db, 'booking_queries'));
      
      const users = usersQuery.docs.map(d => ({ id: d.id, ...d.data() }));
      const items = itemsQuery.docs.map(d => ({ id: d.id, ...d.data(), parentPath: d.ref.parent.parent?.path }));
      const bookingsList = bookingsQuery.docs.map(d => ({ id: d.id, ...d.data() }));

      // Fetch profiles for users to show actual names instead of email
      const recentUsers = await Promise.all(users.map(async (u: any) => {
        try {
          const profileDoc = await getDoc(doc(db, `users/${u.id}/profile`, 'info'));
          const profileData = profileDoc.exists() ? profileDoc.data() : {};
          return { 
            ...u, 
            full_name: profileData.full_name || u.email,
            mobile: profileData.mobile || '---',
            university: profileData.institution || '---',
            session: profileData.research_area || '---'
          };
        } catch (e) {
          return { ...u, full_name: u.email, mobile: '---', university: '---', session: '---' };
        }
      }));

      setStats({
        totalUsers: users.length,
        totalDocs: items.filter((i: any) => i.item_type === 'Document').length,
        totalLinks: items.filter((i: any) => i.item_type === 'Link').length,
        totalAdmins: users.filter((u: any) => u.role === 'Admin').length,
        totalBookings: bookingsList.length,
        pendingBookings: bookingsList.filter((b: any) => b.status === 'Pending').length,
        recentUsers: recentUsers.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 10),
        recentItems: items.sort((a: any, b: any) => b.created_at - a.created_at).slice(0, 50),
        bookings: bookingsList.sort((a: any, b: any) => b.created_at - a.created_at)
      });
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    }
  };

  const handleAddNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    setRegistrationError('');
    
    try {
      // NOTE: Client-side Firebase cannot create other Auth users without signing the admin out.
      // We will perform the Firestore setup so the user exists in DB, 
      // but they will need to reset password or be created via a cloud function for real production.
      // For this environment, we'll suggest using a Cloud Function or Admin SDK if it were full backend.
      // Here we simulate the creation by adding records to 'users' collection.
      
      // We generate a temp ID or use email as ID if we want them to sign up later and match
      const tempId = `user_${Date.now()}`;
      
      await setDoc(doc(db, 'users', tempId), {
        email: newUserForm.email,
        role: newUserForm.role,
        createdAt: Date.now()
      });

      await setDoc(doc(db, `users/${tempId}/profile`, 'info'), {
        full_name: newUserForm.name,
        mobile: newUserForm.mobile,
        institution: newUserForm.university,
        research_area: newUserForm.session
      });

      await fetchStats();
      setIsAddingUser(false);
      setNewUserForm({ name: '', email: '', mobile: '', university: '', session: '', role: 'Research Scholar', password: '' });
      alert('User database record created successfully. Note: Real login account creation requires the Admin SDK or manual signup.');
    } catch (e: any) {
      setRegistrationError(e.message || 'Failed to create user record');
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleManageUser = (userId: string) => {
    setSelectedUserId(userId);
    // Scroll to upload form
    const element = document.getElementById('admin-upload-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const handleStartEdit = (u: any) => {
    setUserToEdit(u);
    setEditFormData({
      name: u.full_name || '',
      email: u.email || '',
      role: u.role || 'Scholar'
    });
  };

  const handleSaveUserDetails = async () => {
    if (!userToEdit) return;
    setIsSavingUser(true);
    try {
      // Update core user doc (email and role)
      await updateDoc(doc(db, 'users', userToEdit.id), { 
        role: editFormData.role,
        email: editFormData.email
      });
      
      // Update profile doc (full_name)
      await updateDoc(doc(db, `users/${userToEdit.id}/profile`, 'info'), {
        full_name: editFormData.name
      });

      await fetchStats();
      setUserToEdit(null);
    } catch (e) {
      console.error(e);
      alert('Failed to update user details. Ensure the user has a profile document.');
    } finally {
      setIsSavingUser(false);
    }
  };

  const executeUserDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      // Note: This only deletes Firestore records. 
      // Real auth deletion requires Admin SDK which isn't available on client.
      await deleteDoc(doc(db, 'users', userToDelete.id));
      await deleteDoc(doc(db, `users/${userToDelete.id}/profile`, 'info'));
      
      // Optionally could link to cloud function here
      await fetchStats();
      setUserToDelete(null);
    } catch (e) {
      alert('Failed to delete user data from Firestore');
    } finally {
      setIsDeleting(false);
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
    
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds the 10MB limit. Please upload a smaller file.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    
    setUploadState('uploading');
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || 'Failed to upload document to server');
      }
      
      const uploadData = await uploadRes.json();
      const downloadUrl = uploadData.url;

      const docData = {
        title: file.name,
        item_type: 'Document',
        category: selectedCategory,
        file_path: downloadUrl,
        user_id: selectedUserId,
        created_at: Date.now(),
        visibility: 'Private'
      };
      
      // Wrap addDoc in a timeout to prevent Firebase offline queueing from hanging the UI
      const addDocPromise = addDoc(collection(db, `users/${selectedUserId}/drive_items`), docData);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase write timeout (Network issue)")), 10000));
      await Promise.race([addDocPromise, timeoutPromise]);
      
      setUploadState('success');
      await fetchStats();
      setTimeout(() => setUploadState('idle'), 3000);
    } catch (e: any) {
      console.error('Admin Upload Error:', e);
      alert(`Upload failed: ${e.name === 'AbortError' ? 'Server upload timed out' : (e.message || 'Unknown error')}`);
      setUploadState('error');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const adminProfile = {
      photo: '', name: user?.email ? user.email.split('@')[0] : 'System Admin', role: 'System Administrator',
      course: 'Configuration', university: 'Platform Oversight',
      session: 'Full Access', email: user?.email || 'admin@onusandhan.com', mobile: 'System Logged'
  };

  const handleYtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeModalUser || !ytForm.url) return;
    setUploadState('uploading');
    try {
      await addDoc(collection(db, `users/${youtubeModalUser.id}/drive_items`), {
        title: ytForm.title || 'Assigned Video',
        item_type: 'Link',
        category: 'YouTube Video',
        external_url: ytForm.url,
        abstract: 'Assigned by Administrator',
        user_id: youtubeModalUser.id,
        created_at: Date.now(),
        visibility: 'Private'
      });
      setYoutubeModalUser(null);
      setYtForm({ title: '', url: '' });
      setUploadState('success');
      setTimeout(() => setUploadState('idle'), 3000);
      fetchStats();
    } catch (e) {
      alert('Failed to save YouTube link');
    }
  };

  const updateBookingStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'booking_queries', id), { status: newStatus });
      fetchStats();
    } catch (e) {
      console.error('Network Error updating booking status', e);
    }
  };

  const bookingCols = [
    { header: 'Date', cell: (r: any) => <span className="text-slate-500 text-[12px] whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</span> },
    { header: 'Details', cell: (r: any) => (
      <div>
         <p className="font-bold text-slate-800 text-[14px]">{r.name}</p>
         <p className="text-slate-500 text-[12px]">{r.email} • {r.contact_number}</p>
         <span className="inline-block mt-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{r.user_type}</span>
      </div>
    ) },
    { header: 'Query', cell: (r: any) => <p className="text-[13px] text-slate-600 max-w-sm whitespace-pre-wrap">{r.query_text}</p> },
    { header: 'Status', cell: (r: any) => (
      <select 
        value={r.status}
        onChange={(e) => updateBookingStatus(r.id, e.target.value)}
        className={`text-[12px] font-bold outline-none cursor-pointer rounded-lg px-2 py-1 border transition-colors ${
          r.status === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500' :
          r.status === 'Contacted' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500' :
          'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500'
        }`}
      >
        <option value="Pending">Pending</option>
        <option value="Contacted">Contacted</option>
        <option value="Resolved">Resolved</option>
      </select>
    ) }
  ];

  const userCols = [
    { header: 'ID', accessor: 'id', cell: (r:any) => <span className="font-mono text-[12px] text-slate-400">#{r.id}</span> },
    { header: 'Name', accessor: 'full_name', cell: (r:any) => <span className="font-semibold text-slate-800 tracking-tight">{r.full_name || 'N/A'}</span> },
    { header: 'Role', accessor: 'role', cell: (r:any) => <span className="text-slate-600 font-medium">{r.role}</span> },
    { header: 'Phone', accessor: 'mobile', cell: (r:any) => <span className="text-slate-600 text-[13px]">{r.mobile}</span> },
    { header: 'University', accessor: 'university', cell: (r:any) => <span className="text-slate-600 text-[13px]">{r.university}</span> },
    { header: 'Session', accessor: 'session', cell: (r:any) => <span className="text-slate-600 text-[13px]">{r.session}</span> },
    { header: 'Email', accessor: 'email', cell: (r:any) => <span className="text-slate-600 text-[13px]">{r.email}</span> },
    { header: 'Actions', cell: (r:any) => (
      <div className="flex gap-2 justify-end">
        <button onClick={() => setYoutubeModalUser(r)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Assign YouTube Video">
          <Youtube className="w-4 h-4" />
        </button>
        <button onClick={() => handleManageUser(r.id)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors" title="Manage Files">
          <UploadCloud className="w-4 h-4" />
        </button>
        <button onClick={() => handleStartEdit(r)} className="text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition-colors" title="Edit User">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => setUserToDelete(r)} className="text-slate-400 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-colors" title="Delete User">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ];
  
  const executeDelete = async () => {
    if (!itemToDelete?.parentPath || !itemToDelete?.id) return; // Need parentPath to locate the specific user
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, `${itemToDelete.parentPath}/drive_items`, itemToDelete.id));
      
      if (itemToDelete.file_path && itemToDelete.file_path.includes('firebasestorage.googleapis.com')) {
         try {
            const fileRef = ref(storage, itemToDelete.file_path);
            await deleteObject(fileRef);
         } catch (err) {
            console.warn("Storage item missing or couldn't delete", err);
         }
      } else if (itemToDelete.file_path && itemToDelete.file_path.startsWith('/uploads/')) {
         try {
            await fetch(`/api/delete-file?file_path=${encodeURIComponent(itemToDelete.file_path)}`, { method: 'DELETE' });
         } catch (err) {
            console.warn("Local storage item missing or couldn't delete", err);
         }
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
               <Button onClick={() => setIsAddingUser(true)} className="bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 text-white rounded-lg px-5 font-bold border-none transition-all flex items-center gap-2">
                 <UserPlus className="w-4 h-4" /> Add New User
               </Button>
               <Button variant="outline" className="text-slate-700 border-slate-200 hover:bg-slate-50 rounded-lg px-5 font-medium transition-colors shadow-sm">Settings</Button>
            </div>
         </div>

         {/* Top Section: Profile + Summaries */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
            <div className="lg:col-span-4 xl:col-span-3 h-full">
               <ProfileCard details={adminProfile} onEdit={() => {}} isAdmin={true} />
            </div>
            <div className="lg:col-span-8 xl:col-span-9 flex flex-col pt-1">
               <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">Platform Performance</h2>
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">Live Analytics</span>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <SummaryCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} status="active" />
                     <SummaryCard title="Total Admins" value={stats?.totalAdmins || 0} icon={Shield} />
                     <SummaryCard title="Uploaded Docs" value={stats?.totalDocs || 0} icon={FileText} status={stats?.totalDocs > 0 ? "active" : "idle"} />
                     <SummaryCard title="Active Queries" value={stats?.pendingBookings || 0} icon={Activity} status={stats?.pendingBookings > 0 ? "error" : "active"} />
                  </div>
                  
                  {/* Quick Distribution Chart (SVG) */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-premium group">
                     <div className="flex flex-col">
                        <h3 className="text-[14px] font-bold text-slate-500 mb-4 flex items-center gap-2">
                           <TrendingUp className="w-4 h-4" /> Growth Trend
                        </h3>
                        <div className="h-24 w-full flex items-end gap-1 px-1">
                           {[35, 45, 30, 60, 75, 50, 90].map((h, i) => (
                              <div key={i} className="flex-1 bg-slate-100 group-hover:bg-indigo-50 rounded-full relative overflow-hidden transition-colors h-full">
                                 <div 
                                    className="absolute bottom-0 left-0 w-full bg-indigo-500 group-hover:bg-indigo-600 rounded-full transition-all duration-700 delay-[i*100ms] shadow-[0_0_8px_rgba(99,102,241,0.3)]" 
                                    style={{ height: `${h}%` }}
                                 ></div>
                              </div>
                           ))}
                        </div>
                     </div>
                     <p className="text-[12px] text-slate-400 font-medium mt-4">User registration up <span className="text-emerald-600 font-bold">12%</span> this week</p>
                  </div>
               </div>
            </div>
         </div>

         <div id="admin-upload-section" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
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
               <h2 className="text-[18px] font-bold text-slate-800 tracking-tight">Recent Booking Queries</h2>
            </div>
            <DataTable columns={bookingCols} data={stats?.bookings || []} />
         </div>

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

         <ConfirmModal
            isOpen={!!userToDelete}
            title="Delete User Data"
            message={`Are you sure you want to delete all Firestore data for ${userToDelete?.email}? This will remove their profile and database records, but will NOT delete their login account from Firebase Authentication.`}
            onConfirm={executeUserDelete}
            onCancel={() => setUserToDelete(null)}
            isProcessing={isDeleting}
         />

         {/* YouTube Link Modal */}
         {youtubeModalUser && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] w-[450px] max-w-full shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                            <Youtube className="w-5 h-5" />
                         </div>
                         <h3 className="text-[20px] font-bold text-slate-800">Assign Video</h3>
                      </div>
                      <button onClick={() => setYoutubeModalUser(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-slate-400" />
                      </button>
                   </div>

                   <p className="text-[14px] text-slate-500 mb-6 font-medium">Assign a specific YouTube resource to <span className="text-slate-800 font-bold">{youtubeModalUser.full_name}</span>.</p>

                   <form onSubmit={handleYtSubmit} className="space-y-5">
                      <div>
                         <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Video Title</label>
                         <input 
                           type="text" required placeholder="e.g. Research Methodology Seminar"
                           className="w-full text-[14px] rounded-xl border border-slate-200 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                           value={ytForm.title} onChange={e => setYtForm({...ytForm, title: e.target.value})}
                         />
                      </div>
                      <div>
                         <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">YouTube URL</label>
                         <input 
                           type="url" required placeholder="https://youtube.com/watch?v=..."
                           className="w-full text-[14px] rounded-xl border border-slate-200 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-red-500 transition-all font-medium"
                           value={ytForm.url} onChange={e => setYtForm({...ytForm, url: e.target.value})}
                         />
                      </div>
                      <div className="pt-2">
                        <Button type="submit" className="w-full h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold gap-2 shadow-lg shadow-red-100" disabled={uploadState === 'uploading'}>
                           {uploadState === 'uploading' ? 'Saving...' : 'Assign Video'} <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                   </form>
                </div>
              </div>
           </div>
         )}

         {userToEdit && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] w-[450px] max-w-full shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[20px] font-bold text-slate-800 tracking-tight">Edit User Details</h3>
                    <button onClick={() => setUserToEdit(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                      <XIcon className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Full Name</label>
                      <input 
                        type="text"
                        className="w-full text-[14px] rounded-xl border border-slate-200 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                        value={editFormData.name}
                        onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Email Address</label>
                      <input 
                        type="email"
                        className="w-full text-[14px] rounded-xl border border-slate-200 px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                        value={editFormData.email}
                        onChange={e => setEditFormData({...editFormData, email: e.target.value})}
                      />
                      <p className="text-[11px] text-slate-400 mt-2 font-medium leading-relaxed italic">* Changing email here only updates the database record, not their login credentials.</p>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 mb-3 uppercase tracking-widest">User Category / Role</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Research Scholar', 'Student', 'Centre', 'Admin'].map(role => (
                          <button 
                            key={role}
                            type="button"
                            onClick={() => setEditFormData({...editFormData, role})}
                            className={`px-4 py-2.5 rounded-xl border text-[13px] font-bold transition-all ${editFormData.role === role ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : 'border-slate-100 hover:border-slate-200 text-slate-600'}`}
                          >
                            {role}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white transition-all"
                    onClick={() => setUserToEdit(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 text-white font-bold transition-all flex items-center justify-center gap-2"
                    onClick={handleSaveUserDetails}
                    disabled={isSavingUser}
                  >
                    {isSavingUser ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {isSavingUser ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
           </div>
         )}

         {isAddingUser && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] w-[500px] max-w-full shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                <form onSubmit={handleAddNewUser}>
                  <div className="p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-[20px] font-bold text-slate-800 tracking-tight">Add New Registration</h3>
                      <button type="button" onClick={() => setIsAddingUser(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>

                    {registrationError && <div className="p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">{registrationError}</div>}
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Full Name</label>
                          <input 
                            type="text"
                            required
                            className="w-full text-[14px] rounded-xl border border-slate-200 px-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                            value={newUserForm.name}
                            onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Email</label>
                          <input 
                            type="email"
                            required
                            className="w-full text-[14px] rounded-xl border border-slate-200 px-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                            value={newUserForm.email}
                            onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Mobile</label>
                          <input 
                            type="text"
                            required
                            className="w-full text-[14px] rounded-xl border border-slate-200 px-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                            value={newUserForm.mobile}
                            onChange={e => setNewUserForm({...newUserForm, mobile: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">University Board</label>
                          <input 
                            type="text"
                            required
                            className="w-full text-[14px] rounded-xl border border-slate-200 px-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                            value={newUserForm.university}
                            onChange={e => setNewUserForm({...newUserForm, university: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Session</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. 2024-2027"
                            className="w-full text-[14px] rounded-xl border border-slate-200 px-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                            value={newUserForm.session}
                            onChange={e => setNewUserForm({...newUserForm, session: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">User Category</label>
                          <select 
                            className="w-full text-[14px] rounded-xl border border-slate-200 px-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                            value={newUserForm.role}
                            onChange={e => setNewUserForm({...newUserForm, role: e.target.value})}
                          >
                            <option value="Research Scholar">Research Scholar</option>
                            <option value="Student">Student</option>
                            <option value="Centre">Centre</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center gap-3">
                    <Button 
                      type="button"
                      variant="outline" 
                      className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-white"
                      onClick={() => setIsAddingUser(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      variant="primary" 
                      className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 text-white font-bold flex items-center justify-center gap-2"
                      disabled={isSavingUser}
                    >
                      {isSavingUser ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Create Record
                    </Button>
                  </div>
                </form>
              </div>
           </div>
         )}
      </div>
   )
}
