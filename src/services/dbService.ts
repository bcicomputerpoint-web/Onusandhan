import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  addDoc,
  serverTimestamp,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Helper to convert Firestore dates to strings for JSON responses
const formatData = (data: any) => {
  if (!data) return data;
  const formatted = { ...data };
  for (const key in formatted) {
    if (formatted[key] instanceof Timestamp) {
      formatted[key] = formatted[key].toDate().toISOString();
    }
  }
  return formatted;
};

export const dbService = {
  // Users
  async getUserByEmail(email: string): Promise<any> {
    const q = query(collection(db, 'users'), where('email', '==', email), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  },

  async createUser(userData: any): Promise<any> {
    const userRef = doc(collection(db, 'users'));
    const data = {
      ...userData,
      created_at: serverTimestamp()
    };
    await setDoc(userRef, data);
    return { id: userRef.id, ...data };
  },

  // Profiles
  async getProfileByUserId(userId: string) {
    const q = query(collection(db, 'profiles'), where('user_id', '==', userId), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...formatData(docSnap.data()) };
  },

  async updateProfile(userId: string, profileData: any) {
    const existing = await this.getProfileByUserId(userId);
    if (existing) {
      const docRef = doc(db, 'profiles', existing.id);
      await updateDoc(docRef, { ...profileData, updated_at: serverTimestamp() });
    } else {
      await addDoc(collection(db, 'profiles'), {
        user_id: userId,
        ...profileData,
        created_at: serverTimestamp()
      });
    }
  },

  // Drive
  async getDriveItems(userId: string) {
    const q = query(
      collection(db, 'drive_items'), 
      where('user_id', '==', userId), 
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...formatData(d.data()) }));
  },

  async addDriveItem(itemData: any) {
    const data = {
      ...itemData,
      created_at: serverTimestamp()
    };
    const res = await addDoc(collection(db, 'drive_items'), data);
    return { id: res.id, ...data };
  },

  async getDriveItem(itemId: string) {
    const docSnap = await getDoc(doc(db, 'drive_items', itemId));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...formatData(docSnap.data()) };
  },

  async deleteDriveItem(itemId: string) {
    await deleteDoc(doc(db, 'drive_items', itemId));
  },

  // LMS - Courses
  async getCourses() {
    const q = query(collection(db, 'courses'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const courses = snapshot.docs.map(d => ({ id: d.id, ...formatData(d.data()) }));
    
    // Enrich with instructor info and student counts (Note: In production this should be a cloud function or cached)
    for (const c of courses) {
      const profile = await this.getProfileByUserId(c.instructor_id);
      c.instructor_name = profile?.full_name || 'Unknown';
      
      const enrollQ = query(collection(db, 'enrollments'), where('course_id', '==', c.id));
      const enrollSnap = await getDocs(enrollQ);
      c.student_count = enrollSnap.size;
    }
    return courses;
  },

  async addCourse(courseData: any) {
    const data = {
      ...courseData,
      created_at: serverTimestamp()
    };
    const res = await addDoc(collection(db, 'courses'), data);
    return { id: res.id };
  },

  async getCourseDetails(courseId: string) {
    const courseSnap = await getDoc(doc(db, 'courses', courseId));
    if (!courseSnap.exists()) return null;
    
    const lessonsQ = query(collection(db, 'lessons'), where('course_id', '==', courseId), orderBy('order_index', 'asc'));
    const lessonsSnap = await getDocs(lessonsQ);
    
    const assignmentsQ = query(collection(db, 'assignments'), where('course_id', '==', courseId));
    const assignmentsSnap = await getDocs(assignmentsQ);
    
    return {
      id: courseSnap.id,
      ...formatData(courseSnap.data()),
      lessons: lessonsSnap.docs.map(d => ({ id: d.id, ...formatData(d.data()) })),
      assignments: assignmentsSnap.docs.map(d => ({ id: d.id, ...formatData(d.data()) }))
    };
  },

  // LMS - Enrollments
  async getEnrollments(userId: string) {
    const q = query(collection(db, 'enrollments'), where('user_id', '==', userId), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const enrollments = snapshot.docs.map(d => ({ id: d.id, ...formatData(d.data()) }));
    
    for (const e of enrollments) {
      const courseSnap = await getDoc(doc(db, 'courses', e.course_id));
      if (courseSnap.exists()) {
        const cData = courseSnap.data();
        e.course_title = cData?.title;
        e.course_description = cData?.description;
      }
    }
    return enrollments;
  },

  async enrollUser(userId: string, courseId: string) {
    const q = query(collection(db, 'enrollments'), where('user_id', '==', userId), where('course_id', '==', courseId));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) return { message: 'Already enrolled' };
    
    const res = await addDoc(collection(db, 'enrollments'), {
      user_id: userId,
      course_id: courseId,
      created_at: serverTimestamp()
    });
    return { id: res.id };
  },

  // Stats
  async getStats() {
    const usersSnap = await getDocs(collection(db, 'users'));
    const driveSnap = await getDocs(query(collection(db, 'drive_items'), where('item_type', '==', 'Document')));
    const recentUsersQ = query(collection(db, 'users'), orderBy('created_at', 'desc'), limit(10));
    const recentUsersSnap = await getDocs(recentUsersQ);
    
    const recentUsers = [];
    for (const d of recentUsersSnap.docs) {
      const profile = await this.getProfileByUserId(d.id);
      recentUsers.push({
        id: d.id,
        ...formatData(d.data()),
        full_name: profile?.full_name || 'N/A'
      });
    }

    return {
      totalUsers: usersSnap.size,
      totalDocs: driveSnap.size,
      recentUsers
    };
  }
};
