
export type Language = 'en' | 'bn';

export const translations = {
  // Navigation
  nav_dashboard: { en: "Overview", bn: "ড্যাশবোর্ড" },
  nav_lms: { en: "LMS Hub", bn: "এলএমএস হাব" },
  nav_profile: { en: "Profile", bn: "প্রোফাইল" },
  nav_admin: { en: "Admin", bn: "অ্যাডমিন" },
  nav_logout: { en: "Logout", bn: "লগআউট" },
  nav_home: { en: "Home", bn: "হোম" },
  nav_login: { en: "Login", bn: "লগইন" },
  nav_register: { en: "Register", bn: "রেজিস্টার" },

  // Dashboard
  dash_welcome: { en: "Welcome back, Scholar", bn: "স্বাগতম, গবেষক" },
  dash_academic_brief: { en: "Academic Brief", bn: "একাডেমিক বিবরণী" },
  dash_active_courses: { en: "Active Courses", bn: "চলমান কোর্সসমূহ" },
  dash_completed_tasks: { en: "Completed Tasks", bn: "সম্পন্ন কাজ" },
  dash_avg_grade: { en: "Avg. Grade", bn: "গড় গ্রেড" },
  dash_enrolled_courses: { en: "My Enrolled Courses", bn: "আমার ইনরোল করা কোর্সসমূহ" },
  dash_continue_learning: { en: "Continue Learning", bn: "শেখা চালিয়ে যান" },
  dash_no_courses: { en: "No enrolled courses found.", bn: "কোন ইনরোল করা কোর্স পাওয়া যায়নি।" },

  // LMS
  lms_portal: { en: "Scholarly Learning Portal", bn: "শিক্ষা পোর্টাল" },
  lms_available_courses: { en: "Available Courses", bn: "উপলব্ধ কোর্সসমূহ" },
  lms_your_learning: { en: "Your Learning Path", bn: "আপনার শিক্ষা পথ" },
  lms_lessons: { en: "Lessons", bn: "লেসনসমূহ" },
  lms_assignments: { en: "Assignments", bn: "অ্যাসাইনমেন্ট" },
  lms_quizzes: { en: "Quizzes", bn: "কুইজ" },
  lms_resources: { en: "Resources", bn: "রিসোর্স" },
  lms_discussion: { en: "Discussion", bn: "আলোচনা" },
  lms_attendance: { en: "Attendance", bn: "উপস্থিতি" },
  lms_results: { en: "Results", bn: "ফলাফল" },
  lms_start_course: { en: "Start Course", bn: "কোর্স শুরু করুন" },
  lms_resume: { en: "Resume", bn: "আবার শুরু করুন" },
  lms_search: { en: "Search Knowledge", bn: "জ্ঞান অনুসন্ধান করুন" },
  lms_learning_time: { en: "Learning Time", bn: "শিক্ষার সময়" },
  lms_badges_earned: { en: "Badges Earned", bn: "অর্জিত ব্যাজ" },
  lms_claim_badge: { en: "Claim Scholar Badge", bn: "স্কলার ব্যাজ দাবি করুন" },
  course_back_portal: { en: "Back to Research Portal", bn: "রিসার্চ পোর্টালে ফিরে যান" },
  course_overview: { en: "Course Overview", bn: "কোর্স ওভারভিউ" },
  course_mark_done: { en: "Mark as Done", bn: "সম্পন্ন হিসেবে চিহ্নিত করুন" },
  course_resume: { en: "Resume Learning", bn: "পড়া আবার শুরু করুন" },
  quiz_calibration: { en: "Academic Calibration", bn: "একাডেমিক ক্যালিব্রেশন" },
  lms_browse_catalog: { en: "Browse Catalog", bn: "ক্যাটালগ দেখুন" },
  admin_analytics_hub: { en: "LMS Analytics Hub", bn: "এলএমএস এনালিটিক্স হাব" },
  admin_total_scholars: { en: "Total Scholars", bn: "মোট শিক্ষার্থী" },
  admin_course_enrollments: { en: "Course Enrollments", bn: "কোর্স ভর্তি" },
  admin_platform_activity: { en: "Platform Activity", bn: "প্ল্যাটফর্ম অ্যাক্টিভিটি" },
  admin_generate_report: { en: "Generate Report", bn: "রিপোর্ট তৈরি করুন" },
  admin_executive_overview: { en: "Executive Overview", bn: "এক্সিকিউটিভ ওভারভিউ" },

  // Course Detail
  course_curriculum: { en: "Curriculum", bn: "কারিকুলাম" },

  // Assignments
  assign_tasks: { en: "Academic Tasks", bn: "একাডেমিক টাস্কসমূহ" },
  assign_pending: { en: "Pending", bn: "অপেক্ষমাণ" },
  assign_submitted: { en: "Submitted", bn: "জমা দেওয়া হয়েছে" },
  assign_graded: { en: "Graded", bn: "গ্রেড দেওয়া হয়েছে" },
  assign_max_points: { en: "Max Points", bn: "সর্বোচ্চ পয়েন্ট" },
  assign_deadline: { en: "Deadline", bn: "ডেডলাইন" },
  assign_open_portal: { en: "Open Portal", bn: "পোর্টাল খুলুন" },
  assign_upload_work: { en: "Submit Work", bn: "কাজ জমা দিন" },
  assign_inst_brief: { en: "Instructions", bn: "নির্দেশনা" },
  assign_cancel: { en: "Cancel", bn: "বাতিল" },
  assign_submit_btn: { en: "Submit Assignment", bn: "অ্যাসাইনমেন্ট জমা দিন" },

  // Quizzes
  quiz_launch: { en: "Launch Quiz", bn: "কুইজ শুরু করুন" },
  quiz_locked: { en: "Locked", bn: "লক করা" },
  quiz_completed: { en: "Completed", bn: "সম্পন্ন" },
  quiz_passed: { en: "Passed", bn: "উত্তীর্ণ" },
  quiz_score: { en: "Result", bn: "ফলাফল" },

  // General Buttons/Labels
  btn_save: { en: "Save Changes", bn: "পরিবর্তন সংরক্ষণ করুন" },
  btn_delete: { en: "Delete", bn: "মুছে ফেলুন" },
  btn_cancel: { en: "Cancel", bn: "বাতিল করুন" },
  btn_edit: { en: "Edit", bn: "সম্পাদনা করুন" },
  btn_view: { en: "View Details", bn: "বিস্তারিত দেখুন" },
  btn_search: { en: "Search", bn: "অনুসন্ধান করুন" },
  btn_filter: { en: "Filter", bn: "ফিল্টার" },
  lbl_email: { en: "Email Address", bn: "ইমেইল অ্যাড্রেস" },
  lbl_password: { en: "Password", bn: "পাসওয়ার্ড" },
  lbl_fullname: { en: "Full Name", bn: "পুরো নাম" },
  lbl_notifications: { en: "Notifications", bn: "নোটিফিকেশন" },
  lbl_searching: { en: "Searching...", bn: "অনুসন্ধান করা হচ্ছে..." },
  lbl_loading: { en: "Loading scholar assets...", bn: "অ্যাসেট লোড হচ্ছে..." },
  lbl_error: { en: "Academic access restricted", bn: "অ্যাক্সেস সীমাবদ্ধ" },

  // Common Header
  onusandhan_logo: { en: "Onusandhan", bn: "অনুসন্ধান" },

  // Hero Section
  hero_audience: { en: "For Academic centre, Institution, Students, Research Scholars & Authors", bn: "একাডেমিক সেন্টার, প্রতিষ্ঠান, শিক্ষার্থী, গবেষক ও লেখকদের জন্য" },
  hero_secure_academic: { en: "Secure Academic", bn: "নিরাপদ একাডেমিক" },
  hero_platform: { en: "Platform for Documentation", bn: "ডকুমেন্টেশন প্ল্যাটফর্ম." }
};

export type TranslationKey = keyof typeof translations;
