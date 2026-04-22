import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useLanguage } from '../App';
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  GraduationCap, BookOpen, Clock, Calendar, 
  ArrowRight, PlayCircle, Star, Target,
  Gamepad2, Lightbulb, Trophy, Award, FileText,
  Search, Filter, Plus, Bell, Activity, ClipboardCheck, 
  HelpCircle, Megaphone, Zap, Download, CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui';
import { 
  CourseCard, Course, Enrollment, AssignmentCard, 
  QuizCard, AttendanceWidget, ActivityItem, ResourceCard,
  UploadBox
} from '../components/lms/LmsComponents';

export default function LmsDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Mock data for Firebase readiness demonstration
  const [assignments] = useState([
    { id: '1', title: 'Research Methodology Basics', course: 'Core Research Hub', dueDate: 'Tomorrow', status: 'Pending' },
    { id: '2', title: 'Data Analysis Techniques', course: 'Advanced Statistics', dueDate: '25th Oct', status: 'Submitted' },
    { id: '3', title: 'Ethics in Academia', course: 'Academic Foundations', dueDate: 'Completed', status: 'Graded' }
  ]);
  
  const [quizzes] = useState([
    { id: 'q1', title: 'Weekly Assessment: R Program', duration: 15, questions: 20, score: 0, status: 'Available' },
    { id: 'q2', title: 'Mid-term: Philosophy of Science', duration: 45, questions: 50, score: 92, status: 'Completed' }
  ]);
  
  const [attendanceData] = useState({
    percentage: 92,
    history: [
      { day: 'M', status: 'present' }, { day: 'T', status: 'present' }, 
      { day: 'W', status: 'absent' }, { day: 'T', status: 'present' }, 
      { day: 'F', status: 'present' }, { day: 'S', status: 'present' }, 
      { day: 'S', status: 'present' }
    ]
  });

  const [announcements] = useState([
    { id: 'a1', title: 'New Semester Schedule Released', date: '2h ago', important: true, sender: 'Admin' },
    { id: 'a2', title: 'Webinar: Publishing in Top Journals', date: 'Yesterday', important: false, sender: 'Dr. Sharma' }
  ]);

  const [resources] = useState([
    { title: 'Guidelines for PhD Thesis', type: 'PDF', size: '2.4MB' },
    { title: 'R Statistics Cheat Sheet', type: 'PDF', size: '1.1MB' },
    { title: 'Course Presentation: Week 4', type: 'PPTX', size: '5.8MB' }
  ]);

  useEffect(() => {
    const fetchLearningData = async () => {
      if (!user) return;
      try {
        const response = await fetch('/api/enrollments', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('onusandhan_token')}` }
        });
        if (response.ok) {
           const data = await response.json();
           setEnrollments(data.map((enr: any) => ({
             ...enr,
             course_data: {
               id: enr.course_id,
               title: enr.course_title,
               description: enr.course_description,
               category: 'Research',
               level: 'PhD',
               instructor_name: 'Dr. Scholar'
             }
           })));
        }
      } catch (error) {
        console.error("Error fetching LMS data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLearningData();
  }, [user]);

  const handleFileUpload = (file: File) => {
    setIsUploading(true);
    let prog = 0;
    const interval = setInterval(() => {
      prog += 10;
      setUploadProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setTimeout(() => {
           setIsUploading(false);
           setUploadProgress(0);
           alert('Assignment uploaded successfully to Firebase Storage (Mocked)');
        }, 500);
      }
    }, 200);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* 1. Welcome Section & Global Progress */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full relative overflow-hidden rounded-[32px] bg-white border border-slate-200 p-8 shadow-premium group">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-50 blur-[100px] -mr-48 -mt-48 rounded-full z-0"></div>
           <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                     Scholar Roadmap
                   </span>
                   <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                     Welcome back, {user?.full_name?.split(' ')[0] || 'Scholar'}.
                   </h1>
                   <p className="text-slate-500 font-medium leading-relaxed">
                     You've completed <span className="text-indigo-600 font-bold">12 lessons</span> this week. Almost reaching your goal!
                   </p>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                   <p className="text-[14px] font-black text-slate-800">Profile Completion</p>
                   <p className="text-2xl font-black text-indigo-600">85%</p>
                   <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-indigo-500 w-[85%] rounded-full"></div>
                   </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                       <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">{enrollments.length}</p>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{t('dash_active_courses')}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                       <Clock className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">18.5h</p>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{t('lms_learning_time')}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                       <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-slate-800">4</p>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{t('lms_badges_earned')}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* 2. Continue Learning Quick Card */}
        <div className="w-full lg:w-[380px] bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[40px] rounded-full -mb-8 -mr-8"></div>
            <div className="relative z-10">
               <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Up Next</span>
                  <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" />
               </div>
               <h3 className="text-xl font-bold mb-1 tracking-tight">Research Methodology</h3>
               <p className="text-slate-400 text-[13px] font-medium mb-6">Lesson 8: Variance Analysis</p>
               
               <div className="flex items-center gap-4 mb-8">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-500 w-[65%] rounded-full shadow-[0_0_12px_rgba(99,102,241,0.5)]"></div>
                  </div>
                  <span className="text-[12px] font-black">65%</span>
               </div>
            </div>
            
            <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 group transition-all relative z-10">
               {t('lms_resume')} <PlayCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
        </div>
      </div>

      {/* 3. Global Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-[24px] border border-slate-200 shadow-sm">
         <div className="flex-1 w-full relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
               type="text" 
               placeholder={t('lms_search')} 
               className="w-full h-12 pl-12 pr-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-[14px] font-medium outline-none transition-all"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
            />
         </div>
         <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="h-12 px-6 border-slate-200 text-slate-600 font-bold gap-2 rounded-xl">
               <Filter className="w-4 h-4" /> {t('btn_filter')}
            </Button>
            <Button className="h-12 px-6 bg-slate-900 hover:bg-black text-white font-bold gap-2 rounded-xl">
               <Plus className="w-4 h-4" /> {t('nav_admin')}
            </Button>
         </div>
      </div>

      {/* 4. Enrolled Courses Grid */}
      <section>
         <div className="flex items-center justify-between mb-6">
            <h2 className="text-[20px] font-bold text-slate-800 tracking-tight flex items-center gap-3">
               <GraduationCap className="w-6 h-6 text-indigo-600" /> {t('dash_enrolled_courses')}
            </h2>
            <button className="text-[13px] font-bold text-indigo-600 hover:underline">{t('lms_browse_catalog')}</button>
         </div>
         
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? [1,2,3,4].map(i => (
              <div key={i} className="aspect-[4/5] bg-white rounded-3xl animate-pulse border border-slate-100 shadow-sm"></div>
            )) : enrollments.length > 0 ? (
               enrollments.filter(e => e.course_data).map(enr => (
                  <CourseCard 
                    key={enr.id} 
                    course={enr.course_data!} 
                    enrollment={enr} 
                    onClick={() => navigate(`/lms/course/${enr.course_id}`)}
                  />
               ))
            ) : (
               <div className="col-span-full py-16 text-center bg-white rounded-[32px] border border-dashed border-slate-300">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">No active enrollments found</p>
               </div>
            )}
         </div>
      </section>

      {/* 5. Split Assessment & Analytics Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         
         <div className="xl:col-span-2 space-y-8">
            {/* Assignments Section */}
            <div className="bg-transparent">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[18px] font-bold text-slate-800 tracking-tight flex items-center gap-3">
                     <ClipboardCheck className="w-6 h-6 text-blue-500" /> {t('assign_tasks')}
                  </h3>
                  <div className="flex gap-2">
                     <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase">3 {t('assign_pending')}</span>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {assignments.map(as => (
                    <AssignmentCard key={as.id} title={as.title} course={as.course} dueDate={as.dueDate} status={as.status} />
                  ))}
               </div>
            </div>

            {/* Quiz & Tests */}
            <div>
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[18px] font-bold text-slate-800 tracking-tight flex items-center gap-3">
                     <Zap className="w-6 h-6 text-orange-500" /> {t('lms_quizzes')}
                  </h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {quizzes.map(q => (
                    <QuizCard key={q.id} {...q} />
                  ))}
               </div>
            </div>

            {/* Study Materials */}
            <div>
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[18px] font-bold text-slate-800 tracking-tight flex items-center gap-3">
                     <FileText className="w-6 h-6 text-emerald-500" /> {t('lms_resources')}
                  </h3>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {resources.map((r, i) => (
                    <ResourceCard key={i} {...r} />
                  ))}
               </div>
            </div>
         </div>

         {/* Right Analytics Sidebar */}
         <div className="space-y-8">
            {/* Attendance Widget */}
            <AttendanceWidget {...attendanceData} />

            {/* Announcements */}
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-premium p-6">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                     <Megaphone className="w-4 h-4 text-indigo-600" /> {t('lbl_notifications')}
                  </h3>
                  <span className="p-1 cursor-pointer hover:bg-slate-50 rounded-lg text-slate-400">
                     <ArrowRight className="w-4 h-4" />
                  </span>
               </div>
               <div className="space-y-5">
                  {announcements.map(ann => (
                    <div key={ann.id} className="relative pl-4 border-l-2 border-indigo-200 group cursor-pointer hover:border-indigo-600 transition-all">
                       {ann.important && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-500 rounded-full"></div>}
                       <h4 className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">{ann.title}</h4>
                       <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{ann.date} • {ann.sender}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="bg-indigo-900 rounded-[24px] p-6 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-32 h-32 bg-white/5 blur-[40px] rounded-full -mt-16 -ml-16"></div>
               <h3 className="text-[16px] font-bold mb-6 flex items-center gap-2 relative z-10">
                  <Activity className="w-4 h-4 text-indigo-400" /> {t('dash_completed_tasks')}
               </h3>
               <div className="space-y-6 relative z-10">
                  <ActivityItem icon={PlayCircle} color="bg-indigo-400" title="Completed Lesson 4" time="20m ago" />
                  <ActivityItem icon={CheckCircle} color="bg-emerald-400" title="Assignment Graduated" time="2h ago" />
                  <ActivityItem icon={Award} color="bg-orange-400" title="Earned Researcher Badge" time="Yesterday" />
               </div>
            </div>

            {/* Upload Box for Quick Submissions */}
            <div className="sticky top-[90px]">
               <UploadBox 
                 onFileSelect={handleFileUpload} 
                 isUploading={isUploading} 
                 progress={uploadProgress} 
               />
            </div>
         </div>
      </div>
      
      {/* 6. Success and Achievements Footer Section */}
      <section className="bg-white rounded-[32px] border border-slate-200 p-10 flex flex-col md:flex-row items-center justify-between shadow-premium gap-8">
         <div className="flex items-center gap-8">
            <div className="w-24 h-24 rounded-full border-4 border-indigo-50 flex items-center justify-center p-2 relative">
               <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin duration-[3s]"></div>
               <div className="w-full h-full bg-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-black">
                   3
               </div>
            </div>
            <div>
               <h4 className="text-xl font-black text-slate-800 mb-1">{t('quiz_completed')}</h4>
               <p className="text-slate-500 font-medium max-w-xs">{t('lms_results')}</p>
            </div>
         </div>
         <Button variant="outline" className="h-12 px-8 border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50 gap-2 rounded-xl">
            {t('lms_results')} <Award className="w-4 h-4" />
         </Button>
      </section>

    </div>
  );
}
