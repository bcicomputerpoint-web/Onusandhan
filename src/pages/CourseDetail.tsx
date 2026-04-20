import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useLanguage } from '../App';
import { doc, getDoc, collection, query, getDocs, orderBy, where, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  ChevronLeft, BookOpen, Video, FileText, 
  CheckCircle2, PlayCircle, Download, 
  MessageSquare, Calendar, Trophy, 
  Send, Paperclip, Clock, AlertCircle,
  BarChart3, Award, Search, Filter, 
  Share2, Bookmark, Flame, Zap
} from 'lucide-react';
import { Button } from '../components/ui';
import { Course, LessonItem } from '../components/lms/LmsComponents';

interface Lesson {
  id: string;
  title: string;
  content_type: 'Video' | 'PDF' | 'Quiz';
  content_url: string;
  duration_mins: number;
  order: number;
  isCompleted?: boolean;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: number;
  max_points: number;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tabs configuration
  const tabs = [
    { id: 'overview', name: t('course_overview'), icon: BarChart3 },
    { id: 'lessons', name: t('lms_lessons'), icon: PlayCircle },
    { id: 'assignments', name: t('lms_assignments'), icon: FileText },
    { id: 'quizzes', name: t('lms_quizzes'), icon: Zap },
    { id: 'resources', name: t('lms_resources'), icon: BookOpen },
    { id: 'discussion', name: t('lms_discussion'), icon: MessageSquare },
    { id: 'attendance', name: t('lms_attendance'), icon: Calendar },
    { id: 'results', name: t('lms_results'), icon: Award },
  ];

  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) return;
      try {
        const courseSnap = await getDoc(doc(db, 'courses', courseId));
        if (courseSnap.exists()) {
          setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course);
        }

        const lessonsQuery = query(
          collection(db, `courses/${courseId}/lessons`), 
          orderBy('order', 'asc')
        );
        const lessonsSnap = await getDocs(lessonsQuery);
        const lessonsData = lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Lesson));
        setLessons(lessonsData);
        if (lessonsData.length > 0) setActiveLesson(lessonsData[0]);

        const assignmentsQuery = query(collection(db, `courses/${courseId}/assignments`));
        const assignmentsSnap = await getDocs(assignmentsQuery);
        setAssignments(assignmentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Assignment)));

      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <div className="w-16 h-16 rounded-3xl border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Initializing Scholar Assets...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-24 bg-white rounded-[40px] border border-slate-200">
         <AlertCircle className="w-16 h-16 text-slate-200 mx-auto mb-6" />
         <h2 className="text-2xl font-black text-slate-800 tracking-tight">Academic Access Restricted</h2>
         <p className="text-slate-500 mt-2">The course you are looking for does not exist or has been archived.</p>
         <Button onClick={() => navigate('/lms')} className="mt-8 bg-slate-900 text-white rounded-xl h-11 px-8 font-bold">Return to Learning Hub</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 1. Scholarly Navigation / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button 
          onClick={() => navigate('/lms')}
          className="flex items-center gap-3 text-[14px] font-bold text-slate-500 hover:text-indigo-600 transition-all group w-fit"
        >
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:border-indigo-200 group-hover:shadow-soft transition-all">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          {t('course_back_portal')}
        </button>
        <div className="flex items-center gap-2">
           <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 font-bold gap-2">
              <Share2 className="w-4 h-4" /> Share
           </Button>
           <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 font-bold gap-2">
              <Bookmark className="w-4 h-4" /> Save
           </Button>
        </div>
      </div>

      {/* 2. Bento-Style Premium Course Header */}
      <div className="relative rounded-[40px] bg-slate-900 overflow-hidden shadow-premium text-white p-8 md:p-12">
         {/* Background Visuals */}
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] -mr-48 -mt-48 rounded-full pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 blur-[80px] -mb-16 -ml-16 rounded-full pointer-events-none"></div>
         
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
               <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full uppercase tracking-[0.15em] border border-indigo-400/20">
                    {course.category}
                  </span>
                  <span className="text-[11px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-[0.15em] border border-emerald-400/20 flex items-center gap-1.5">
                    <Flame className="w-3 h-3" /> Best Seller
                  </span>
               </div>
               <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1] text-white">
                  {course.title}
               </h1>
               <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-2xl">
                  {course.description || "Master advanced academic methodologies through rigorous structured learning and peer collaboration."}
               </p>
               
               <div className="flex flex-wrap gap-8 pt-4">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                        <Users className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[13px] font-bold text-white">Academic Faculty</p>
                        <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">{course.instructor_name || "Internal Admin"}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                        <Clock className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[13px] font-bold text-white">8 Weeks</p>
                        <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">Duration</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300">
                        <BookOpen className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[13px] font-bold text-white">{lessons.length} Modules</p>
                        <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider">LMS Curriculum</p>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="lg:col-span-12 xl:col-span-5 flex flex-col justify-end">
               <div className="bg-white/5 backdrop-blur-md rounded-[32px] border border-white/10 p-8 space-y-6">
                  <div className="flex items-center justify-between font-black uppercase tracking-widest text-[11px] text-slate-400">
                     <span>Course Progress</span>
                     <span className="text-white">45%</span>
                  </div>
                  <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 w-[45%] rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                     <Button className="flex-1 bg-white text-slate-900 hover:bg-slate-100 h-14 rounded-2xl font-black text-xs tracking-[0.15em] uppercase transition-all hover:scale-[1.02]">
                        {t('course_resume')}
                     </Button>
                     <Button variant="outline" className="h-14 w-14 rounded-2xl border-white/20 text-white hover:bg-white/10 p-0 flex items-center justify-center">
                        <Download className="w-6 h-6" />
                     </Button>
                  </div>
                  <p className="text-[11px] text-center text-slate-400 font-bold uppercase tracking-widest">Enrolled on: {new Date(course.created_at).toLocaleDateString()}</p>
               </div>
            </div>
         </div>
      </div>

      {/* 3. Global Perspective / Tab System */}
      <div className="flex flex-col xl:flex-row gap-10">
         
         <div className="flex-1 space-y-8">
            {/* Smooth Tab Navbar */}
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-[24px] overflow-x-auto no-scrollbar shadow-sm">
               {tabs.map((tab) => (
                 <button 
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={`px-6 py-3 rounded-2xl text-[13px] font-bold whitespace-nowrap flex items-center gap-2.5 transition-all ${
                     currentTab === tab.id 
                     ? 'bg-slate-900 text-white shadow-xl' 
                     : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                 >
                   <tab.icon className={`w-4 h-4 ${currentTab === tab.id ? 'text-indigo-400' : ''}`} />
                   {tab.name}
                 </button>
               ))}
            </div>

            {/* Dynamic Content Panel */}
            <div className="min-h-[400px]">
               {/* Placeholder for tabs - will be fleshed out in phases */}
               {currentTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-premium">
                        <h4 className="text-[18px] font-black text-slate-800 mb-6 flex items-center gap-3">
                           <Bookmark className="w-5 h-5 text-indigo-600" /> Executive Digest
                        </h4>
                        <div className="space-y-4 text-slate-600 font-medium leading-relaxed text-[15px]">
                           <p>Welcome to {course.title}. This course is specifically structured to bridge the gap between theoretical foundations and practical academic application.</p>
                           <ul className="space-y-3 pt-4">
                              {[
                                "Master academic synthesis techniques",
                                "Integrate peer-review workflows",
                                "Prepare for institutional accreditation"
                              ].map((item, i) => (
                                <li key={i} className="flex flex-start gap-3">
                                   <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                   </div>
                                   <span>{item}</span>
                                </li>
                              ))}
                           </ul>
                        </div>
                     </div>
                     
                     <div className="space-y-8">
                        <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                           <h4 className="text-[11px] font-black uppercase tracking-[0.2em] mb-4 text-indigo-200">Recommended Next</h4>
                           <div className="flex items-center gap-4 relative z-10">
                              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner">
                                 <PlayCircle className="w-8 h-8" />
                              </div>
                              <div>
                                 <h5 className="text-[16px] font-black line-clamp-1">{lessons[0]?.title || "First Module"}</h5>
                                 <p className="text-[12px] font-bold text-indigo-200 mt-0.5">Lesson 1.2 • 15 mins</p>
                              </div>
                           </div>
                        </div>
                        
                        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-premium">
                           <h4 className="text-[18px] font-black text-slate-800 mb-6">Course KPI</h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('quiz_score')}</p>
                                 <p className="text-2xl font-black text-slate-800">82.5%</p>
                              </div>
                              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rank</p>
                                 <p className="text-2xl font-black text-slate-800">#4</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
               {currentTab === 'lessons' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in duration-500">
                     {/* 1. Integrated Lesson Viewer (Stage) */}
                     <div className="lg:col-span-8 space-y-8">
                        <div className="bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl relative group ring-1 ring-white/10">
                           {activeLesson?.content_type === 'Video' ? (
                              <div className="aspect-video">
                                 <iframe 
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${activeLesson.content_url.split('v=')[1]?.split('&')[0] || ''}?autoplay=0&rel=0`}
                                    title={activeLesson.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                 ></iframe>
                              </div>
                           ) : (
                              <div className="aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-12 text-center text-white">
                                 <div className="w-24 h-24 bg-white/5 rounded-[32px] flex items-center justify-center mb-8 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <FileText className="w-12 h-12 text-indigo-400" />
                                 </div>
                                 <h3 className="text-2xl font-black mb-4 tracking-tight">{activeLesson?.title}</h3>
                                 <p className="text-slate-400 max-w-sm mb-10 leading-relaxed font-medium">This module contains research documentation and supplemental reading material for your thesis preparation.</p>
                                 <Button className="bg-indigo-600 hover:bg-indigo-700 h-14 px-10 rounded-2xl font-black text-xs tracking-widest uppercase shadow-xl shadow-indigo-500/20">
                                    Open Document Reader
                                 </Button>
                              </div>
                           )}
                        </div>

                        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-premium">
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                              <div>
                                 <h2 className="text-2xl font-black text-slate-800 tracking-tight">{activeLesson?.title}</h2>
                                 <p className="text-slate-500 font-bold text-[14px] mt-1">Module {activeLesson?.order} • {activeLesson?.duration_mins} Minutes Duration</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 <button className="flex items-center gap-2 text-[13px] font-black text-slate-400 hover:text-emerald-500 transition-colors uppercase tracking-widest">
                                    <CheckCircle2 className="w-5 h-5" /> {t('course_mark_done')}
                                 </button>
                                 <span className="h-4 w-px bg-slate-100"></span>
                                 <button className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                    <Bookmark className="w-5 h-5" />
                                 </button>
                              </div>
                           </div>
                           
                           <div className="space-y-6">
                              <h4 className="text-[13px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                 <Filter className="w-4 h-4" /> Lesson Brief & Objectives
                              </h4>
                              <p className="text-[15px] text-slate-600 font-medium leading-relaxed">
                                 In this module, scholars will evaluate the core principles of {activeLesson?.title}. We will cover the primary methodologies used in modern research and how they integrate into the Onusandhan database structure.
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                                       <Zap className="w-4 h-4" />
                                    </div>
                                    <span className="text-[13px] font-bold text-slate-700">Quick Recap Notes</span>
                                 </div>
                                 <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                                       <Download className="w-4 h-4" />
                                    </div>
                                    <span className="text-[13px] font-bold text-slate-700">Download Transcripts</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* 2. Interactive Curricular Sidebar */}
                     <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[32px] border border-slate-200 shadow-premium overflow-hidden">
                           <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                              <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                 <BookOpen className="w-4 h-4 text-indigo-600" /> Syllabus
                              </h3>
                              <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded uppercase tracking-widest">
                                 {lessons.length} Modules
                              </span>
                           </div>
                           <div className="p-2 space-y-1 max-h-[500px] overflow-y-auto no-scrollbar">
                              {lessons.map((lesson) => (
                                 <LessonItem 
                                    key={lesson.id}
                                    title={lesson.title}
                                    type={lesson.content_type}
                                    duration={lesson.duration_mins}
                                    isActive={activeLesson?.id === lesson.id}
                                    onClick={() => setActiveLesson(lesson)}
                                 />
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               )}
               {currentTab === 'assignments' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                        <div>
                           <h3 className="text-[18px] font-black text-slate-800 tracking-tight">{t('assign_tasks')}</h3>
                           <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mt-1">Foundational Research Phase</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="flex -space-x-3">
                              {[1,2,3].map(i => (
                                 <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-black font-sans">
                                    {String.fromCharCode(64 + i)}
                                 </div>
                              ))}
                           </div>
                           <p className="text-[12px] font-bold text-slate-500">22 Scholars Submitted</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {assignments.length > 0 ? (
                           assignments.map((assignment) => (
                              <div key={assignment.id} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-premium hover:shadow-xl transition-all group relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[80px] -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500"></div>
                                 <div className="relative z-10 space-y-6">
                                    <div className="flex items-start justify-between">
                                       <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 shadow-lg">
                                          <FileText className="w-7 h-7" />
                                       </div>
                                       <span className="text-[10px] font-black border border-amber-200 text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                                          Pending
                                       </span>
                                    </div>
                                    <div>
                                       <h4 className="text-[18px] font-black text-slate-800 leading-tight line-clamp-2">{assignment.title}</h4>
                                       <p className="text-[13px] text-slate-500 font-medium mt-3 line-clamp-3 leading-relaxed">
                                          {assignment.description || "Submit your detailed research synthesis for final academic evaluation."}
                                       </p>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                       <div className="flex flex-col">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Points</span>
                                          <span className="text-[14px] font-black text-slate-800 uppercase tracking-widest">{assignment.max_points} MAX</span>
                                       </div>
                                       <div className="flex flex-col text-right">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deadline</span>
                                          <span className="text-[13px] font-black text-slate-800 uppercase tracking-widest">{new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
                                       </div>
                                    </div>
                                    <Button className="w-full h-12 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-[11px] tracking-[0.2em] uppercase transition-all shadow-lg group-hover:translate-y-[-2px]">
                                       {t('assign_open_portal')}
                                    </Button>
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4">
                              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                 <AlertCircle className="w-10 h-10" />
                              </div>
                              <p className="text-slate-400 font-bold uppercase tracking-widest">No Active Lab Assignments</p>
                           </div>
                        )}
                     </div>
                  </div>
               )}

               {currentTab === 'quizzes' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                     <div className="bg-slate-900 p-10 rounded-[40px] text-white flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                        <div className="w-24 h-24 bg-white/10 rounded-[32px] border border-white/10 flex items-center justify-center shadow-inner relative z-10">
                           <Zap className="w-12 h-12 text-orange-400" />
                        </div>
                        <div className="flex-1 space-y-4 relative z-10 text-center md:text-left">
                           <h3 className="text-3xl font-black tracking-tight">{t('quiz_calibration')}</h3>
                           <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">Validate your learning progress through time-restricted scholarly assessments and receive instant performance feedback.</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 text-center relative z-10">
                           <p className="text-[11px] font-black text-orange-400 uppercase tracking-widest mb-2">Success Rate</p>
                           <p className="text-4xl font-black text-white">88%</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                           { title: "Terminology Challenge 1.1", questions: 15, duration: "10m", score: "12 / 15", status: "Completed" },
                           { title: "Methodology Mid-Point", questions: 25, duration: "30m", score: "- -", status: "Locked" },
                           { title: "Institutional Standards Quiz", questions: 10, duration: "10m", score: "9 / 10", status: "Passed" }
                        ].map((quiz, i) => (
                           <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-premium hover:shadow-xl transition-all group overflow-hidden">
                              <div className="flex items-start justify-between mb-8">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${quiz.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : quiz.status === 'Locked' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600'}`}>
                                    {quiz.status === 'Locked' ? <Bookmark className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                                 </div>
                                 <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] border ${quiz.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : quiz.status === 'Locked' ? 'bg-slate-50 text-slate-400 border-slate-200' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                    {quiz.status}
                                 </span>
                              </div>
                              <h4 className="text-[16px] font-black text-slate-800 leading-tight mb-4">{quiz.title}</h4>
                              <div className="flex items-center gap-6 mb-8 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                                 <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> {quiz.questions} Qs</span>
                                 <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {quiz.duration}</span>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Result</span>
                                 <span className="text-[14px] font-black text-slate-800 uppercase tracking-widest">{quiz.score}</span>
                              </div>
                              <Button disabled={quiz.status === 'Locked'} className="w-full h-11 bg-white border border-slate-200 hover:border-indigo-600 text-slate-600 hover:text-indigo-600 rounded-xl font-black text-[11px] tracking-[0.2em] uppercase transition-all mt-6">
                                 {quiz.status === 'Completed' || quiz.status === 'Passed' ? 'Review History' : quiz.status === 'Locked' ? 'Prerequisite Required' : 'Launch Quiz'}
                              </Button>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {currentTab === 'resources' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                     <div className="flex items-center justify-between">
                        <h3 className="text-[18px] font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase tracking-widest">
                           <Download className="w-5 h-5 text-indigo-600" /> Research Material
                        </h3>
                        <div className="flex items-center gap-3">
                           <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 font-bold gap-2">
                              <Filter className="w-4 h-4" /> Filter
                           </Button>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                           { name: "Institutional Research Protocol", type: "PDF", size: "2.4 MB", date: "Jan 12, 2026" },
                           { name: "Advanced Methodology Slides", type: "PPTX", size: "15.8 MB", date: "Jan 15, 2026" },
                           { name: "Peer-Review Checklist", type: "DOCX", size: "120 KB", date: "Feb 02, 2026" },
                           { name: "Onusandhan Data Standards", type: "PDF", size: "1.1 MB", date: "Feb 10, 2026" }
                        ].map((file, i) => (
                           <div key={i} className="flex items-center justify-between p-6 bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                              <div className="flex items-center gap-5">
                                 <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    <FileText className="w-7 h-7" />
                                 </div>
                                 <div>
                                    <h5 className="text-[15px] font-black text-slate-800 line-clamp-1">{file.name}</h5>
                                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                       <span>{file.type}</span>
                                       <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                       <span>{file.size}</span>
                                    </div>
                                 </div>
                              </div>
                              <button className="w-12 h-12 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all border border-transparent hover:border-slate-100">
                                 <Download className="w-6 h-6" />
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {currentTab === 'discussion' && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                     <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-premium">
                        <div className="flex gap-6">
                           <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg flex-shrink-0">
                              {user?.full_name?.charAt(0) || 'S'}
                           </div>
                           <div className="flex-1 space-y-4">
                              <div className="relative">
                                 <textarea 
                                    className="w-full rounded-[24px] border border-slate-200 p-6 text-[15px] font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all resize-none shadow-inner bg-slate-50 focus:bg-white" 
                                    placeholder="Pose a scholarly inquiry to your faculty or peers..." 
                                    rows={4} 
                                 />
                              </div>
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                    <button className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"><Paperclip className="w-5 h-5" /></button>
                                    <button className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-xl transition-all font-black text-xs">@</button>
                                 </div>
                                 <Button className="h-12 px-8 bg-slate-900 border border-slate-800 text-white rounded-2xl font-black text-[11px] tracking-widest uppercase flex items-center gap-3 shadow-lg">
                                    POST INQUIRY <Send className="w-4 h-4" />
                                 </Button>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="flex items-center justify-between px-4">
                           <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Socratic Discussions</h4>
                           <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">Active Threads</span>
                        </div>
                        
                        {[
                           { user: "Arjun Mehta", role: "Sr. Research Fellow", msg: "I noticed a correlation discrepancy in the week 2 dataset. Has anyone verified the raw csv?", replies: 12, time: "42m ago" },
                           { user: "Faculty Mentor", role: "Administrator", msg: "Please note: The institutional protocol files have been updated. Ensure you use Rev 2.1 for your submissions.", replies: 3, time: "2h ago", isOfficial: true }
                        ].map((post, i) => (
                           <div key={i} className={`p-8 rounded-[40px] border shadow-sm flex flex-col gap-6 ${post.isOfficial ? 'bg-indigo-50/30 border-indigo-100 shadow-indigo-100/20' : 'bg-white border-slate-200'}`}>
                              <div className="flex items-start justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black shadow-md ${post.isOfficial ? 'bg-indigo-600' : 'bg-slate-900'}`}>
                                       {post.user.charAt(0)}
                                    </div>
                                    <div>
                                       <div className="flex items-center gap-2">
                                          <h5 className="text-[16px] font-black text-slate-800">{post.user}</h5>
                                          {post.isOfficial && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                                       </div>
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{post.role} • {post.time}</span>
                                    </div>
                                 </div>
                              </div>
                              <p className="text-[15px] text-slate-600 font-medium leading-relaxed italic">{post.msg}</p>
                              <div className="flex items-center gap-6 pt-4 border-t border-slate-100/50">
                                 <button className="flex items-center gap-2 text-[12px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
                                    <MessageSquare className="w-4 h-4" /> {post.replies} Scholarly Replies
                                 </button>
                                 <button className="flex items-center gap-2 text-[12px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-colors">
                                    <Share2 className="w-4 h-4" /> Reference
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {currentTab === 'attendance' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 bg-white p-8 rounded-[40px] border border-slate-200 shadow-premium flex flex-col items-center justify-center text-center">
                           <div className="w-32 h-32 rounded-full border-8 border-slate-50 flex items-center justify-center mb-6 relative">
                              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                 <circle className="text-indigo-500" strokeWidth="8" strokeDasharray="301.59" strokeDashoffset={301.59 - (301.59 * 0.94)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="48" cx="64" cy="64" />
                              </svg>
                              <span className="text-3xl font-black text-slate-800">94%</span>
                           </div>
                           <h4 className="text-[18px] font-black text-slate-800 tracking-tight">Institutional Attendance</h4>
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Onusandhan Global Standard: 75%</p>
                        </div>

                        <div className="md:col-span-2 bg-white p-8 rounded-[40px] border border-slate-200 shadow-premium">
                           <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Attendance Narrative</h4>
                           <div className="space-y-6">
                              {[
                                 { period: "This Academic Quarter", value: "28 / 30 Classes", status: "Exceptional" },
                                 { period: "Live Lab Participation", value: "100%", status: "Ideal" },
                                 { period: "Submission Timeliness", value: "98.5%", status: "High Honor" }
                              ].map((item, i) => (
                                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div>
                                       <p className="text-[14px] font-black text-slate-800">{item.period}</p>
                                       <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">{item.status}</span>
                                    </div>
                                    <p className="text-[18px] font-black text-slate-800">{item.value}</p>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {currentTab === 'results' && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-xl relative overflow-hidden">
                           <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 blur-3xl rounded-full translate-x-12 translate-y-12"></div>
                           <h2 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-6">Final Academic Standing</h2>
                           <div className="flex items-center gap-10">
                              <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-4xl font-black shadow-xl shadow-indigo-500/30">
                                 A+
                              </div>
                              <div>
                                 <h3 className="text-4xl font-black tracking-tight">First Class with Distinction</h3>
                                 <p className="text-slate-400 font-bold uppercase tracking-widest mt-2">Scholarship Eligible</p>
                              </div>
                           </div>
                           <div className="mt-12 flex flex-wrap gap-4">
                              <Button className="h-12 px-8 bg-white text-slate-900 rounded-2xl font-black text-[11px] tracking-widest uppercase flex items-center gap-3 shadow-lg">
                                 DOWNLOAD AUDIT REPORT <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" className="h-12 px-8 border-white/20 text-white hover:bg-white/10 rounded-2xl font-black text-[11px] tracking-widest uppercase">
                                 SHARE ON PORTFOLIO
                              </Button>
                           </div>
                        </div>

                        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-premium">
                           <h3 className="text-[18px] font-black text-slate-800 mb-8 flex items-center gap-3">
                              <BarChart3 className="w-5 h-5 text-indigo-600" /> Performance Analytics
                           </h3>
                           <div className="space-y-8">
                              {[
                                 { label: "Assignment Integrity", value: 98 },
                                 { label: "Quiz Calibration", value: 92 },
                                 { label: "Research Synthesis", value: 85 }
                              ].map((bar, i) => (
                                 <div key={i} className="space-y-3">
                                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                                       <span>{bar.label}</span>
                                       <span className="text-slate-800">{bar.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                       <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${bar.value}%` }}></div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>

         {/* 4. Side Support / Progress Visualization */}
         <div className="w-full xl:w-[360px] space-y-8">
            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-premium sticky top-[90px]">
               <h3 className="text-[18px] font-black text-slate-800 mb-8 border-b border-slate-100 pb-4">{t('lms_your_learning')}</h3>
               
               <div className="space-y-10">
                  {[
                    { label: t('lms_lessons'), value: "12 / 32", icon: PlayCircle, color: "text-indigo-600" },
                    { label: t('lms_assignments'), value: "4 / 8", icon: FileText, color: "text-blue-600" },
                    { label: t('lms_quizzes'), value: "92%", icon: Zap, color: "text-orange-500" },
                  ].map((stat, i) => (
                    <div key={i} className="flex items-start gap-4">
                       <div className={`w-10 h-10 rounded-xl bg-slate-50 ${stat.color} flex items-center justify-center shadow-sm`}>
                          <stat.icon className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">{stat.label}</p>
                          <p className="text-[16px] font-black text-slate-800 mt-0.5">{stat.value}</p>
                       </div>
                    </div>
                  ))}
               </div>
               
               <Button className="w-full h-12 bg-slate-900 hover:bg-black text-white rounded-2xl mt-12 font-black text-[11px] tracking-widest uppercase shadow-xl transition-all">
                  {t('lms_claim_badge')}
               </Button>
            </div>
         </div>
      </div>

    </div>
  );
}

const Users = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
