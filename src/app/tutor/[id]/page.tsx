'use client'; // This component runs on the client-side to handle dynamic routing and state

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Clock, DollarSign, Award, Languages, BookOpen, Calendar, MessageCircle, ArrowLeft } from 'lucide-react';

// TypeScript interface defining the structure of tutor data from the database
interface TutorProfile {
  id: number;
  name: string;
  bio: string;
  hourlyRate: number;
  ratingAvg: number;
  reviewCount: number;
  languages: string;  // Stored as comma-separated string or JSON array in DB
  courseTags: string; // Stored as comma-separated string or JSON array in DB
  verified: boolean;
  isAvailable: boolean;
  totalEarnings: number;
  image?: string; // Optional field (may be null)
  universityId: number;
  userId: number;
  createdAt: string;  // ISO date string
}

// TypeScript interface for review data structure
interface Review {
  id: number;
  rating: number;
  comment: string;
  studentName: string;
  createdAt: string;
}

export default function TutorProfilePage() {
  // Get the tutor ID from the URL parameter (e.g., /tutor/5)
  const params = useParams();
  const router = useRouter();
  const tutorId = params.id as string;
  
  // Component state management
  const [tutor, setTutor] = useState<TutorProfile | null>(null); // Stores tutor data, null while loading
  const [reviews, setReviews] = useState<Review[]>([]);          // Stores array of reviews
  const [loading, setLoading] = useState(true);                  // Controls loading spinner
  const [error, setError] = useState<string | null>(null);       // Stores error message if fetch fails

  // useEffect runs when component mounts or when tutorId changes
  // TODO: use SWR or React Query for better data fetching and caching
  useEffect(() => {
    // Async function to fetch tutor and review data from APIs
    async function loadTutorData() {
      try {
        setLoading(true);
        
        // Fetch tutor details from tutors API
        const tutorRes = await fetch(`/api/tutors?id=${tutorId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const tutorData = await tutorRes.json();
        
        // Check if API returned tutor data successfully
        if (tutorData.success && tutorData.data) {
          setTutor(tutorData.data[0]); //data is a list of tutors, we take the first one(only one)
        } else {
          setError('Tutor not found');
        }

        // Fetch reviews for this tutor from reviews API
        const reviewsRes = await fetch(`/api/reviews?tutor_id=${tutorId}`);
        const reviewsData = await reviewsRes.json();
        
        if (reviewsData.success) {
          setReviews(reviewsData.data || []); // Set reviews or empty array
        }
        
      } catch (err) {
        console.error('Error loading tutor:', err);
        setError('Failed to load tutor profile');
      } finally {
        setLoading(false); // Always stop loading, success or failure
      }
    }

    // Only run the fetch if we have a valid tutorId
    if (tutorId) {
      loadTutorData();
    }
  }, [tutorId]); // Re-run effect when tutorId changes

  // Helper function to safely parse languages and course tags
  // Handles multiple formats: null, arrays, JSON strings, comma-separated strings
  const parseArrayField = (field: string | string[] | null | undefined): string[] => {
    if (!field) return []; // Return empty array for null/undefined
    
    // If it's already an array, return it as-is
    if (Array.isArray(field)) return field;
    
    // If it's not a string, return empty array (safety check)
    if (typeof field !== 'string') return [];
    
    // Try to parse as JSON first (in case it's stored as JSON array like '["English","Dutch"]')
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // Not JSON, continue to next parsing method
    }
    
    // Parse as comma-separated string (like "English,Dutch,Arabic")
    return field.split(',').map(item => item.trim()).filter(item => item.length > 0);
  };

  // Loading state: Show spinner while data is being fetched
  if (loading) {
    return (
          <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--violet-dark)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutor profile...</p>
        </div>
      </div>
    );
  }

  // Error state: Show error message if fetch failed or tutor not found
  if (error || !tutor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tutor Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The tutor you are looking for does not exist.'}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-gradient-to-r from-[var(--violet)] to-[var(--violet-dark)] text-white px-6 py-2 rounded-lg hover:from-[var(--violet-dark)] hover:to-[var(--violet)] transition-all shadow-md"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  // Parse languages and course tags from database format to arrays
  const languages = parseArrayField(tutor.languages);
  const courseTags = parseArrayField(tutor.courseTags);

  // Main render: Display the tutor profile page
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="shadow-sm border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold cursor-pointer shrink-0" onClick={() => window.location.href = '/dashboard'}>
            Study<span className="text-primary">Slim</span>
          </div>
          <div>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Profile */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Card */}
            <div className="rounded-xl shadow-sm border border-border p-8 bg-card text-card-foreground">
              <div className="flex items-start gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-[var(--violet)] to-[var(--violet-dark)] rounded-full flex items-center justify-center border-4 border-[var(--violet-light)]">
                    <span className="text-white font-bold text-5xl">
                      {tutor.name?.charAt(0) || 'T'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-1">{tutor.name}</h1>
                      <div className="flex items-center gap-2 mb-3">
                        {tutor.verified && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--violet-light)] text-[var(--violet-dark)]">
                            <Award className="w-3 h-3 mr-1" />
                            Verified
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tutor.isAvailable ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tutor.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="ml-1 text-lg font-semibold text-foreground">
                          {tutor.ratingAvg ? tutor.ratingAvg.toFixed(1) : '0.0'}
                        </span>
                        <span className="ml-1 text-[var(--color-muted-foreground)]">
                          ({tutor.reviewCount || 0} reviews)
                        </span>
                      </div>
                      <div className="flex items-center text-gray-300">
                      <DollarSign className="w-5 h-5 mr-1 bg-gradient-to-r from-[var(--violet)] to-[var(--violet-dark)] bg-clip-text text-transparent" />
                        <span className="text-xl font-bold bg-gradient-to-r from-[var(--violet)] to-[var(--violet-dark)] bg-clip-text text-transparent">€{tutor.hourlyRate}</span>
                        <span className="text-[var(--color-muted-foreground)] ml-1">/hour</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-[var(--color-muted-foreground)]">Total Earnings</p>
                      <p className="text-lg font-semibold text-foreground">€{tutor.totalEarnings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-muted-foreground)]">Member Since</p>
                      <p className="text-lg font-semibold text-foreground">
                        {new Date(tutor.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="rounded-xl shadow-sm border border-border p-6 bg-card text-card-foreground">
              <h2 className="text-xl font-bold text-foreground mb-4">About</h2>
              <p className="text-[var(--color-muted-foreground)] leading-relaxed whitespace-pre-wrap">
                {tutor.bio || 'No bio available.'}
              </p>
            </div>

            {/* Languages */}
            {languages.length > 0 && (
              <div className="rounded-xl shadow-sm border border-border p-6 bg-card text-card-foreground">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <Languages className="w-5 h-5 mr-2 text-[var(--violet)]" />
                  Languages
                </h2>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-[var(--violet-light)] text-[var(--violet-dark)] rounded-full text-sm font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Course Expertise */}
            {courseTags.length > 0 && (
              <div className="rounded-xl shadow-sm border border-border p-6 bg-card text-card-foreground">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-purple-600" />
                  Course Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {courseTags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="rounded-xl shadow-sm border border-border p-6 bg-card text-card-foreground">
              <h2 className="text-xl font-bold text-foreground mb-4">Reviews</h2>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-semibold">
                              {review.studentName?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{review.studentName || 'Anonymous'}</p>
                            <p className="text-sm text-[var(--color-muted-foreground)]">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 font-semibold">{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-[var(--color-muted-foreground)]">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No reviews yet</p>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-1">
            <div className="rounded-xl shadow-sm border border-border p-6 sticky top-8 bg-card text-card-foreground">
              <h3 className="text-lg font-bold text-white mb-4">Book a Session</h3>
              
              <div className="space-y-4">
                <div className="from-[var(--violet-light)] to-[var(--violet)] rounded-lg p-4 border border-[var(--violet-light)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white">Hourly Rate</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-[var(--violet)] to-[var(--violet-dark)] bg-clip-text text-transparent">€{tutor.hourlyRate}</span>
                  </div>
                  <p className="text-sm text-white">Per hour session</p>
                </div>

                <button
                  disabled={!tutor.isAvailable}
                  className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center ${
                    tutor.isAvailable
                      ? 'bg-gradient-to-r from-[var(--violet)] to-[var(--violet-dark)] text-white hover:from-[var(--violet-dark)] hover:to-[var(--violet)] shadow-md'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  {tutor.isAvailable ? 'Book Now' : 'Currently Unavailable'}
                </button>

                <button className="w-full py-3 border-2 border-[var(--violet)] text-[var(--violet)] rounded-lg font-semibold hover:bg-[var(--violet-light)] transition-all flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Send Message
                </button>

                <div className="pt-4 border-t space-y-2">
                  <p className="text-sm text-gray-400 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Usually responds in 2 hours
                  </p>
                  <p className="text-sm text-gray-400 flex items-center">
                    <Award className="w-4 h-4 mr-2" />
                    {tutor.reviewCount} students taught
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
