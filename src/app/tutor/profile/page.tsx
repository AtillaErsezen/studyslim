"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// Changed from @/lib... to relative path assuming this file is in app/profile/ or similar depth
import { useSession } from "@/lib/auth-client";
import { 
  ArrowLeft, 
  Camera, 
  Mail, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle2, 
  Save,
  BookOpen,
  DollarSign,
  Globe,
  Loader2
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export default function TutorProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  
  const [initialized, setInitialized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [removeCourses, setRemoveCourses] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    // if not authenticated, redirect to login
    //ensure session is loaded and still undefined
    if (!session && !isPending) {
      router.push('/login');
      return;
    }
    
    // TODO: add middleware to protect tutor routes
    //FIXME: remove ! from initialized
    if (!initialized && session?.user) {
      // Now safe to fetch tutor data
      fetch("/api/tutors?user_id=" + session.user.id).then(res => res.json())
        .then(async (tutorData) => {
          // hardcoded for faster user experience - validation happens in api
          const hardcodedUniversities = [
            { 
              id: "f4315493-dff0-429f-9bb8-218532b2bbd2", 
              name: "University of Amsterdam", 
              shortName: "UvA",
              city: "Amsterdam",
              country: "Netherlands"
            },
            { 
              id: "55d6e87b-5bb9-4435-bc4c-bef23bb5227a", 
              name: "Hogeschool van Amsterdam", 
              shortName: "HvA",
              city: "Amsterdam",
              country: "Netherlands"
            },
            { 
              id: "0cb29ee9-c9cb-45a6-9298-a1985fce5328", 
              name: "Vrije Universiteit Amsterdam", 
              shortName: "VU",
              city: "Amsterdam",
              country: "Netherlands"
            },
          ];
          setUniversities(hardcodedUniversities);

          // hardcoded for faster user experience - validation happens in api
          const hardcodedCourses = [
            { id: "0908d392-bf18-4608-9790-566dccfb9067", name: "Physics I" },
            { id: "9dfd5e9c-c4ac-400f-b184-a286934ac259", name: "Linear Algebra" },
            { id: "cd8985c1-76f4-4ba6-82af-16b98c4d4d95", name: "Data Structures" },
          ];
          setCourses(hardcodedCourses);

          // Process tutor data
          if (tutorData.success && tutorData.data.length > 0) {
            const tutor = tutorData.data[0];
            
            // Fetch subjects from tutor_courses table (single source of truth)
            let subjects: string[] = [];
            try {
              const tutorCoursesRes = await fetch("/api/tutor_courses?tutor_id=" + tutor.id);
              const tutorCoursesData = await tutorCoursesRes.json();
              if (tutorCoursesData.success && tutorCoursesData.data) {
                subjects = tutorCoursesData.data.map((tc: any) => tc.courses.name);
              }
            } catch (err) {
              console.error("Failed to fetch tutor courses:", err);
            }
            
            const loadedProfile = {
              name: tutor.name || session.user.name || "",
              email: tutor.email || session.user.email || "",
              avatar: tutor.image || session.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
              location: tutor.location || "",
              universityId: tutor.universityId || "",
              bio: tutor.bio || "",
              subjects: subjects,
              languages: tutor.languages || [],
              hourlyRate: tutor.hourlyRate?.toString() || "",
              rating: tutor.ratingAvg || 0,
              reviews: tutor.reviewCount || 0,
              students: 0,
              verified: tutor.verified || false
            };
            setProfile(loadedProfile);
            setOriginalProfile(loadedProfile);
          }

          setInitialized(true);
        })
        .catch(err => {
          console.error("Failed to fetch data:", err);
          setInitialized(true);
        });
    }
  }, [session, initialized, router]
  )

  // Initial state matches your schema structure
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    avatar: "",
    bio: "",
    subjects: [] as string[],
    languages: [] as string[],
    hourlyRate: "",
    location: "",
    universityId: "",
    rating: 0, 
    reviews: 0, 
    students: 0, 
    verified: false 
  });

  const [originalProfile, setOriginalProfile] = useState(profile);

  // Generic handler for text inputs
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  }

  // Handle location change
  function handleLocationChange(e: React.ChangeEvent<HTMLInputElement>) {
    setProfile((prev) => ({ ...prev, location: e.target.value }));
  }

  // Specific handler for subjects (adding new ones)
  function addSubject(subject: string) {
    if (subject && !profile.subjects.includes(subject)) {
      setProfile(prev => ({...prev, subjects: [...prev.subjects, subject]}));
    }
  }

  // Remove subject
  function removeSubject(subjectToRemove: string) {
    setProfile(prev => ({
      ...prev, 
      subjects: prev.subjects.filter(s => s !== subjectToRemove)
    }));
    
    // Find the course object and add to removeCourses list
    const courseToRemove = courses.find(c => c.name === subjectToRemove);
    if (courseToRemove && !removeCourses.some(rc => rc.id === courseToRemove.id)) {
      setRemoveCourses(prev => [...prev, courseToRemove]);
    }
  }

  // Add language from dropdown
  function addLanguage(language: string) {
    if (language && !profile.languages.includes(language)) {
      setProfile(prev => ({...prev, languages: [...prev.languages, language]}));
    }
  }

  // Remove language
  function removeLanguage(languageToRemove: string) {
    setProfile(prev => ({
      ...prev, 
      languages: prev.languages.filter(l => l !== languageToRemove)
    }));
  }

  async function handleSave() {
    setSaving(true);
    
    // Build changes objects - only send what changed
    const userChanges: any = {};
    if (profile.name !== originalProfile.name) userChanges.name = profile.name;
    if (profile.email !== originalProfile.email) userChanges.email = profile.email;
    if (profile.location !== originalProfile.location) userChanges.location = profile.location;

    const tutorChanges: any = {};
    if (profile.universityId !== originalProfile.universityId) tutorChanges.universityId = profile.universityId;
    if (profile.bio !== originalProfile.bio) tutorChanges.bio = profile.bio;
    if (JSON.stringify(profile.subjects) !== JSON.stringify(originalProfile.subjects)) tutorChanges.courseTags = profile.subjects;
    if (JSON.stringify(profile.languages) !== JSON.stringify(originalProfile.languages)) tutorChanges.languages = profile.languages;
    if (profile.hourlyRate !== originalProfile.hourlyRate) tutorChanges.hourlyRate = parseFloat(profile.hourlyRate);
    if (profile.location !== originalProfile.location) tutorChanges.location = profile.location;

    // If nothing changed, just close edit mode
    if (Object.keys(userChanges).length === 0 && Object.keys(tutorChanges).length === 0) {
      setSaving(false);
      setIsEditing(false);
      return;
    }

    // Optimistically update UI immediately (faster perceived performance)
    setIsEditing(false);
    
    try {
      // Send both requests in parallel
      const promises = [];
      
      if (Object.keys(userChanges).length > 0) {
        promises.push(
          fetch("/api/users?id=" + session?.user.id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userChanges),
          })
        );
      }

      if (Object.keys(tutorChanges).length > 0) {
        promises.push(
          fetch("/api/tutors?user_id=" + session?.user.id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tutorChanges),
          })
        );
      }

      // Wait for user and tutor updates to complete
      await Promise.all(promises);
      // TODO: Error in language update (add course -> delete and add another one -> alert shown -> change saved locally but not updated in create booking panel (updated in tutors table, not in tutor_courses))
      // Update tutor_courses if courseTags changed (must happen after tutor update)
      if (tutorChanges.courseTags) {
        // Fetch tutor_id and existing courses
        const tutorResponse = await fetch('/api/tutors?user_id=' + session?.user.id).then(res => res.json());
        
        if (!tutorResponse.success || !tutorResponse.data?.[0]) {
          throw new Error('Failed to fetch tutor data');
        }
        
        const tutor_id = tutorResponse.data[0].tutor_id;
        const tutor_courses_response = await fetch('/api/tutor_courses?tutor_id=' + tutor_id).then(res => res.json());
        const tutor_courses_data = tutor_courses_response.data || [];
        
        // Extract existing course names from database
        const existingCourseNames = new Set(tutor_courses_data.map((tc: any) => tc.courses.name));
        
        // Create a map of course name to course ID from the courses state
        const courseNameToId = new Map(
          courses.map(course => [course.name, course.id])
        );
        console.log("Course Name to ID Map:", courseNameToId);
        // Get the new course names from changes
        const newCourseNames = new Set(tutorChanges.courseTags);
        
        // Find courses to add (in new list but not in DB)
        const coursesToAdd = tutorChanges.courseTags.filter(
          (courseName: string) => !existingCourseNames.has(courseName)
        );
        console.log("Courses to Add:", coursesToAdd);
        
        // Execute additions and deletions in parallel
        const courseUpdatePromises = [];
        
        // Add new courses
        for (const courseName of coursesToAdd) {
          const courseId = courseNameToId.get(courseName);
          if (courseId) {
            courseUpdatePromises.push(
              fetch('/api/tutor_courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  course_id: courseId,
                  experience_level: 'beginner' // default value
                }),
              }).then(async (res) => {
                const data = await res.json();
                if (!data.success) {
                  throw new Error(`Failed to add course ${courseName}: ${data.error}`);
                }
                return data;
              })
            );
          } else {
            console.warn(`Course ID not found for: ${courseName}`);
          }
        }
        
        // Remove old courses
        for (const course of removeCourses) {
          courseUpdatePromises.push(
            fetch(`/api/tutor_courses?course_id=${course.id}`, {
              method: 'DELETE',
            }).then(async (res) => {
              const data = await res.json();
              if (!data.success) {
                throw new Error(`Failed to delete course ${course.name}: ${data.error}`);
              }
              return data;
            })
          );
        }
        
        // Wait for all course updates to complete
        const courseResults = await Promise.allSettled(courseUpdatePromises);
        
        // Check for any failures
        const failures = courseResults.filter(result => result.status === 'rejected');
        if (failures.length > 0) {
          console.error('Some course updates failed:', failures);
          throw new Error(`${failures.length} course update(s) failed`);
        }
      }

      // Update original profile after successful save
      setOriginalProfile(profile);
      console.log("Profile saved successfully");
    } catch(error) {
      console.error("Failed to save profile:", error);
      // Revert optimistic update on error
      setProfile(originalProfile);
      setIsEditing(true);
      alert("Failed to save profile. Please try again.");
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
                  {profile.verified && (
                    <CheckCircle2 className="h-5 w-5 text-blue-500 fill-blue-50" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{profile.location || "No location set"}</span>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-semibold text-slate-900">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {profile.rating}
                  </div>
                  <div className="text-xs text-slate-500">Rating</div>
                </div>
                <div className="text-center border-l border-slate-100">
                  <div className="text-sm font-semibold text-slate-900">{profile.reviews}</div>
                  <div className="text-xs text-slate-500">Reviews</div>
                </div>
                <div className="text-center border-l border-slate-100">
                  <div className="text-sm font-semibold text-slate-900">{profile.students}+</div>
                  <div className="text-xs text-slate-500">Students</div>
                </div>
              </div>
            </div>
          </div>

          {/* Availability Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
             <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                Availability Status
             </h3>
             <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 border border-emerald-100">
                <div className="flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-sm font-medium text-emerald-700">Available for new students</span>
                </div>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Edit Form */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-900/5">
            <div className="border-b border-slate-100 px-8 py-6 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Profile Settings</h2>
                <p className="text-sm text-slate-500 mt-1">Manage your public profile information</p>
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
                    {saving ? (
                        <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                        </>
                    ) : (
                        <>
                        <Save className="h-4 w-4" />
                        Save Changes
                        </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="p-8 space-y-8">
              
              {/* Full Name */}
              <div className="grid grid-cols-1 gap-y-2 md:grid-cols-4 md:gap-x-8">
                <div className="md:col-span-1">
                  <label className="text-sm font-medium text-slate-900">Display Name</label>
                  <p className="text-xs text-slate-500 mt-1">How you appear to students.</p>
                </div>
                <div className="md:col-span-3">
                  <input 
                    type="text" 
                    name="name"
                    disabled={!isEditing}
                    value={profile.name}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Email */}
              <div className="grid grid-cols-1 gap-y-2 md:grid-cols-4 md:gap-x-8">
                <div className="md:col-span-1">
                  <label className="text-sm font-medium text-slate-900">Email Address</label>
                  <p className="text-xs text-slate-500 mt-1">Your contact email.</p>
                </div>
                <div className="md:col-span-3">
                  <input 
                    type="email" 
                    name="email"
                    disabled={!isEditing}
                    value={profile.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Location */}
              <div className="grid grid-cols-1 gap-y-2 md:grid-cols-4 md:gap-x-8">
                <div className="md:col-span-1">
                  <label className="text-sm font-medium text-slate-900">Location</label>
                  <p className="text-xs text-slate-500 mt-1">Where you are based.</p>
                </div>
                <div className="md:col-span-3">
                  <input 
                    type="text" 
                    name="location"
                    disabled={!isEditing}
                    value={profile.location}
                    onChange={handleLocationChange}
                    placeholder="e.g., Amsterdam, Netherlands"
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* University */}
              <div className="grid grid-cols-1 gap-y-2 md:grid-cols-4 md:gap-x-8">
                <div className="md:col-span-1">
                  <label className="text-sm font-medium text-slate-900">University</label>
                  <p className="text-xs text-slate-500 mt-1">Your affiliated university.</p>
                </div>
                <div className="md:col-span-3">
                  <select
                    name="universityId"
                    disabled={!isEditing}
                    value={profile.universityId}
                    onChange={(e) => setProfile(prev => ({ ...prev, universityId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    <option value="">Select a university</option>
                    {universities.map((uni) => (
                      <option key={uni.id} value={uni.id}>
                        {uni.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Bio */}
              <div className="grid grid-cols-1 gap-y-2 md:grid-cols-4 md:gap-x-8">
                <div className="md:col-span-1">
                  <label className="text-sm font-medium text-slate-900">Bio</label>
                  <p className="text-xs text-slate-500 mt-1">Share your experience and teaching style.</p>
                </div>
                <div className="md:col-span-3">
                  <textarea 
                    name="bio"
                    rows={4}
                    disabled={!isEditing}
                    value={profile.bio}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500 resize-none"
                    placeholder="Tell students about yourself..."
                  />
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Subjects */}
              <div className="grid grid-cols-1 gap-y-2 md:grid-cols-4 md:gap-x-8">
                <div className="md:col-span-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <BookOpen className="h-4 w-4 text-slate-400" />
                    Subjects
                  </label>
                </div>
                <div className="md:col-span-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.subjects.map((subject, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                        {subject}
                        {isEditing && (
                            <button 
                              onClick={() => removeSubject(subject)}
                              className="ml-1.5 hover:text-indigo-900"
                            >
                              ×
                            </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {isEditing && (
                    <>
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addSubject(e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="w-full max-w-xs rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2"
                      >
                        <option value="">Add a course...</option>
                        {courses.map((course) => (
                          <option key={course.id} value={course.name}>
                            {course.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500">Students filter tutors by these tags. Make them accurate.</p>
                    </>
                  )}
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Hourly Rate */}
              <div className="grid grid-cols-1 gap-y-2 md:grid-cols-4 md:gap-x-8">
                <div className="md:col-span-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    Hourly Rate
                  </label>
                </div>
                <div className="md:col-span-3">
                  <div className="relative max-w-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-500 sm:text-sm">€</span>
                    </div>
                    <input
                      type="number"
                      name="hourlyRate"
                      disabled={!isEditing}
                      value={profile.hourlyRate}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 pl-8 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <span className="text-slate-500 sm:text-sm">/ hr</span>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Languages */}
              <div className="grid grid-cols-1 gap-y-2 md:grid-cols-4 md:gap-x-8">
                <div className="md:col-span-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Globe className="h-4 w-4 text-slate-400" />
                    Languages
                  </label>
                </div>
                <div className="md:col-span-3">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.languages.map((language, idx) => (
                      <span key={idx} className="inline-flex items-center rounded-md bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                        {language}
                        {isEditing && (
                            <button 
                              onClick={() => removeLanguage(language)}
                              className="ml-1.5 hover:text-purple-900"
                            >
                              ×
                            </button>
                        )}
                      </span>
                    ))}
                  </div>
                  {isEditing && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addLanguage(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="w-full max-w-xs rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">Add a language...</option>
                      <option value="English">English</option>
                      <option value="Dutch">Dutch</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Italian">Italian</option>
                      <option value="Portuguese">Portuguese</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Japanese">Japanese</option>
                      <option value="Arabic">Arabic</option>
                    </select>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}