"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { 
  ArrowLeft, 
  Camera, 
  Mail, 
  MapPin, 
  Save,
  Loader2,
  User
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function StudentProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  
  const [initialized, setInitialized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Hardcoded universities for faster user experience - validation happens in API
  const universities = [
    { 
      id: "f4315493-dff0-429f-9bb8-218532b2bbd2", 
      name: "University of Amsterdam"
    },
    { 
      id: "55d6e87b-5bb9-4435-bc4c-bef23bb5227a", 
      name: "Hogeschool van Amsterdam"
    },
    { 
      id: "0cb29ee9-c9cb-45a6-9298-a1985fce5328", 
      name: "Vrije Universiteit Amsterdam"
    },
  ];

  useEffect(() => {
    if (!session && !isPending) {
      router.push('/login');
    }
    if (!initialized && session?.user) {
      // Fetch user data
      fetch('/api/users/?id=' + session.user.id)
        .then(res => res.json())
        .then(async userData => {
          // Process user data
          if (userData.success && userData.data) {
            const user = userData.data;
            const loadedProfile = {
              name: user.name || "",
              email: user.email || "",
              avatar: user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
              location: user.location || "",
              universityId: user.universityId || "",
              major: user.major || "",
            };
            setProfile(loadedProfile);
            setOriginalProfile(loadedProfile);
          } else {
            // Fallback to session data
            setProfile(prev => ({
              ...prev,
              name: session.user.name || "",
              email: session.user.email || "",
              avatar: session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
            }));
          }

          setInitialized(true);
        })
        .catch(err => {
          console.error('Failed to fetch data:', err);
          // Fallback to session data on error
          setProfile(prev => ({
            ...prev,
            name: session.user.name || "",
            email: session.user.email || "",
            avatar: session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
          }));
          setInitialized(true);
        });
    }
  }, [session, initialized, router]);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    avatar: "",
    location: "",
    universityId: "",
    major: "",
  });

  const [originalProfile, setOriginalProfile] = useState(profile);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave() {
    setSaving(true);
    
    // Only send fields that changed
    const changes: any = {};
    if (profile.name !== originalProfile.name) changes.name = profile.name;
    if (profile.email !== originalProfile.email) changes.email = profile.email;
    if (profile.avatar !== originalProfile.avatar) changes.image = profile.avatar;
    if (profile.location !== originalProfile.location) changes.location = profile.location;
    if (profile.universityId !== originalProfile.universityId) changes.universityId = profile.universityId;
    if (profile.major !== originalProfile.major) changes.major = profile.major;

    // If nothing changed, just close edit mode
    if (Object.keys(changes).length === 0) {
      setSaving(false);
      setIsEditing(false);
      return;
    }
    
    // Optimistically update UI immediately
    setIsEditing(false);
    
    try {
      const response = await fetch('/api/users/?id=' + session?.user?.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
      });

      if (!response.ok) {
        throw new Error('Failed to save profile');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save profile');
      }

      // Update original profile after successful save
      setOriginalProfile(profile);
      console.log('Profile saved successfully');
      
    } catch (error) {
      console.error('Save failed:', error);
      // Revert optimistic update on error
      setIsEditing(true);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (isPending || !initialized) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      {/* Top Navigation */}
      <div className="mx-auto max-w-6xl mb-8">
        <button 
          className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          onClick={() => router.push('/dashboard')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 group-hover:ring-indigo-500/20 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Back to Dashboard
        </button>
      </div>

      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Identity Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
            {/* Banner Background */}
            <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 opacity-90"></div>
            
            <div className="relative px-6 pb-6">
              {/* Avatar */}
              <div className="relative -mt-16 mb-4 inline-block">
                <Avatar className="h-32 w-32 rounded-2xl border-4 border-white shadow-lg bg-white">
                  <AvatarImage src={profile.avatar} alt={profile.name} className="object-cover" />
                  <AvatarFallback className="text-4xl rounded-2xl">
                    {profile.name.substring(0,2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors cursor-pointer" title="Change Avatar">
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Name & Basic Info */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{profile.email}</span>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{profile.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Student Info Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
             <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-indigo-500" />
                Student Information
             </h3>
             <div className="space-y-3">
               {profile.universityId && (
                 <div>
                   <div className="text-xs text-slate-500">University</div>
                   <div className="text-sm font-medium text-slate-900">{universities.find(u => u.id === profile.universityId)?.name || profile.universityId}</div>
                 </div>
               )}
               {profile.major && (
                 <div>
                   <div className="text-xs text-slate-500">Major</div>
                   <div className="text-sm font-medium text-slate-900">{profile.major}</div>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Form */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
            <div className="border-b border-slate-100 px-8 py-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Profile Settings</h2>
                <p className="text-sm text-slate-500 mt-1">Manage your profile information</p>
              </div>
              {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Edit Profile
                  </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 px-2"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              )}
            </div>

            <div className="p-8 space-y-8">
              
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Your full name"
                  />
                ) : (
                  <div className="px-4 py-2.5 text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-200">
                    {profile.name || "Not provided"}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="your.email@example.com"
                  />
                ) : (
                  <div className="px-4 py-2.5 text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-200">
                    {profile.email}
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                  Location
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g., Amsterdam, Netherlands"
                  />
                ) : (
                  <div className="px-4 py-2.5 text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-200">
                    {profile.location || "Not provided"}
                  </div>
                )}
              </div>

              {/* University */}
              <div className="space-y-2">
                <label htmlFor="university" className="block text-sm font-medium text-slate-700">
                  University
                </label>
                {isEditing ? (
                  <select
                    id="university"
                    name="universityId"
                    value={profile.universityId}
                    onChange={(e) => setProfile(prev => ({ ...prev, universityId: e.target.value }))}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Select a university</option>
                    {universities.map((uni) => (
                      <option key={uni.id} value={uni.id}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2.5 text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-200">
                    {universities.find(u => u.id === profile.universityId)?.name || "Not provided"}
                  </div>
                )}
              </div>

              {/* Major */}
              <div className="space-y-2">
                <label htmlFor="major" className="block text-sm font-medium text-slate-700">
                  Major / Field of Study
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    id="major"
                    name="major"
                    value={profile.major}
                    onChange={handleChange}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="e.g., Computer Science"
                  />
                ) : (
                  <div className="px-4 py-2.5 text-sm text-slate-900 bg-slate-50 rounded-lg border border-slate-200">
                    {profile.major || "Not provided"}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
