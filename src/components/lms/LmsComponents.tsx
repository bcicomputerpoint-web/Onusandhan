import React, { useState } from 'react';
import { 
  BookOpen, Clock, Award, ChevronRight, PlayCircle, FileText, CheckCircle2, 
  ClipboardCheck, HelpCircle, Activity, Calendar, Download, UploadCloud,
  File, AlertCircle, TrendingUp, CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '../ui';

// Interfaces
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
  instructor_name?: string;
  thumbnail_url?: string;
  category: string;
  level: 'School' | 'College' | 'PhD';
  created_at: number;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  enrolled_at: number;
  status: 'Active' | 'Completed';
  course_data?: Course;
}

// 1. Improved CourseCard
export interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment;
  onClick?: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, enrollment, onClick }) => {
  const progress = enrollment?.progress || 0;

  return (
    <div 
      className="bg-white rounded-[24px] border border-slate-200 overflow-hidden hover:shadow-premium transition-all duration-300 group cursor-pointer flex flex-col h-full"
      onClick={onClick}
    >
      <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
        {course.thumbnail_url ? (
          <img 
            src={course.thumbnail_url} 
            alt={course.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="bg-white/90 backdrop-blur-sm text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm border border-slate-100">
            {course.level}
          </span>
          <span className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
             {course.category}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-[17px] font-bold text-slate-800 leading-tight mb-4 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {course.title}
        </h3>
        
        <div className="mt-auto">
          {enrollment ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                <span>{Math.round(progress)}% Progress</span>
                <span className="text-indigo-600">8/12 Lessons</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-[12px] text-slate-500 font-semibold italic">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>8 Weeks</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-slate-400" />
                <span>Certificate</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
           <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-700 shadow-sm border border-white">
              {course.instructor_name?.charAt(0) || 'I'}
           </div>
           <span className="text-[12px] font-bold text-slate-600">{course.instructor_name || 'Instructor'}</span>
        </div>
        <Button variant="outline" className="h-8 px-3 rounded-lg text-[11px] font-bold border-indigo-200 text-indigo-600 bg-white hover:bg-indigo-600 hover:text-white transition-all">
           CONTINUE
        </Button>
      </div>
    </div>
  );
};

// 2. Assignment Card
export const AssignmentCard = ({ title, course, dueDate, status }: any) => {
  const statusColors: any = {
    'Pending': 'bg-orange-50 text-orange-600 border-orange-100',
    'Submitted': 'bg-blue-50 text-blue-600 border-blue-100',
    'Graded': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Overdue': 'bg-red-50 text-red-600 border-red-100'
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all group flex flex-col h-full shadow-premium">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
          <ClipboardCheck className="w-5 h-5" />
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${statusColors[status] || statusColors['Pending']}`}>
          {status}
        </span>
      </div>
      <h4 className="text-[15px] font-bold text-slate-800 mb-1 leading-tight group-hover:text-indigo-600 transition-all">{title}</h4>
      <p className="text-[12px] text-slate-400 font-medium mb-4">{course}</p>
      
      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-500">
           <Clock className="w-3.5 h-3.5" />
           <span className="text-[11px] font-bold">Due: {dueDate}</span>
        </div>
        <button className="text-[12px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
          {status === 'Pending' ? 'Upload Solution' : 'View Submission'}
        </button>
      </div>
    </div>
  );
};

// 3. Quiz Card
export const QuizCard = ({ title, duration, questions, score, status }: any) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all group shadow-premium">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 rounded-xl bg-orange-50 text-orange-500">
          <HelpCircle className="w-5 h-5" />
        </div>
        {status === 'Completed' ? (
          <span className="text-[13px] font-black text-indigo-600">{score}%</span>
        ) : (
          <span className="animate-pulse text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 uppercase tracking-widest">
            Available
          </span>
        )}
      </div>
      <h4 className="text-[15px] font-bold text-slate-800 mb-4">{title}</h4>
      <div className="flex items-center gap-4 mb-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {duration}m</span>
        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {questions} Q's</span>
      </div>
      <Button className="w-full h-9 text-[11px] font-bold bg-indigo-600 rounded-lg shadow-sm shadow-indigo-100">
        {status === 'Completed' ? 'Review Quiz' : 'Attempt Now'}
      </Button>
    </div>
  );
};

// 4. Attendance Widget
export const AttendanceWidget = ({ percentage, history }: any) => {
  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-premium">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[15px] font-bold text-slate-800">Attendance</h3>
        <div className="flex items-center gap-1 text-[13px] font-black text-emerald-600">
           <TrendingUp className="w-4 h-4" /> {percentage}%
        </div>
      </div>
      
      {/* Mini Calendar visualization */}
      <div className="grid grid-cols-7 gap-1.5 mb-6">
        {history.map((day: any, i: number) => (
          <div 
            key={i} 
            className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold shadow-sm transition-all ${
              day.status === 'present' 
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
              : day.status === 'absent'
              ? 'bg-red-50 text-red-600 border border-red-100'
              : 'bg-slate-50 text-slate-300 border border-slate-100'
            }`}
          >
            {day.day}
          </div>
        ))}
      </div>
      
      <div className="flex gap-4">
         <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Present
         </div>
         <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Absent
         </div>
      </div>
    </div>
  );
};

// 5. Activity Item
export const ActivityItem = ({ icon: Icon, color, title, time }: any) => (
  <div className="flex items-start gap-4 group cursor-pointer">
    <div className={`w-10 h-10 rounded-xl ${color} bg-opacity-10 border border-opacity-20 flex items-center justify-center ${color.replace('bg-', 'text-')} flex-shrink-0 group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-bold text-slate-800 leading-tight mb-0.5 line-clamp-1">{title}</p>
      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">{time}</p>
    </div>
  </div>
);

// 6. Resource Card
export const ResourceCard = ({ title, type, size }: any) => (
  <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-100 hover:shadow-card transition-all group cursor-pointer">
    <div className="flex items-center gap-3 overflow-hidden">
      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm">
        {type === 'PDF' ? <FileText className="w-5 h-5" /> : <Download className="w-5 h-5" />}
      </div>
      <div className="min-w-0">
        <h5 className="text-[13px] font-bold text-slate-700 truncate group-hover:text-indigo-700 transition-colors uppercase tracking-tight">{title}</h5>
        <span className="text-[10px] font-bold text-slate-400">{type} • {size}</span>
      </div>
    </div>
    <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
       <Download className="w-4 h-4" />
    </button>
  </div>
);

// 7. Premium Upload Module
export const StatusBadge = ({ status }: { status: string }) => {
  const colors: any = {
    'Pending': 'bg-orange-50 text-orange-600 border-orange-100',
    'Submitted': 'bg-indigo-50 text-indigo-600 border-indigo-100 font-black',
    'Overdue': 'bg-rose-50 text-rose-600 border-rose-100',
    'Late': 'bg-amber-50 text-amber-600 border-amber-100',
    'Graded': 'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  return (
    <span className={`text-[10px] px-3 py-1 rounded-full border uppercase tracking-[0.15em] font-bold ${colors[status] || colors.Pending}`}>
      {status}
    </span>
  );
};

export const FilePreviewCard = ({ file, onRemove, onClear }: { file: File | null; onRemove: () => void; onClear: () => void }) => {
  if (!file) return null;
  
  const isImage = file.type.startsWith('image/');
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between group hover:border-indigo-300 transition-all shadow-sm">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isImage ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
          {isImage ? <File className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-slate-800 truncate">{file.name}</p>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">{file.type.split('/')[1]} • {sizeMb} MB</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="View File">
          <ChevronRight className="w-5 h-5" />
        </button>
        <button 
          onClick={onRemove}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors" 
          title="Remove File"
        >
          <XCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export const InstructionPanel = ({ instructions, attachments }: { instructions: string; attachments?: any[] }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-slate-50 rounded-[24px] border border-slate-200 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-[14px] font-bold text-slate-700 hover:bg-slate-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-500" /> Teacher Instructions
        </div>
        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="px-6 py-5 border-t border-slate-200 animate-in slide-in-from-top-2 duration-300">
           <p className="text-[13px] text-slate-600 font-medium leading-relaxed whitespace-pre-wrap mb-4">
             {instructions}
           </p>
           {attachments && attachments.length > 0 && (
             <div className="space-y-3">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Reference Materials</p>
                {attachments.map((at, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors group cursor-pointer">
                     <div className="flex items-center gap-3">
                        <Download className="w-4 h-4 text-indigo-400" />
                        <span className="text-[12px] font-bold text-slate-700">{at.name}</span>
                     </div>
                     <span className="text-[10px] font-black text-slate-400">{at.size}</span>
                  </div>
                ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export const UploadBox = ({ file, onFileSelect, isUploading, progress, error, onRetry }: any) => {
  const [isDragging, setIsDragging] = useState(false);

  if (file && !isUploading) {
    return <FilePreviewCard file={file} onRemove={() => onFileSelect(null)} onClear={() => onFileSelect(null)} />;
  }

  return (
     <div 
        className={`relative border-2 border-dashed rounded-[32px] p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group ${
          isDragging ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
        } ${isUploading ? 'pointer-events-none' : ''} ${error ? 'border-rose-300 bg-rose-50/30' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if(f) onFileSelect(f); }}
        onClick={() => !isUploading && document.getElementById('premium-upload')?.click()}
     >
        <input id="premium-upload" type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if(f) onFileSelect(f); }} />
        
        {isUploading ? (
          <div className="w-full max-w-[320px] animate-in fade-in duration-500">
             <div className="w-16 h-16 bg-indigo-600 text-white rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 animate-pulse duration-700"></div>
                <UploadCloud className="w-8 h-8 relative z-10" />
             </div>
             <h4 className="text-[16px] font-black text-slate-800 mb-1">Digitizing Scholar Work</h4>
             <p className="text-[13px] text-slate-400 font-medium mb-6">Synchronizing with Onusandhan Cloud...</p>
             <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden mb-3">
                <div className="h-full bg-indigo-600 transition-all duration-300 shadow-[0_0_12px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }}></div>
             </div>
             <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                <span className="text-indigo-600">{progress}%</span>
                <button className="text-rose-500 hover:underline">Cancel</button>
             </div>
          </div>
        ) : error ? (
          <div className="animate-in zoom-in duration-300">
             <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7" />
             </div>
             <h4 className="text-[16px] font-bold text-slate-800 mb-1">Upload Interrupted</h4>
             <p className="text-[13px] text-rose-500 font-medium mb-6">{error}</p>
             <Button onClick={(e) => { e.stopPropagation(); onRetry(); }} className="bg-slate-900 h-9 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest">
                Retry Connection
             </Button>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
             <div className="w-20 h-20 bg-white rounded-[24px] border border-slate-100 shadow-premium flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500">
                <UploadCloud className="w-10 h-10 text-indigo-500" />
             </div>
             <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2">Drop your solution here.</h4>
             <p className="text-[14px] text-slate-400 font-medium mb-8 max-w-[280px] mx-auto">
                Securely upload your academic research or assignment to the scholar database.
             </p>
             <div className="flex flex-wrap gap-3 justify-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                   <FileText className="w-3.5 h-3.5" /> PDF
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                   <Clock className="w-3.5 h-3.5" /> MAX 25MB
                </div>
             </div>
          </div>
        )}
     </div>
  );
};

// 8. Custom Lesson Item
export interface LessonItemProps {
  title: string;
  type: 'Video' | 'PDF' | 'Quiz';
  duration?: number;
  isCompleted?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export const LessonItem: React.FC<LessonItemProps> = ({ title, type, duration, isCompleted, isActive, onClick }) => {
  return (
    <div 
      className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
        isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isCompleted ? 'bg-emerald-50 text-emerald-500' : 'bg-white text-slate-400 border border-slate-200'
        }`}>
          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : (
            type === 'Video' ? <PlayCircle className="w-5 h-5" /> : <FileText className="w-4 h-4" />
          )}
        </div>
        <div>
          <h4 className={`text-[14px] font-bold ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>{title}</h4>
          {duration && <span className="text-[11px] text-slate-400 font-medium">{duration} mins</span>}
        </div>
      </div>
      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>}
    </div>
  );
};
