import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { collection, query, getDocs, addDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Library, Plus, Search, Filter, MoreVertical, 
  Users, BookOpen, Clock, Trash2, Edit2, 
  CheckCircle, ChevronLeft, Video, FileText,
  Layout, List, ClipboardCheck, Trash, X
} from 'lucide-react';
import { Button } from '../components/ui';
import { Course } from '../components/lms/LmsComponents';

export default function LmsManagement() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: 'Research',
    level: 'College' as 'School' | 'College' | 'PhD',
    thumbnail_url: ''
  });

  const fetchCourses = async () => {
    try {
      const q = query(collection(db, 'courses'));
      const snap = await getDocs(q);
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Course)));
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await addDoc(collection(db, 'courses'), {
        ...newCourse,
        instructor_id: user.uid,
        instructor_name: user.full_name || 'Admin',
        created_at: Date.now()
      });
      setShowAddModal(false);
      setNewCourse({ title: '', description: '', category: 'Research', level: 'College', thumbnail_url: '' });
      fetchCourses();
    } catch (error) {
       console.error("Error creating course:", error);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm("Are you sure? This will delete the course metadata.")) return;
    try {
      await deleteDoc(doc(db, 'courses', id));
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
    }
  };

  if (editingCourse) {
     return <CourseEditor course={editingCourse} onBack={() => { setEditingCourse(null); fetchCourses(); }} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight flex items-center gap-3">
             <Library className="w-8 h-8 text-indigo-600" /> LMS Management
          </h1>
          <p className="text-slate-500 font-medium text-[15px] mt-1">Design curricula, manage enrollments, and track academic performance.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
             onClick={() => setShowAddModal(true)} 
             className="bg-indigo-600 hover:bg-indigo-700 h-12 px-6 rounded-xl font-bold shadow-lg shadow-indigo-100 flex items-center gap-2"
           >
             <Plus className="w-5 h-5" /> Create Course
           </Button>
        </div>
      </div>

      {/* Analytics Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: "Active Courses", val: courses.length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
           { label: "Total Students", val: "1.2k", icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
           { label: "Completion Rate", val: "78%", icon: CheckCircle, color: "text-indigo-600", bg: "bg-indigo-50" },
           { label: "Active Sessions", val: "24", icon: Clock, color: "text-orange-600", bg: "bg-orange-50" }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                 <stat.icon className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                 <p className="text-2xl font-black text-slate-800 tracking-tight">{stat.val}</p>
              </div>
           </div>
         ))}
      </div>

      {/* Course List */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-premium overflow-hidden">
         <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search courses..." 
                 className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-medium outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all"
               />
            </div>
            <div className="flex items-center gap-3">
               <button className="h-10 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 text-[13px] font-bold text-slate-600 flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filter
               </button>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50/50">
                     <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest">Course Title</th>
                     <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest">Level</th>
                     <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest">Students</th>
                     <th className="px-6 py-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {courses.map(course => (
                     <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-400 border border-indigo-100">
                                 {course.thumbnail_url ? <img src={course.thumbnail_url} className="w-full h-full object-cover" /> : <BookOpen className="w-5 h-5" />}
                              </div>
                              <p className="text-[15px] font-bold text-slate-800">{course.title}</p>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider">{course.level}</span>
                        </td>
                        <td className="px-6 py-5 font-bold text-slate-700">148</td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <button onClick={() => setEditingCourse(course)} className="p-2 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => handleDeleteCourse(course.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* Add Modal (Same as before) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[32px] w-full max-w-xl p-8 shadow-2xl animate-in zoom-in-95">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-[22px] font-bold text-slate-800">Launch New Course</h3>
                <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
             </div>
             <form onSubmit={handleCreateCourse} className="space-y-6">
                <input 
                  type="text" required placeholder="Course Title"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  value={newCourse.title}
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                />
                <select 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 font-bold"
                  value={newCourse.level}
                  onChange={e => setNewCourse({...newCourse, level: e.target.value as any})}
                >
                   <option value="School">School</option>
                   <option value="College">College</option>
                   <option value="PhD">PhD</option>
                </select>
                <textarea 
                  rows={3} 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 outline-none"
                  placeholder="Course Description"
                  value={newCourse.description}
                  onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                />
                <div className="flex gap-4">
                   <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                   <Button type="submit" className="flex-1 bg-indigo-600 text-white">Create Course</Button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseEditor({ course, onBack }: { course: Course, onBack: () => void }) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'lessons' | 'assignments'>('lessons');
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLesson, setNewLesson] = useState({ title: '', content_type: 'Video', content_url: '', order: 1 });

  const fetchContent = async () => {
    const lSnap = await getDocs(query(collection(db, `courses/${course.id}/lessons`), orderBy('order', 'asc')));
    setLessons(lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const aSnap = await getDocs(collection(db, `courses/${course.id}/assignments`));
    setAssignments(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchContent(); }, []);

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, `courses/${course.id}/lessons`), { ...newLesson, order: lessons.length + 1 });
    setShowAddLesson(false);
    setNewLesson({ title: '', content_type: 'Video', content_url: '', order: 1 });
    fetchContent();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
       <button onClick={onBack} className="flex items-center gap-2 text-[14px] font-bold text-slate-500 hover:text-indigo-600">
          <ChevronLeft className="w-4 h-4" /> Back to List
       </button>
       
       <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-premium">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{course.title}</h2>
                <p className="text-slate-500 font-medium">Curriculum Builder & Academic Settings</p>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold h-11"><Layout className="w-4 h-4 mr-2" /> Course Settings</Button>
                <Button className="bg-indigo-600 text-white rounded-xl h-11 px-6 font-bold" onClick={() => setShowAddLesson(true)}><Plus className="w-4 h-4 mr-2" /> Add {activeTab === 'lessons' ? 'Lesson' : 'Assignment'}</Button>
             </div>
          </div>

          <div className="flex gap-8 border-b border-slate-100 mb-8">
             <button onClick={() => setActiveTab('lessons')} className={`pb-4 text-[13px] font-bold uppercase tracking-widest relative ${activeTab === 'lessons' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <div className="flex items-center gap-2"><List className="w-4 h-4" /> Lessons</div>
                {activeTab === 'lessons' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />}
             </button>
             <button onClick={() => setActiveTab('assignments')} className={`pb-4 text-[13px] font-bold uppercase tracking-widest relative ${activeTab === 'assignments' ? 'text-indigo-600' : 'text-slate-400'}`}>
                <div className="flex items-center gap-2"><ClipboardCheck className="w-4 h-4" /> Assignments</div>
                {activeTab === 'assignments' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-full" />}
             </button>
          </div>

          <div className="space-y-3">
             {activeTab === 'lessons' ? (
                lessons.map(l => (
                   <div key={l.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 group">
                      <div className="flex items-center gap-4">
                         <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-500 flex items-center justify-center">
                            {l.content_type === 'Video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                         </div>
                         <p className="text-[14px] font-bold text-slate-700">{l.title}</p>
                      </div>
                      <button onClick={async () => { await deleteDoc(doc(db, `courses/${course.id}/lessons`, l.id)); fetchContent(); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash className="w-4 h-4" /></button>
                   </div>
                ))
             ) : (
                assignments.map(a => (
                   <div key={a.id} className="p-4 rounded-xl border border-slate-100 flex items-center justify-between group">
                      <p className="text-[14px] font-bold text-slate-700">{a.title}</p>
                      <button onClick={async () => { await deleteDoc(doc(db, `courses/${course.id}/assignments`, a.id)); fetchContent(); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash className="w-4 h-4" /></button>
                   </div>
                ))
             )}
          </div>
       </div>

       {showAddLesson && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Add Course Content</h3>
                <form onSubmit={handleAddLesson} className="space-y-4">
                   <input type="text" required placeholder="Content Title" className="w-full rounded-xl border p-3" value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} />
                   <select className="w-full rounded-xl border p-3 font-bold" value={newLesson.content_type} onChange={e => setNewLesson({...newLesson, content_type: e.target.value as any})}>
                      <option value="Video">Video (YouTube)</option>
                      <option value="PDF">PDF Document</option>
                      <option value="Quiz">Interactive Quiz</option>
                   </select>
                   <input type="text" placeholder="Content URL (YouTube or Drive Link)" className="w-full rounded-xl border p-3" value={newLesson.content_url} onChange={e => setNewLesson({...newLesson, content_url: e.target.value})} />
                   <div className="flex gap-4">
                      <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddLesson(false)}>Cancel</Button>
                      <Button type="submit" className="flex-1 bg-indigo-600 text-white">Save Content</Button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </div>
  );
}
