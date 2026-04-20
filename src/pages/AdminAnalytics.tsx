import React, { useState } from 'react';
import { 
  Users, BookOpen, Clock, FileText, CheckCircle, 
  BarChart3, Calendar, Filter, Download, 
  ArrowRight, Search, Activity, GraduationCap,
  Zap, Award, AlertCircle, Bookmark, Share2
} from 'lucide-react';
import { 
  AnalyticsKpiCard, TrendChartCard, CoursePerformanceCard, 
  RecentAlertsPanel, AdminReportTable 
} from '../components/admin/AnalyticsComponents';
import { Button } from '../components/ui';
import { useLanguage } from '../App';

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('This Month');
  const { t } = useLanguage();

  // Multi-module Analytics Data (Structured for Firebase integration)
  const growthData = [
    { name: 'Week 1', students: 45, enrollments: 120 },
    { name: 'Week 2', students: 52, enrollments: 145 },
    { name: 'Week 3', students: 48, enrollments: 132 },
    { name: 'Week 4', students: 61, enrollments: 180 },
    { name: 'Week 5', students: 55, enrollments: 165 },
    { name: 'Week 6', students: 78, enrollments: 210 },
    { name: 'Week 7', students: 82, enrollments: 245 },
  ];

  const courseEngagement = [
    { name: 'Thesis Hub', students: 120 },
    { name: 'Adv Research', students: 95 },
    { name: 'Stat Science', students: 88 },
    { name: 'Ethics 101', students: 72 },
    { name: 'R Program', students: 64 },
  ];

  const recentAlerts = [
    { type: 'attendance', title: 'Low Attendance Alert', description: '5 Scholars in PhD Thesis Hub fell below 75% attendance this week.', priority: 'high' },
    { type: 'assignment', title: 'Grading Backlog', description: '32 Research Methodology assignments are pending review for over 48h.', priority: 'medium' },
    { type: 'activity', title: 'Low Activity Course', description: 'Course "Ethics in Academia" has seen a 40% drop in login activity.', priority: 'low' },
  ];

  const studentPerformance = [
    { name: 'Rahul Sharma', course: 'PhD Workshop', progress: '92%', grade: 'A+', attendance: '98%' },
    { name: 'Sneha Verma', course: 'Adv Statistics', progress: '85%', grade: 'A', attendance: '95%' },
    { name: 'Aman Deep', course: 'R Programming', progress: '62%', grade: 'B', attendance: '82%' },
    { name: 'Priya Das', course: 'Thesis Writing', progress: '78%', grade: 'A-', attendance: '88%' },
    { name: 'Arjun Singh', course: 'Logic & Bio', progress: '45%', grade: 'C+', attendance: '74%' },
  ];

  const tabs = [
    { id: 'overview', name: t('admin_executive_overview'), icon: BarChart3 },
    { id: 'learning', name: t('lms_lessons'), icon: GraduationCap },
    { id: 'assessments', name: t('lms_quizzes'), icon: Zap },
    { id: 'resources', name: t('lms_resources'), icon: Bookmark },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* 1. Dashboard Header & Global Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
         <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{t('admin_analytics_hub')}</h1>
            <p className="text-slate-500 font-medium mt-1">Institutional overview for Onusandhan Academy</p>
         </div>
         <div className="flex flex-wrap gap-3">
            <div className="relative group">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
               </div>
               <select 
                 className="pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500/20"
                 value={dateRange}
                 onChange={(e) => setDateRange(e.target.value)}
               >
                 <option>Today</option>
                 <option>Last 7 Days</option>
                 <option>This Month</option>
                 <option>Last Quarter</option>
                 <option>Year to Date</option>
               </select>
               <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Download className="w-3.5 h-3.5" />
               </div>
            </div>
            <Button className="bg-slate-900 border-none text-white h-[42px] px-6 rounded-xl font-bold gap-2">
               {t('admin_generate_report')} <Share2 className="w-4 h-4 opacity-70" />
            </Button>
         </div>
      </div>

      {/* 2. Top-Level KPI Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <AnalyticsKpiCard 
           title={t('admin_total_scholars')} 
           value="1,280" 
           trend={12.5} 
           icon={Users} 
           description="Joined since last month" 
           color="indigo"
         />
         <AnalyticsKpiCard 
           title={t('admin_course_enrollments')} 
           value="4,520" 
           trend={8.2} 
           icon={BookOpen} 
           description="New admissions this period" 
           color="blue"
         />
         <AnalyticsKpiCard 
           title={t('lms_results')} 
           value="94.2%" 
           trend={2.4} 
           icon={CheckCircle} 
           description="Assignments graded A or above" 
           color="emerald"
         />
         <AnalyticsKpiCard 
           title={t('admin_platform_activity')} 
           value="820" 
           trend={-5.1} 
           icon={Activity} 
           description="Daily Average Active Users" 
           color="orange"
         />
      </div>

      {/* 3. Analytics Module Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl w-fit">
         {tabs.map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`px-6 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 transition-all ${
               activeTab === tab.id 
               ? 'bg-white text-indigo-600 shadow-sm' 
               : 'text-slate-500 hover:text-slate-800'
             }`}
           >
             <tab.icon className="w-4 h-4" />
             {tab.name}
           </button>
         ))}
      </div>

      {/* 4. Main Analytics Canvas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         
         {/* Center/Left: Primary Data Visuals */}
         <div className="xl:col-span-2 space-y-8">
            <TrendChartCard 
               title="Scholar Growth & Enrollment" 
               data={growthData} 
               dataKey="students"
               color="#6366f1"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <CoursePerformanceCard 
                  title="Course Popularity" 
                  data={courseEngagement}
               />
               <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-premium flex flex-col justify-center items-center text-center">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                     <Award className="w-10 h-10" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-800 mb-2">452</h3>
                  <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest mb-6">Certificates Issued</p>
                  <Button variant="outline" className="w-full border-slate-200 text-slate-600 rounded-xl h-12 font-bold">
                     Verify Certificates
                  </Button>
               </div>
            </div>

            {/* Detailed Table (Firebase Ready) */}
            <AdminReportTable 
               title="Scholar Performance Index" 
               columns={['Scholar Name', 'Primary Course', 'Progress', 'Est. Grade', 'Attendance']}
               data={studentPerformance}
            />
         </div>

         {/* Right: Operational Insights */}
         <div className="space-y-8">
            <RecentAlertsPanel alerts={recentAlerts} />

            {/* Document Ecosystem Overview */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/20 blur-[60px] rounded-full -mt-20 -mr-20"></div>
               <h3 className="text-[17px] font-bold mb-6 flex items-center gap-2 relative z-10">
                  <FileText className="w-5 h-5 text-indigo-400" /> Resource Activity
               </h3>
               <div className="space-y-6 relative z-10">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                           <Download className="w-4 h-4" />
                        </div>
                        <span className="text-[13px] font-bold uppercase tracking-tight">Downloads</span>
                     </div>
                     <span className="font-black text-xl">1.2k</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-300">
                           <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-[13px] font-bold uppercase tracking-tight">New Uploads</span>
                     </div>
                     <span className="font-black text-xl">84</span>
                  </div>
               </div>
               <div className="mt-8 pt-8 border-t border-white/10 text-center relative z-10">
                  <p className="text-slate-400 text-[13px] font-medium mb-4 italic">Total Library Size: 4.2 GB</p>
                  <button className="text-[12px] font-bold text-indigo-400 hover:text-white transition-colors flex items-center gap-1 mx-auto">
                     Go to Document Center <ArrowRight className="w-3.5 h-3.5" />
                  </button>
               </div>
            </div>

            {/* Attendance Analytics Preview */}
            <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-premium">
               <h3 className="text-[16px] font-bold text-slate-800 mb-6">Attendance Trend</h3>
               <div className="flex items-end gap-1 h-32 mb-6">
                  {[40, 70, 45, 90, 65, 30, 20, 80, 55, 95].map((h, i) => (
                    <div key={i} className="flex-1 bg-slate-50 rounded-lg relative overflow-hidden group">
                       <div 
                         className="absolute bottom-0 left-0 w-full bg-emerald-400 transition-all duration-700 group-hover:bg-emerald-500" 
                         style={{ height: `${h}%` }}
                       ></div>
                    </div>
                  ))}
               </div>
               <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <span>Week 01</span>
                  <span>Week 10</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
