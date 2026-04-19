import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { ProfileCard, SummaryCard, UploadCard, DataTable, LinkForm, LinkCard, PreviewModal, ConfirmModal } from '../components/dashboard/DashboardComponents';
import { FileText, CheckCircle, Clock, Link as LinkIcon, FileBadge, FileDigit, Tag, Play, ExternalLink, Activity, Search, Filter, Plus, FilePlus, ChevronDown, List, Trash2, File, Image as ImageIcon, FileSpreadsheet, FileArchive, FileType2, FileCode } from 'lucide-react';
import { collection, query, getDocs, getDoc, addDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Button } from '../components/ui';

export default function Dashboard() {
   const { user } = useAuth();
   const navigate = useNavigate();
   const [items, setItems] = useState<any[]>([]);
   const [profile, setProfile] = useState<any>(null);
   const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});
   const [isSubmittingLink, setIsSubmittingLink] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [filterType, setFilterType] = useState('All');
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [itemToDelete, setItemToDelete] = useState<any>(null);
   const [isDeleting, setIsDeleting] = useState(false);

   const fetchItems = async () => {
      if (!user?.uid) return;
      try {
         const q = query(
           collection(db, `users/${user.uid}/drive_items`),
           where('user_id', '==', user.uid)
         );
         const querySnapshot = await getDocs(q);
         const fetchedItems = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
         fetchedItems.sort((a: any, b: any) => b.created_at - a.created_at);
         setItems(fetchedItems);
      } catch (err: any) {
         console.error('Failed to fetch items:', err.message);
      }
   };

   const fetchProfile = async () => {
      if (!user?.uid) return;
      try {
         const pDoc = await getDoc(doc(db, `users/${user.uid}/profile`, 'info'));
         if (pDoc.exists()) setProfile(pDoc.data());
      } catch (e) {
         console.error('Failed to fetch profile', e);
      }
   };

   useEffect(() => {
      fetchProfile();
      fetchItems();
   }, [user]);

   const displayProfile = profile ? {
      photo: '', name: profile.full_name || user?.email?.split('@')[0] || 'Scholar', role: user?.role,
      course: profile.institution || 'CS', university: profile.department || 'Tech University',
      session: profile.research_area || '2024-2026', email: user?.email, mobile: '+1 234 567 890'
   } : {
      photo: '', name: user?.email?.split('@')[0] || 'Scholar User', role: user?.role || 'Research Scholar',
      course: 'Ph.D. Computer Science', university: 'National Tech University',
      session: '2024-2027', email: user?.email || 'scholar@example.com', mobile: '+1 234 567 890'
   };

   const [previewContext, setPreviewContext] = useState<{ category: string, file: File, objectUrl: string } | null>(null);

   const handleFileSelect = (category: string, file: File) => {
      if (!file) return;
      const objectUrl = URL.createObjectURL(file);
      setPreviewContext({ category, file, objectUrl });
   };

   const handleCancelPreview = () => {
      if (previewContext) URL.revokeObjectURL(previewContext.objectUrl);
      setPreviewContext(null);
   };

   const handleFileUpload = async () => {
      if (!user?.uid || !previewContext) return;
      
      const { category, file } = previewContext;
      setUploadingState(prev => ({ ...prev, [category]: true }));
      try {
         const formData = new FormData();
         formData.append('file', file);
         
         const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
         });
         
         const contentType = uploadRes.headers.get('content-type');
         let resData;
         
         const textData = await uploadRes.text();
         try {
            resData = JSON.parse(textData);
         } catch (e) {
            throw new Error(`Server returned non-JSON response (${uploadRes.status}): ` + textData.substring(0, 100));
         }

         if (!uploadRes.ok) {
            throw new Error(resData?.error || 'Failed to upload file to backend');
         }
         
         const downloadUrl = resData.url;

         const docData = {
           title: file.name,
           item_type: 'Document',
           category,
           file_path: downloadUrl,
           user_id: user.uid,
           created_at: Date.now(),
           visibility: 'Private'
         };
         
         const newDoc = await addDoc(collection(db, `users/${user.uid}/drive_items`), docData);
         setItems([{ id: newDoc.id, ...docData }, ...items]);
         handleCancelPreview();
      } catch (e: any) {
         console.error('Upload Error:', e);
         alert(`Upload failed: ${e.message || 'Unknown error'}`);
      } finally {
         setUploadingState(prev => ({ ...prev, [category]: false }));
      }
   };

   const handleLinkSubmit = async (data: any) => {
     if (!user?.uid) return;
     setIsSubmittingLink(true);
     try {
         const linkData = {
           title: data.title,
           item_type: 'Link',
           category: data.category,
           external_url: data.url,
           abstract: data.description,
           user_id: user.uid,
           created_at: Date.now(),
           visibility: 'Private'
         };
         
         const newDoc = await addDoc(collection(db, `users/${user.uid}/drive_items`), linkData);
         setItems([{ id: newDoc.id, ...linkData }, ...items]);
     } catch (e) {
        alert('Network error during link save');
     } finally {
       setIsSubmittingLink(false);
     }
   }

   const executeDelete = async () => {
      if (!user?.uid || !itemToDelete) return;
      
      const id = typeof itemToDelete === 'string' ? itemToDelete : itemToDelete?.id;
      const file_path = typeof itemToDelete === 'string' ? undefined : itemToDelete?.file_path;
      
      if (!id) {
         setItemToDelete(null);
         return;
      }
      
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, `users/${user.uid}/drive_items`, id));
        setItems(items.filter(item => item.id !== id));
        
        if (file_path) {
           await fetch(`/api/delete-file?file_path=${encodeURIComponent(file_path)}`, {
             method: 'DELETE'
           });
        }
      } catch (e) {
        console.error('Error during deletion', e);
      } finally {
        setIsDeleting(false);
        setItemToDelete(null);
      }
   };

   // Helper for UI to trigger the modal
   const confirmDelete = (rowOrId: any) => {
      setItemToDelete(rowOrId);
   };

   const fileItems = items.filter(i => i.item_type === 'Document');
   const linkItems = items.filter(i => i.item_type === 'Link');

   const getFileForCategory = (category: string) => fileItems.find(i => i.category === category);

   const recentActivity = items.slice(0, 5);

   const getFileIcon = (filename: string) => {
      const ext = filename?.split('.').pop()?.toLowerCase();
      if (['pdf'].includes(ext || '')) return <FileType2 className="w-5 h-5 text-red-500"/>;
      if (['doc', 'docx'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-600"/>;
      if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-green-600"/>;
      if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-purple-500"/>;
      if (['zip', 'rar', 'tar', 'gz'].includes(ext || '')) return <FileArchive className="w-5 h-5 text-yellow-600"/>;
      if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json'].includes(ext || '')) return <FileCode className="w-5 h-5 text-slate-600"/>;
      return <File className="w-5 h-5 text-slate-500"/>;
   };

   const fileColumns = [
      { header: 'Name', accessor: 'title', cell: (row: any) => <div className="flex flex-col"><div className="flex items-center gap-3">{getFileIcon(row.title)} <span className="font-semibold text-slate-800 tracking-tight truncate max-w-[200px]" title={row.title}>{row.title}</span></div></div> },
      { header: 'Category', accessor: 'category', cell: (row: any) => <span className="text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md font-medium text-[12px]">{row.category}</span> },
      { header: 'Last modified', accessor: 'created_at', cell: (row: any) => <span className="text-slate-500 font-medium">{new Date(row.created_at).toLocaleDateString()}</span> },
      { header: 'Status', accessor: 'visibility', cell: (row: any) => <span className="text-slate-600 font-medium flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500"/> Uploaded</span> }
   ];

   const fileActions = (row: any) => (
      <div className="flex bg-transparent justify-end gap-1">
        {row.file_path && <a href={row.file_path} target="_blank" className="text-slate-400 hover:bg-slate-100 hover:text-indigo-600 p-2 rounded-lg transition-colors" title="Open"><ExternalLink className="w-[18px] h-[18px]" /></a>}
        <button onClick={() => confirmDelete(row)} className="text-slate-400 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-colors" title="Delete"><Trash2 className="w-[18px] h-[18px]"/></button>
      </div>
   );

   const academicCore = [
     { title: "Thesis", category: "Thesis", icon: FileBadge },
     { title: "Synopsis", category: "Synopsis", icon: FileText },
     { title: "Publication", category: "Publication", icon: FileDigit },
     { title: "Conference", category: "Conference", icon: Tag },
     { title: "Similarity", category: "Similarity", icon: FileText },
     { title: "AI Report", category: "AI Report", icon: FileDigit }
   ];
   
   const academicRecords = [
     { title: "Marksheets", category: "Marksheets", icon: FileBadge },
     { title: "Workshop Certs", category: "Workshop", icon: CheckCircle },
     { title: "FDP Certificates", category: "FDP", icon: FileDigit },
     { title: "CW DMC", category: "CW DMC", icon: FileText },
     { title: "CW Certificate", category: "CW Certificate", icon: FileBadge },
   ];
   
   const otherDocs = [
     { title: "Seminar Docs", category: "Seminar", icon: Tag },
     { title: "Offer Letter", category: "Offer Letter", icon: FileText },
     { title: "RDC", category: "RDC", icon: FileDigit },
     { title: "Proposal", category: "Proposal", icon: Tag },
     { title: "Summary", category: "Summary", icon: FileText },
   ];

   return (
      <div className="space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-24 relative">
         {/* Top Actions Section */}
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h1 className="text-[22px] font-bold text-slate-800 px-2 hidden md:block tracking-tight">Welcome back, {displayProfile.name}</h1>
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
               <Button variant="primary" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 text-white rounded-lg font-medium h-[40px] px-5 flex items-center gap-2 flex-shrink-0 transition-colors" onClick={() => { document.getElementById('document-uploads-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
                 <FilePlus className="w-[18px] h-[18px]" /> Upload Document
               </Button>
               <Button variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg font-medium h-[40px] px-5 flex items-center gap-2 flex-shrink-0 transition-colors" onClick={() => { document.getElementById('link-form-section')?.scrollIntoView({ behavior: 'smooth' }); }}>
                 <LinkIcon className="w-[18px] h-[18px]" /> Add Link
               </Button>
            </div>
         </div>

         {/* Top Section: Profile + Summaries */}
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            <div className="lg:col-span-4 h-full">
               <ProfileCard details={displayProfile} onEdit={() => navigate('/profile')} />
            </div>
            <div className="lg:col-span-8 flex flex-col pt-1">
               <h2 className="text-[18px] font-bold text-slate-800 mb-4 tracking-tight">Dashboard Overview</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                  <SummaryCard title="Total Documents" value={fileItems.length} icon={FileText} />
                  <SummaryCard title="Saved Links" value={linkItems.length} icon={LinkIcon} />
                  <SummaryCard title="Recent Activity" value={recentActivity.length} icon={Activity} />
                  <SummaryCard title="Platform Active" value={items.length > 0 ? "Yes" : "No"} icon={Play} />
               </div>
               
               {/* Recent Activity Mini-Feed */}
               <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
                   <h3 className="text-[15px] font-bold text-slate-800 mb-5 flex items-center gap-2 tracking-tight"><Clock className="w-4 h-4 text-slate-400"/> Recent Activity</h3>
                   {recentActivity.length > 0 ? (
                      <div className="space-y-4">
                         {recentActivity.map((act, i) => (
                            <div key={act.id} className="flex items-center gap-4 group">
                               <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-indigo-50 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 transition-colors">
                                  {act.item_type === 'Document' ? <FileText className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <p className="text-[14px] text-slate-700 truncate font-medium"><span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Uploaded</span> {act.title}</p>
                                  <p className="text-[12px] text-slate-400">{new Date(act.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center text-center py-8">
                         <div className="p-4 bg-slate-50 rounded-2xl mb-3"><List className="w-6 h-6 text-slate-400" /></div>
                         <p className="text-[14px] text-slate-700 font-semibold mb-1">No recent activity</p>
                         <p className="text-[13px] text-slate-500">Upload a file to see activity here.</p>
                      </div>
                   )}
               </div>
            </div>
         </div>

         {/* Document Upload Section */}
         <div className="pt-6" id="document-uploads-section">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
               <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">Document Uploads</h2>
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-[280px]">
                     <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                     <input type="text" placeholder="Search categories..." className="w-full h-[40px] pl-10 pr-4 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-[14px] outline-none transition-all shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
               </div>
            </div>

            <div className="space-y-10">
               {/* Academic Core Category */}
               {(!filterType || filterType === 'All') && academicCore.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                 <div>
                    <h3 className="text-[13px] font-bold text-slate-500 mb-4 border-b border-slate-200 pb-2.5 uppercase tracking-widest">Academic Core</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                       {academicCore.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map((box) => (
                         <UploadCard key={box.category} title={box.title} icon={box.icon} status={uploadingState[box.category] ? 'uploading' : getFileForCategory(box.category) ? 'uploaded' : 'not_uploaded'} fileName={getFileForCategory(box.category)?.title} fileUrl={getFileForCategory(box.category)?.file_path} onFileSelect={(file: File) => handleFileSelect(box.category, file)} onDelete={() => getFileForCategory(box.category) && confirmDelete(getFileForCategory(box.category))} />
                       ))}
                    </div>
                 </div>
               )}

               {/* Academic Records Category */}
               {(!filterType || filterType === 'All') && academicRecords.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                 <div>
                    <h3 className="text-[13px] font-bold text-slate-500 mb-4 border-b border-slate-200 pb-2.5 uppercase tracking-widest">Academic Records</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                       {academicRecords.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map((box) => (
                         <UploadCard key={box.category} title={box.title} icon={box.icon} status={uploadingState[box.category] ? 'uploading' : getFileForCategory(box.category) ? 'uploaded' : 'not_uploaded'} fileName={getFileForCategory(box.category)?.title} fileUrl={getFileForCategory(box.category)?.file_path} onFileSelect={(file: File) => handleFileSelect(box.category, file)} onDelete={() => getFileForCategory(box.category) && confirmDelete(getFileForCategory(box.category))} />
                       ))}
                    </div>
                 </div>
               )}
               
               {/* Others Category */}
               {(!filterType || filterType === 'All') && otherDocs.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 && (
                 <div>
                    <h3 className="text-[13px] font-bold text-slate-500 mb-4 border-b border-slate-200 pb-2.5 uppercase tracking-widest">Additional Documents</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                       {otherDocs.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map((box) => (
                         <UploadCard key={box.category} title={box.title} icon={box.icon} status={uploadingState[box.category] ? 'uploading' : getFileForCategory(box.category) ? 'uploaded' : 'not_uploaded'} fileName={getFileForCategory(box.category)?.title} fileUrl={getFileForCategory(box.category)?.file_path} onFileSelect={(file: File) => handleFileSelect(box.category, file)} onDelete={() => getFileForCategory(box.category) && confirmDelete(getFileForCategory(box.category))} />
                       ))}
                    </div>
                 </div>
               )}
            </div>
         </div>

         {/* Links Section */}
         <div className="pt-8 border-t border-slate-200" id="link-form-section">
            <div className="mb-6">
               <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">Saved Links & Resources</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 lg:sticky lg:top-[88px] shadow-sm">
                <LinkForm onSubmit={handleLinkSubmit} isSubmitting={isSubmittingLink} />
              </div>
              <div className="lg:col-span-8 xl:col-span-9">
                 {linkItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                       {linkItems.map((link: any) => (
                          <LinkCard key={link.id} link={link} onDelete={() => confirmDelete(link)} />
                       ))}
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center h-full min-h-[240px]">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5 rotate-3 shadow-sm">
                         <LinkIcon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <h3 className="text-[16px] font-bold text-slate-800 mb-2 tracking-tight">No links saved yet</h3>
                      <p className="text-[14px] text-slate-500 max-w-[280px]">Keep track of important academic papers, ORCID profiles, and external resources here.</p>
                    </div>
                 )}
              </div>
            </div>
         </div>

         {/* Table Section (All Files View) */}
         <div className="pt-8 border-t border-slate-200">
            <div className="mb-4">
               <h2 className="text-[20px] font-bold text-slate-800 tracking-tight">All Files List</h2>
            </div>
            <div className="bg-transparent overflow-hidden">
              <DataTable columns={fileColumns} data={fileItems} actions={fileActions} />
            </div>
         </div>

         {/* Floating Action Button for Mobile / Quick Upload */}
         <button 
           className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 hover:scale-105 text-white rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center transition-all duration-300 z-50 group border border-indigo-500 hover:shadow-indigo-300"
           onClick={() => { document.getElementById('document-uploads-section')?.scrollIntoView({ behavior: 'smooth' }); }}
           title="Quick Upload"
         >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
         </button>

         <PreviewModal 
           file={previewContext?.file} 
           category={previewContext?.category} 
           objectUrl={previewContext?.objectUrl} 
           onConfirm={handleFileUpload} 
           onCancel={handleCancelPreview} 
           isUploading={previewContext ? uploadingState[previewContext.category] : false} 
         />
         
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
