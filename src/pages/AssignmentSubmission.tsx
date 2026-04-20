import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { 
  ArrowLeft, Calendar, User, BookOpen, Clock, 
  CheckCircle, ArrowRight, Share2, HelpCircle, 
  AlertCircle, ShieldCheck, Zap
} from 'lucide-react';
import { Button } from '../components/ui';
import { StatusBadge, UploadBox, InstructionPanel } from '../components/lms/LmsComponents';

export default function AssignmentSubmission() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Mock Assignment Details (Realistically fetched from Firestore)
  const assignmentData = {
    title: "Quantum Physics & Relativity Research",
    course: "Advanced Theoretical Physics",
    instructor: "Dr. Elena Vance",
    dueDate: "25 Oct, 2026 • 11:59 PM",
    timeLeft: "3 Days, 4 Hours",
    status: "Pending",
    instructions: "Your research paper must cover the intersection of general relativity and quantum mechanics. Please ensure all citations follow the APA 7th edition format. \n\nFocus areas:\n1. Schwarzschild radius calculations\n2. Bell's theorem implications\n3. LIGO observational data inclusion",
    attachments: [
      { name: "Citations_Guide.pdf", size: "1.2 MB" },
      { name: "Sample_Format.docx", size: "450 KB" }
    ]
  };

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
    setUploadError(null);
    if (selectedFile) {
       startUploadSimulation();
    }
  };

  const startUploadSimulation = () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 800);
      }
      setUploadProgress(progress);
    }, 400);
  };

  const handleSubmit = () => {
    if (!file) return;
    
    // Simulate Submission logic
    setIsSubmitted(true);
    // In production, this would update Firestore with the file URL and status
    setTimeout(() => {
       alert("Submission Successful! Your instructor has been notified.");
       navigate('/lms');
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
      
      {/* 1. Interactive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200">
         <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/lms')}
              className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm group"
            >
               <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">Submission Portal</span>
                  <StatusBadge status={isSubmitted ? 'Submitted' : assignmentData.status} />
               </div>
               <h1 className="text-3xl font-black text-slate-800 tracking-tight">{assignmentData.title}</h1>
               <div className="flex flex-wrap gap-4 mt-2 text-[13px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-slate-400" /> {assignmentData.course}</span>
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-slate-400" /> {assignmentData.instructor}</span>
               </div>
            </div>
         </div>
         <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100 shadow-sm">
               <Clock className="w-4 h-4" />
               <p className="text-[13px] font-black uppercase tracking-tight">{assignmentData.timeLeft} Left</p>
            </div>
            <p className="text-[11px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Deadline: {assignmentData.dueDate}</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         
         {/* 2. Upload Workspace */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-premium relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 blur-[50px] rounded-full -mr-16 -mt-16"></div>
               
               <div className="relative z-10 space-y-10">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <Share2 className="w-6 h-6 text-indigo-600" /> Digital Submission
                     </h3>
                     <div className="hidden sm:flex items-center gap-2 text-emerald-600 text-[11px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                        <ShieldCheck className="w-4 h-4" /> End-to-end Encrypted
                     </div>
                  </div>

                  <UploadBox 
                    file={file}
                    onFileSelect={handleFileSelect}
                    isUploading={isUploading}
                    progress={uploadProgress}
                    error={uploadError}
                    onRetry={() => startUploadSimulation()}
                  />

                  <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
                     <div className="flex items-center gap-2 text-[12px] text-slate-400 font-medium italic">
                        <HelpCircle className="w-4 h-4" />
                        Need help? Review the submission guidelines below.
                     </div>
                     <div className="flex gap-3 w-full sm:w-auto">
                        <Button variant="outline" className="flex-1 sm:flex-none border-slate-200 text-slate-600 h-12 px-8 rounded-2xl font-bold hover:bg-slate-50">
                           SAVE DRAFT
                        </Button>
                        <Button 
                          onClick={handleSubmit}
                          disabled={!file || isUploading || isSubmitted}
                          className={`flex-1 sm:flex-none h-12 px-10 rounded-2xl font-black text-[13px] tracking-widest uppercase shadow-xl transition-all ${
                             !file || isUploading ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-black shadow-indigo-200'
                          }`}
                        >
                           {isSubmitted ? 'SUBMITTING...' : 'SUBMIT ASSIGNMENT'}
                        </Button>
                     </div>
                  </div>
               </div>
            </div>

            {/* 3. Version History (Premium Feature) */}
            <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-premium">
               <h3 className="text-[17px] font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-500" /> Submission Versions
               </h3>
               <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 italic text-slate-400 text-[13px] font-medium">
                     No previous sessions found. Start by uploading your first draft.
                  </div>
               </div>
            </div>
         </div>

         {/* 4. Side Panel: Instructions & Context */}
         <div className="space-y-8">
            <div className="sticky top-[90px] space-y-8">
               <InstructionPanel 
                  instructions={assignmentData.instructions} 
                  attachments={assignmentData.attachments} 
               />
               
               <div className="bg-indigo-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full -mb-16 -mr-16 group-hover:scale-150 transition-transform duration-700"></div>
                  <h4 className="text-[13px] font-black text-indigo-300 uppercase tracking-widest mb-4">Submission Ethics</h4>
                  <div className="space-y-4 relative z-10">
                     <p className="text-[13px] font-medium leading-relaxed text-indigo-100">
                        By submitting this work, you confirm that it is authored by you and complies with the academic integrity policy of Onusandhan.
                     </p>
                     <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                           <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                           <p className="text-[12px] font-bold">Plagiarism Check</p>
                           <p className="text-[10px] text-indigo-300 font-medium">Automatic scan enabled</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Success Notification Portal */}
      {isSubmitted && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-500">
           <div className="bg-white rounded-[48px] p-12 max-w-lg w-full text-center shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
              <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                 <CheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Scholarly Duty Complete!</h2>
              <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                 Your assignment has been securely transmitted. Your instructor will be notified within seconds.
              </p>
              <div className="flex flex-col gap-3">
                 <Button onClick={() => navigate('/lms')} className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black uppercase tracking-widest">
                    BACK TO LEARNING HUB
                 </Button>
                 <button className="text-indigo-600 text-[13px] font-bold hover:underline">Download Receipt (PDF)</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
