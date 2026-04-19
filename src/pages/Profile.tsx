import React, { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Button, Input } from '../components/ui';
import { User, BookOpen, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user, refreshAuth } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.uid) return;
    try {
       const userDoc = await getDoc(doc(db, 'users', user.uid));
       const pDoc = await getDoc(doc(db, `users/${user.uid}/profile`, 'info'));
       if (userDoc.exists() && pDoc.exists()) {
          setProfile({ ...userDoc.data(), ...pDoc.data() });
       } else if (userDoc.exists() && !pDoc.exists()) {
          setProfile({ ...userDoc.data(), full_name: user.email?.split('@')[0] });
       }
    } catch (err) {
       console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.uid) return;
    
    try {
      const pRef = doc(db, `users/${user.uid}/profile`, 'info');
      await setDoc(pRef, {
        full_name: profile.full_name || '',
        institution: profile.institution || '',
        department: profile.department || '',
        research_area: profile.research_area || '',
        orcid: profile.orcid || '',
        bio: profile.bio || '',
        photo_url: profile.photo_url || ''
      }, { merge: true });
      
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
      fetchProfile();
    } catch (err) {
      alert("Failed to update profile.");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;
    
    setIsUploadingPhoto(true);
    try {
      const storageRef = ref(storage, `users/${user.uid}/profile_photos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      const newProfile = { ...profile, photo_url: downloadURL };
      setProfile(newProfile);
      
      const pRef = doc(db, `users/${user.uid}/profile`, 'info');
      await setDoc(pRef, { photo_url: downloadURL }, { merge: true });
      
      if (refreshAuth) await refreshAuth();
    } catch (err: any) {
      console.error(err);
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (!profile) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-indigo-600 relative"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 bg-slate-50 rounded-xl shadow-md border-4 border-white flex items-center justify-center text-indigo-600 relative overflow-hidden group">
              {profile.photo_url ? (
                <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10" />
              )}
              {isEditing && (
                <label className={`absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity ${isUploadingPhoto ? 'opacity-100' : ''}`}>
                   <span className="text-xs font-semibold">{isUploadingPhoto ? 'Uploading...' : 'Upload'}</span>
                   <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
                </label>
              )}
            </div>
            <div>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
              )}
            </div>
          </div>

          {saved && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 rounded-lg mb-6">
              <CheckCircle className="w-5 h-5" /> Profile updated successfully.
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input value={profile.full_name || ''} onChange={e => setProfile({...profile, full_name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Input value={profile.role} disabled className="bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Institution</label>
                  <Input value={profile.institution || ''} onChange={e => setProfile({...profile, institution: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <Input value={profile.department || ''} onChange={e => setProfile({...profile, department: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Research Area</label>
                  <Input value={profile.research_area || ''} onChange={e => setProfile({...profile, research_area: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ORCID / Google Scholar Link</label>
                  <Input value={profile.orcid || ''} onChange={e => setProfile({...profile, orcid: e.target.value})} />
                </div>
                <div className="col-span-full">
                  <label className="block text-sm font-medium mb-1">Short Bio</label>
                  <textarea 
                    className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    rows={4} 
                    value={profile.bio || ''} 
                    onChange={e => setProfile({...profile, bio: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => {setIsEditing(false); fetchProfile();}}>Cancel</Button>
                <Button type="submit" variant="primary">Save Changes</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{profile.full_name}</h1>
                <p className="text-slate-500 font-medium">{profile.role} • {profile.institution || 'No institution added'}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm text-slate-500 block mb-1">Department</span>
                  <span className="font-medium text-slate-900">{profile.department || '—'}</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm text-slate-500 block mb-1">Research Area</span>
                  <span className="font-medium text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    {profile.research_area || '—'}
                  </span>
                </div>
              </div>

              {profile.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-slate-600 leading-relaxed">{profile.bio}</p>
                </div>
              )}
              
              {profile.orcid && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Academic Profiles</h3>
                  <a href={profile.orcid} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{profile.orcid}</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
