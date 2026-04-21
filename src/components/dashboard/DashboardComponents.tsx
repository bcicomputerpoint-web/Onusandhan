import React from 'react';
import { UploadCloud, FileText, CheckCircle, Clock, Trash2, Edit2, User, RefreshCw, X, Link as LinkIcon, ExternalLink, Mail, Phone, Calendar, MapPin, BookOpen, AlertCircle, TrendingUp, Sparkles, Youtube, PlayCircle } from 'lucide-react';
import { Button } from '../ui';

// New: Profile Strength Tracker Component
export function ProfileStrengthTracker({ score, missingFields }: { score: number, missingFields: string[] }) {
   return (
     <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-premium relative overflow-hidden group">
        <div className="flex items-center justify-between mb-4">
           <div>
              <h3 className="text-[16px] font-bold text-slate-800 tracking-tight">Profile Strength</h3>
              <p className="text-[13px] text-slate-500 font-medium mt-0.5">Academic readiness</p>
           </div>
           <div className="relative flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                 <circle cx="32" cy="32" r="28" className="stroke-slate-100" strokeWidth="6" fill="transparent" />
                 <circle 
                    cx="32" cy="32" r="28" 
                    className={`transition-all duration-1000 ease-out ${score < 50 ? 'stroke-amber-500' : score < 80 ? 'stroke-indigo-500' : 'stroke-emerald-500'}`} 
                    strokeWidth="6" 
                    fill="transparent"
                    strokeDasharray={175.9}
                    strokeDashoffset={175.9 - (score / 100) * 175.9}
                    strokeLinecap="round"
                 />
              </svg>
              <span className="absolute text-[13px] font-bold text-slate-800">{score}%</span>
           </div>
        </div>
        
        {score < 100 ? (
           <div className="space-y-2 mt-4 relative z-10">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-max animate-pulse">
                 <Sparkles className="w-3 h-3" /> Recommended Action
              </div>
              <p className="text-[13px] text-slate-600 leading-relaxed font-normal">
                 Add your <span className="font-bold text-slate-800 capitalize">{missingFields[0]?.replace('_', ' ')}</span> to reach the next milestone.
              </p>
           </div>
        ) : (
           <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-[13px] relative z-10">
              <CheckCircle className="w-4 h-4" /> Your profile is outstanding!
           </div>
        )}
        
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-50/50 to-transparent -mr-8 -mt-8 rounded-full z-0 group-hover:scale-110 transition-transform duration-500"></div>
     </div>
   );
}

// 1. Reusable Summary Card Component
export function SummaryCard({ title, value, icon: Icon, colorClass, bgClass, subtitle, status }: any) {
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-indigo-200 hover:shadow-card transition-all duration-300 cursor-pointer shadow-premium group relative overflow-hidden ${status === 'active' ? 'ring-2 ring-indigo-500/20' : ''}`}>
      {status === 'active' && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full m-3 animate-ping"></div>
      )}
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-[14px] font-semibold text-slate-500 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            <Icon className="w-5 h-5" />
          </div>
          {title}
        </h3>
      </div>
      <div>
        <h3 className="text-[32px] font-bold text-slate-800 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}

// 2. Reusable Upload Card Component (Styled like a Google Drive Folder / File element)
export function UploadCard({ title, icon: Icon, status, fileName, fileUrl, onUpload, onDelete, onReplace, onFileSelect }: any) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleBoxClick = () => {
    if (status !== 'uploading') {
      if (status === 'uploaded' && fileUrl) {
         window.open(fileUrl, '_blank', 'noopener,noreferrer');
         return;
      }
      if (onFileSelect && fileInputRef.current) {
        fileInputRef.current.click();
      } else if (onUpload) {
        onUpload();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onFileSelect) {
      onFileSelect(e.target.files[0]);
    }
    // Reset file input to allow selecting the same file again consecutively
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0] && onFileSelect) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
       className={`bg-white rounded-2xl p-4 border border-slate-200 flex flex-col relative group transition-all duration-300 ease-in-out cursor-pointer h-[130px] shadow-premium hover:shadow-card hover:border-indigo-300 hover:-translate-y-1 ${isDragging ? 'ring-2 ring-indigo-500 bg-indigo-50/50' : ''}`}
         onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleBoxClick}>
       <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" />
       
       <div className="flex justify-between items-start mb-2">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
            <Icon className="w-[18px] h-[18px]" />
          </div>
          {status === 'uploaded' ? (
             <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle className="w-3 h-3" /> Uploaded
             </span>
          ) : (
             <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white text-[10px] px-2 py-1 rounded font-bold uppercase tracking-tight">
                Required
             </div>
          )}
       </div>

       <div className="mt-auto flex flex-col">
          <h3 className="font-semibold text-[13px] text-slate-800 truncate leading-tight mb-1" title={title}>{title}</h3>
          
          {status === 'uploading' ? (
             <div className="w-full">
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                   <div className="h-full bg-indigo-600 w-2/3 animate-[progress_1.5s_ease-in-out_infinite] rounded-full"></div>
                </div>
                <span className="text-[11px] text-indigo-600 mt-1 inline-block font-semibold uppercase tracking-wider">Uploading...</span>
             </div>
          ) : status === 'uploaded' ? (
             <div className="flex items-center text-[12px] text-slate-500 truncate mt-0.5">
                 <span className="truncate flex-1 font-medium italic">{fileName}</span>
                 <button className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all ml-1 relative z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete && onDelete(); }} title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                 </button>
             </div>
          ) : (
             <div className="flex flex-col">
                <span className="text-[11px] text-slate-400 group-hover:text-indigo-600 transition-colors font-medium mt-0.5">Click or drag file</span>
                <span className="text-[10px] text-slate-300 group-hover:text-indigo-400 mt-1 truncate">PDF, DOC, JPG accepted</span>
             </div>
          )}
       </div>
    </div>
  );
}

// 3. Reusable Profile Card Component
export function ProfileCard({ details, onEdit, isAdmin = false }: any) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-premium border border-slate-200 h-full flex flex-col group relative">
       {/* Cover Gradient */}
       <div className="h-24 bg-gradient-to-r from-indigo-600 to-indigo-400 w-full"></div>
       <div className="px-6 pb-6 relative flex-1 flex flex-col">
          {/* Avatar floating */}
          <div className="w-20 h-20 rounded-2xl bg-white p-1.5 absolute -top-10 left-6 shadow-sm border border-slate-100 flex items-center justify-center rotate-3 transform group-hover:rotate-0 transition-transform duration-300">
             {details.photo ? (
               <img src={details.photo} alt={details.name} className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
             ) : (
               <div className="w-full h-full rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 text-3xl font-bold">
                 {details.name?.charAt(0)?.toUpperCase()}
               </div>
             )}
          </div>
          
          <div className="mt-12 mb-4">
             <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
               <div>
                 <h2 className="text-[22px] font-bold text-slate-800 truncate w-full max-w-[200px] tracking-tight" title={details.name}>{details.name}</h2>
                 <p className="text-[14px] text-indigo-600 font-medium mt-0.5">{details.role}</p>
               </div>
               <div className="flex items-center gap-2">
                 {isAdmin ? (
                   <span className="bg-indigo-50 text-indigo-700 text-[11px] font-bold px-2 py-1 rounded-md w-max border border-indigo-100 uppercase tracking-wider">System Admin</span>
                 ) : (
                   <button onClick={onEdit} className="text-indigo-600 text-[13px] font-semibold hover:bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 w-max shadow-sm">
                     <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                   </button>
                 )}
               </div>
             </div>
          </div>

          <div className="space-y-3.5 mt-4 flex-1">
             <div className="flex items-center gap-3 text-slate-600 text-[14px] hover:text-slate-900 transition-colors">
                <BookOpen className="w-[18px] h-[18px] text-slate-400 flex-shrink-0" />
                <span className="truncate">{details.course}</span>
             </div>
             <div className="flex items-center gap-3 text-slate-600 text-[14px] hover:text-slate-900 transition-colors">
                <MapPin className="w-[18px] h-[18px] text-slate-400 flex-shrink-0" />
                <span className="truncate">{details.university}</span>
             </div>
             <div className="flex items-center gap-3 text-slate-600 text-[14px] hover:text-slate-900 transition-colors">
                <Calendar className="w-[18px] h-[18px] text-slate-400 flex-shrink-0" />
                <span>{details.session}</span>
             </div>
             <div className="flex items-center gap-3 text-slate-600 text-[14px] hover:text-slate-900 transition-colors">
                <Mail className="w-[18px] h-[18px] text-slate-400 flex-shrink-0" />
                <span className="truncate">{details.email}</span>
             </div>
             <div className="flex items-center gap-3 text-slate-600 text-[14px] hover:text-slate-900 transition-colors">
                <Phone className="w-[18px] h-[18px] text-slate-400 flex-shrink-0" />
                <span>{details.mobile}</span>
             </div>
          </div>
       </div>
    </div>
  );
}

// 4. Reusable LinkCard
export function LinkCard({ link, onDelete }: any) {
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(link.external_url);
  const isVideo = !!videoId || link.category === 'Video/Tutorial' || link.category === 'YouTube Video';
  
  return (
    <div className="bg-white border text-left border-slate-200 rounded-2xl p-4 flex flex-col hover:border-indigo-200 hover:shadow-md transition-all duration-300 ease-in-out group relative overflow-hidden h-full">
       <div className={`absolute top-0 left-0 w-1 h-full ${isVideo ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
       <div className="flex justify-between items-start mb-3 ml-2">
         <div className={`${isVideo ? 'bg-red-50 text-red-600 group-hover:bg-red-600' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600'} p-2.5 rounded-xl transition-colors shadow-sm group-hover:text-white`}>
           {isVideo ? <Youtube className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
         </div>
         <div className="flex gap-1">
            <a href={link.external_url} target="_blank" className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors" title="Visit">
               <ExternalLink className="w-[18px] h-[18px]" />
            </a>
            <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
               <Trash2 className="w-[18px] h-[18px]" />
            </button>
         </div>
       </div>
       <div className="ml-2 flex-1 flex flex-col">
          <h4 className="font-semibold text-slate-800 text-[15px] line-clamp-2 mb-2 leading-tight" title={link.title}>{link.title}</h4>
          <span className={`text-[11px] font-bold ${isVideo ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'} px-2 py-1 rounded-md w-max mb-3 uppercase tracking-wider`}>{link.category}</span>
          
          {videoId ? (
             <div className="mt-2 mb-4 relative rounded-xl aspect-video overflow-hidden border border-slate-100 shadow-sm group-hover:shadow-red-200/50 transition-all">
                <img 
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
                  alt="Thumbnail" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-colors">
                   <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-6 h-6" />
                   </div>
                </div>
             </div>
          ) : isVideo && (
             <div className="mt-2 mb-4 bg-slate-50 rounded-xl aspect-video flex items-center justify-center border border-slate-100 group-hover:bg-red-50/50 transition-colors">
                <PlayCircle className="w-8 h-8 text-slate-300 group-hover:text-red-400 transition-all group-hover:scale-110" />
             </div>
          )}

          <p className="text-[12px] text-slate-400 font-medium truncate mt-auto flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {new Date(link.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
       </div>
    </div>
  )
}


// 5. Link Form Component
export function LinkForm({ onSubmit, isSubmitting }: { onSubmit: (data: any) => void, isSubmitting: boolean }) {
  const [title, setTitle] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('Publication');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;
    onSubmit({ title, url, description, category });
    setTitle('');
    setUrl('');
    setDescription('');
  };

  return (
    <div className="bg-transparent text-slate-800">
      <h3 className="text-[16px] font-bold text-slate-800 mb-4 tracking-tight">Add External Link</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Link Title</label>
            <input required type="text" className="w-full text-[14px] rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white outline-none shadow-sm transition-all" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. IEEE 2026" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Category</label>
            <select className="w-full text-[14px] rounded-lg border border-slate-300 px-3 py-2 bg-white outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" value={category} onChange={e => setCategory(e.target.value)}>
              <option value="Publication">Publication</option>
              <option value="Conference">Conference Proceeding</option>
              <option value="ORCID Profile">ORCID Profile</option>
              <option value="YouTube Video">YouTube Video</option>
              <option value="Video/Tutorial">Video / Tutorial Link</option>
              <option value="Paper DOI">Paper DOI</option>
              <option value="Academic paper">Academic paper</option>
              <option value="Google Scholar Profile">Google Scholar Profile</option>
              <option value="WeS">WeS</option>
              <option value="Scopus">Scopus</option>
              <option value="ResearchGate">ResearchGate</option>
              <option value="Vidwan Profile (UGC)">Vidwan Profile (UGC)</option>
            </select>
          </div>
        </div>
        <div>
           <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">URL (Link)</label>
           <input required type="url" className="w-full text-[14px] rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm transition-all" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div>
           <label className="block text-[13px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Description (Optional)</label>
           <input type="text" className="w-full text-[14px] rounded-lg border border-slate-300 px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm transition-all" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." />
        </div>
        <Button type="submit" variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 hover:shadow-md hover:-translate-y-0.5 transition-all text-white rounded-lg mt-3 h-11 font-medium" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Link'}
        </Button>
      </form>
    </div>
  )
}
export function PreviewModal({ file, category, objectUrl, onConfirm, onCancel, isUploading, uploadStatus }: any) {
  if (!file) return null;
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-[600px] max-w-full flex flex-col overflow-hidden shadow-2xl animate-fade-in ring-1 ring-slate-900/5">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-[18px] font-bold text-slate-800">Upload Preview ({category})</h2>
          <button onClick={onCancel} className="p-2 -mr-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-colors" disabled={isUploading}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 bg-slate-50 flex flex-col items-center justify-center relative min-h-[300px]">
          {isImage ? (
             <img 
               src={objectUrl} 
               alt="Preview" 
               className="max-w-full max-h-[300px] object-contain rounded-lg shadow-sm" 
               onError={(e) => {
                 (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/broken/400/300';
                 console.error("Preview image failed to load");
               }}
               referrerPolicy="no-referrer" 
             />
          ) : isPDF ? (
             <div className="w-full h-full flex flex-col items-center">
                <FileText className="w-16 h-16 text-indigo-400 mb-4 animate-bounce" />
                <span className="text-slate-500 font-medium">Processing PDF document...</span>
                <p className="text-[12px] text-slate-400 mt-2">Preview depends on browser PDF support</p>
                <div className="mt-4 w-full h-[200px] border rounded-lg bg-white overflow-hidden shadow-inner">
                   <iframe src={`${objectUrl}#toolbar=0`} className="w-full h-full border-none" title="PDF Preview" />
                </div>
             </div>
          ) : (
             <div className="flex flex-col items-center">
                <div className="p-4 bg-indigo-50 rounded-2xl shadow-sm mb-4">
                   <FileText className="w-12 h-12 text-indigo-600" />
                </div>
                <span className="text-slate-500 font-medium">Preview not available for this file type</span>
             </div>
          )}
        </div>
        
        <div className="px-6 py-4 flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-center">
             <div className="flex flex-col overflow-hidden mr-4">
                <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                <span className="text-[12px] text-slate-500 font-medium mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB • {file.type || 'Unknown type'}</span>
             </div>
             
             <div className="flex gap-3 shrink-0">
                <Button variant="outline" onClick={onCancel} disabled={isUploading} className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg px-4 font-medium shadow-sm transition-colors">
                  Cancel
                </Button>
                <Button variant="primary" onClick={onConfirm} disabled={isUploading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 flex items-center gap-2 relative overflow-hidden font-medium shadow-sm shadow-indigo-200 hover:-translate-y-0.5 hover:shadow-md transition-all">
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      {uploadStatus || 'Uploading...'}
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      Upload File
                    </>
                  )}
                </Button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DataTable({ columns, data, actions }: any) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden text-[14px] flex flex-col h-full mt-4 w-full shadow-sm">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left whitespace-nowrap border-collapse">
           <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                 {columns.map((col: any, i: number) => (
                    <th key={i} className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wider">{col.header}</th>
                 ))}
                 {actions && <th className="px-5 py-3.5 font-semibold text-[12px] uppercase tracking-wider text-right">Actions</th>}
              </tr>
           </thead>
           <tbody className="divide-y divide-slate-100">
              {data.length > 0 ? data.map((row: any, i: number) => (
                 <tr key={i} className="hover:bg-slate-50/80 transition-colors group cursor-default">
                    {columns.map((col: any, j: number) => (
                       <td key={j} className="px-5 py-4 text-slate-800 font-medium">
                         {col.cell ? col.cell(row) : <span className="text-slate-600">{row[col.accessor]}</span>}
                       </td>
                    ))}
                    {actions && (
                        <td className="px-5 py-4 text-right">
                           {actions(row)}
                        </td>
                    )}
                 </tr>
              )) : (
                 <tr>
                    <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-12 text-center text-slate-500 bg-white">
                       <p className="font-semibold text-[14px]">No records found.</p>
                       <p className="text-[13px] mt-1 text-slate-400">Upload a file or add a link to see it appear here.</p>
                    </td>
                 </tr>
              )}
           </tbody>
        </table>
      </div>
    </div>
  );
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, isProcessing }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-[400px] max-w-full flex flex-col overflow-hidden shadow-2xl ring-1 ring-slate-900/5 scale-100 transition-transform">
        <div className="p-6">
          <h2 className="text-[18px] font-bold text-slate-800 mb-2">{title}</h2>
          <p className="text-[14px] text-slate-600 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onCancel} disabled={isProcessing} className="bg-white font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg px-4 py-2 text-[14px] transition-colors disabled:opacity-50 hover:shadow-sm">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-2 text-[14px] font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm shadow-red-200 hover:shadow-md hover:-translate-y-0.5">
            {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            {isProcessing ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
