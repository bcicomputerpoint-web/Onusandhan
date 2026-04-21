import React, { useState } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ isOpen, onClose }: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    contact_number: '',
    email: '',
    user_type: 'Student',
    query_text: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Auto-generate a secure random ID
      const queryId = 'qk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
      
      const payload = {
        name: formData.name,
        contact_number: formData.contact_number,
        email: formData.email,
        user_type: formData.user_type,
        query_text: formData.query_text,
        status: 'Pending',
        created_at: Date.now()
      };

      await setDoc(doc(db, 'booking_queries', queryId), payload);
      
      setIsSuccess(true);
      // Wait for user to either click WhatsApp or close manually.
    } catch (err: any) {
      console.error("Booking submit error:", err);
      setError("Failed to submit your query. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSuccess) {
      setIsSuccess(false);
      setFormData({ name: '', contact_number: '', email: '', user_type: 'Student', query_text: '' });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">Book a Session</h3>
            <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors focus:outline-none">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-extrabold text-slate-800 mb-3 tracking-tight">Query Received!</h4>
              <p className="text-slate-600 max-w-sm mb-8 text-[15px] leading-relaxed">
                Thank you for booking a session. Our team will contact you shortly.
              </p>
              
              <a 
                href={`https://wa.me/919002903128?text=${encodeURIComponent(`Hello Onusandhan team. I just booked a session. My name is ${formData.name}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClose}
                className="w-full flex items-center justify-center gap-2 h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-200"
              >
                <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Send your message to Whatsapp
              </a>
              
              <button 
                onClick={handleClose} 
                className="mt-4 text-[14px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Close Window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  maxLength={100}
                  className="w-full text-sm rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="Enter your full name"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Contact Number <span className="text-red-500">*</span></label>
                  <input 
                    type="tel" 
                    required 
                    maxLength={20}
                    className="w-full text-sm rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    placeholder="+91 98765 43210"
                    value={formData.contact_number} 
                    onChange={e => setFormData({...formData, contact_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">User Type <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full text-sm rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none"
                    value={formData.user_type} 
                    onChange={e => setFormData({...formData, user_type: e.target.value})}
                  >
                    <option value="Student">Student</option>
                    <option value="Research Scholar">Research Scholar</option>
                    <option value="Academic centre">Academic Centre</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  required 
                  maxLength={100}
                  className="w-full text-sm rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                  placeholder="you@example.com"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Your Query <span className="text-red-500">*</span></label>
                <textarea 
                  required 
                  maxLength={2000}
                  rows={4}
                  className="w-full text-sm rounded-xl border border-slate-200 px-4 py-3 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium resize-none"
                  placeholder="How can we help you?"
                  value={formData.query_text} 
                  onChange={e => setFormData({...formData, query_text: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed text-white rounded-xl font-bold gap-2 shadow-lg shadow-indigo-100 flex items-center justify-center transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Query'}
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="bg-slate-50 border-t border-slate-100 p-4 text-center">
          <a 
            href="https://www.onlineacademy.org.in/our-all-service-link" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[13px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Experience Our service platform to get more
          </a>
        </div>
      </div>
    </div>
  );
}
