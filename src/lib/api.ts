// API Helper functions and types for StudiSlim tutoring marketplace

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface User {
  id: string;
  email: string;
  role: 'student' | 'tutor' | 'admin';
  name: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface University {
  id: string;
  name: string;
  shortName: string;
  city: string;
  country: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
  universityId: string;
  description?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  universityName?: string;
  universityShortName?: string;
}

export interface Tutor {
  id: string;
  userId: string;
  universityId: string;
  universityName:string;
  bio: string;
  hourlyRate: number;
  languages: string[];
  courseTags: string[];
  verified: boolean;
  isAvailable: boolean;
  ratingAvg: number;
  reviewCount: number;
  totalEarnings: number;
  createdAt: string;
  updatedAt: string;
  // Joined fields for search
  name?: string;
  image?: string;
}

export interface AvailabilitySlot {
  id: string;
  tutorId: string;
  dayOfWeek: number; // 0-6, Sunday=0
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  timezone: string;
  isRecurring: boolean;
  specificDate?: string; // YYYY-MM-DD
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  studentId: string;
  tutorId: string;
  courseId: string;
  sessionDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // minutes
  hourlyRate: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
  paymentIntentId?: string;
  sessionNotes?: string;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  studentName?: string;
  tutorName?: string;
  courseName?: string;
  courseCode?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  studentId: string;
  tutorId: string;
  rating: number; // 1-5
  comment?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  studentName?: string;
  tutorName?: string;
  bookingDate?: string;
}

export interface AIMatch {
  id: string;
  tutor: {
    id: string;
    name: string;
    image?: string;
    hourlyRate: number;
    ratingAvg: number;
    verified: boolean;
    languages: string[];
    experienceLevel: string;
  };
  matchScore: number;
  reasoning: string;
  sameUniversity: boolean;
}

// API Helper Functions

export class StudiSlimAPI {
  private static baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : 'http://localhost:3000';

  private static async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        code: 'NETWORK_ERROR'
      };
    }
  }

  // Universities API
  static async getUniversities(params?: { 
    limit?: number; 
    offset?: number; 
  }): Promise<ApiResponse<University[]>> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    return this.request<University[]>(`/api/universities?${searchParams}`);
  }

  // Courses API  
  static async getCourses(params?: {
    universityId?: string;
    department?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Course[]>> {
    const searchParams = new URLSearchParams();
    if (params?.universityId) searchParams.set('university_id', params.universityId);
    if (params?.department) searchParams.set('department', params.department);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    return this.request<Course[]>(`/api/courses?${searchParams}`);
  }

  // Tutors API
  static async searchTutors(params?: {
    query?: string;
    universityId?: string;
    courseId?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    language?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Tutor[]>> {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set('query', params.query);
    if (params?.universityId) searchParams.set('university_id', params.universityId);
    if (params?.courseId) searchParams.set('course_id', params.courseId);
    if (params?.minPrice) searchParams.set('min_price', params.minPrice.toString());
    if (params?.maxPrice) searchParams.set('max_price', params.maxPrice.toString());
    if (params?.minRating) searchParams.set('min_rating', params.minRating.toString());
    if (params?.language) searchParams.set('language', params.language);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    return this.request<Tutor[]>(`/api/tutors?${searchParams}`);
  }

  static async createTutorProfile(profile: {
    hourlyRate: number;
    languages: string[];
    courseTags: string[];
    universityId: string;
    bio?: string;
  }): Promise<ApiResponse<Tutor>> {
    return this.request<Tutor>('/api/tutors', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  }

  // Availability API
  static async getTutorAvailability(tutorId?: string, params?: {
    dayOfWeek?: number;
    activeOnly?: boolean;
  }): Promise<ApiResponse<AvailabilitySlot[]>> {
    const searchParams = new URLSearchParams();
    if (tutorId) searchParams.set('tutor_id', tutorId);
    if (params?.dayOfWeek !== undefined) searchParams.set('day_of_week', params.dayOfWeek.toString());
    if (params?.activeOnly) searchParams.set('active_only', 'true');
    
    return this.request<AvailabilitySlot[]>(`/api/availability?${searchParams}`);
  }

  static async createAvailabilitySlot(slot: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone?: string;
    isRecurring?: boolean;
    specificDate?: string;
  }): Promise<ApiResponse<AvailabilitySlot>> {
    return this.request<AvailabilitySlot>('/api/availability', {
      method: 'POST',
      body: JSON.stringify(slot),
    });
  }

  // Bookings API
  static async getBookings(params?: {
    status?: string;
    tutorId?: string;
    studentId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Booking[]>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.tutorId) searchParams.set('tutor_id', params.tutorId);
    if (params?.studentId) searchParams.set('student_id', params.studentId);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    return this.request<Booking[]>(`/api/bookings?${searchParams}`);
  }

  static async createBooking(booking: {
    tutorId: string;
    courseId: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
  }): Promise<ApiResponse<Booking>> {
    return this.request<Booking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        tutor_id: booking.tutorId,
        course_id: booking.courseId,
        session_date: booking.sessionDate,
        start_time: booking.startTime,
        end_time: booking.endTime,
      }),
    });
  }

  // Reviews API
  static async getReviews(params?: {
    tutorId?: string;
    studentId?: string;
    bookingId?: string;
    publicOnly?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<Review[]>> {
    const searchParams = new URLSearchParams();
    if (params?.tutorId) searchParams.set('tutor_id', params.tutorId);
    if (params?.studentId) searchParams.set('student_id', params.studentId);
    if (params?.bookingId) searchParams.set('booking_id', params.bookingId);
    if (params?.publicOnly) searchParams.set('public_only', 'true');
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    
    return this.request<Review[]>(`/api/reviews?${searchParams}`);
  }

  static async createReview(review: {
    bookingId: string;
    rating: number;
    comment?: string;
  }): Promise<ApiResponse<Review>> {
    return this.request<Review>('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        booking_id: review.bookingId,
        rating: review.rating,
        comment: review.comment,
      }),
    });
  }

  // AI Matching API
  static async findMatches(request: {
    courseId: string;
    universityId: string;
    preferences: {
      budgetMin?: number;
      budgetMax?: number;
      languagePreference?: string;
      experienceLevel?: string;
      availabilityPreference?: string;
    };
  }): Promise<ApiResponse<{ matches: AIMatch[]; totalFound: number }>> {
    return this.request<{ matches: AIMatch[]; totalFound: number }>('/api/match', {
      method: 'POST',
      body: JSON.stringify({
        course_id: request.courseId,
        university_id: request.universityId,
        preferences: {
          budget_min: request.preferences.budgetMin,
          budget_max: request.preferences.budgetMax,
          language_preference: request.preferences.languagePreference,
          experience_level: request.preferences.experienceLevel,
          availability_preference: request.preferences.availabilityPreference,
        },
      }),
    });
  }
}

// Utility functions
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('nl-NL');
}

export function formatTime(timeString: string): string {
  return timeString; // Already in HH:mm format
}

export function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}