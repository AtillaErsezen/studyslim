'use client';

import React, { useState, useEffect } from "react";
import { Tutor, University, StudiSlimAPI } from "@/lib/api";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
  department: string;
}

interface TutorSearchProps {
  className?: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default function TutorSearch({ className }: TutorSearchProps) {
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search filters
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Default discovery pool
  const [discoveryPool, setDiscoveryPool] = useState<Tutor[]>([]);

  const departments = ['Computer Science', 'Mathematics', 'Economics', 'Business'];
  const languages = [
    'English', 'Dutch', 'German', 'French', 'Spanish', 'Arabic', 'Turkish', 'Chinese',
    'Mandarin', 'Cantonese', 'Portuguese', 'Italian', 'Russian', 'Japanese', 'Korean',
    'Hindi', 'Bengali', 'Urdu', 'Vietnamese', 'Polish', 'Swedish', 'Norwegian', 'Danish',
    'Greek', 'Romanian', 'Hungarian', 'Czech', 'Finnish', 'Indonesian', 'Malay', 'Thai',
    'Hebrew', 'Persian', 'Swahili', 'Afrikaans', 'Filipino'
  ];

  // Load initial data
  useEffect(() => {
    loadUniversities();
    loadCourses();
    loadDiscoveryPool();
  }, []);

  const loadUniversities = async () => {
    const response = await StudiSlimAPI.getUniversities();
    if (response.success && response.data) {
      setUniversities(response.data);
    }
  };

  const loadCourses = async () => {
    const params: { universityId?: string; department?: string } = {};
    if (selectedUniversity) params.universityId = selectedUniversity;
    if (selectedDepartment) params.department = selectedDepartment;
    
    const response = await StudiSlimAPI.getCourses(params);
    if (response.success && response.data) {
      setCourses(response.data);
    }
  };

  const loadDiscoveryPool = async () => {
    const res = await StudiSlimAPI.searchTutors({ limit: 50 });
    if (res.success && res.data) {
      setDiscoveryPool(res.data);
    }
  };

  const searchTutors = async () => {
    setLoading(true);
    
    const params: any = {};
    if (searchQuery) params.query = searchQuery;
    if (selectedUniversity) params.universityId = selectedUniversity;
    if (selectedCourse) params.courseId = selectedCourse;
    if (selectedLanguage) params.language = selectedLanguage;
    if (minPrice) params.minPrice = Number(minPrice);
    if (maxPrice) params.maxPrice = Number(maxPrice);
    params.limit = 20;

    const response = await StudiSlimAPI.searchTutors(params);
    if (response.success && response.data) {
      setTutors(response.data);
    }
    setLoading(false);
  };

  // Reload courses when university or department changes
  useEffect(() => {
    loadCourses();
  }, [selectedUniversity, selectedDepartment]);

  const noFiltersActive = !searchQuery && !selectedUniversity && !selectedCourse && !selectedLanguage && !minPrice && !maxPrice;

  const byMostPopular = (list: Tutor[]) =>
    [...list].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0) || b.ratingAvg - a.ratingAvg);

  const byMostLiked = (list: Tutor[]) =>
    [...list].sort((a, b) => b.ratingAvg - a.ratingAvg || (b.reviewCount || 0) - (a.reviewCount || 0));

  const bySuggested = (list: Tutor[]) =>
    [...list]
      .sort((a, b) => (b.verified === a.verified ? 0 : b.verified ? 1 : -1))
      .sort((a, b) => (b.ratingAvg * Math.max(b.reviewCount, 1)) - (a.ratingAvg * Math.max(a.reviewCount, 1)));

  const byTrending = (list: Tutor[]) =>
    [...list].sort((a, b) => {
      const recentBoost = (t: Tutor) => {
        const days = Math.max(1, (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return 1 / days; // newer = higher
      };
      const scoreA = recentBoost(a) + (a.reviewCount || 0) * 0.02 + a.ratingAvg * 0.1;
      const scoreB = recentBoost(b) + (b.reviewCount || 0) * 0.02 + b.ratingAvg * 0.1;
      return scoreB - scoreA;
    });

  const Section = ({ title, items }: { title: string; items: Tutor[] }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-primary">{title}</h3>
        {/* Future: add View All link */}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.slice(0, 6).map((t) => (
          <TutorCard key={`${title}-${t.id}`} tutor={t} />
        ))}
      </div>
    </div>
  );

  return (
    <div className={`tutor-search ${className || ''}`}>
      <div className="search-filters p-6 rounded-lg shadow-md mb-6 border border-border bg-background">
        <h2 className="text-2xl font-bold mb-4 text-primary">Find Your Perfect Tutor</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Search Query */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2 ">
              Search Tutors
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or expertise..."
              className="w-full p-2 border border-border bg-card text-foreground placeholder-muted-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* University Filter */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              University
            </label>
            <select
              value={selectedUniversity}
              onChange={(e) => setSelectedUniversity(e.target.value)}
              className="w-full p-2 border border-border bg-card text-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Universities</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.shortName} - {uni.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full p-2 border border-border bg-card text-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Course Filter */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full p-2 border border-border bg-card text-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full p-2 border border-border bg-card text-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Languages</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Min Price (€/hour)
            </label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 20"
              min="0"
              className="w-full p-2 border border-border bg-card text-foreground placeholder-muted-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Max Price (€/hour)
            </label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 50"
              min="0"
              className="w-full p-2 border border-border bg-card text-foreground placeholder-muted-foreground rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={searchTutors}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all shadow-lg hover:bg-violet-700 transition-all hover:-translate-y-1"
            >
              {loading ? 'Searching...' : 'Search Tutors'}
            </button>
          </div>
        </div>
      </div>

      {/* Results / Default Discovery */}
      <div className="search-results">
        {loading && (
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto my-16" />
        )}

        {!loading && tutors.length === 0 && noFiltersActive && discoveryPool.length > 0 && (
          <div>
            <Section title="Suggested for you" items={bySuggested(discoveryPool)} />
            <Section title="Most popular" items={byMostPopular(discoveryPool)} />
            <Section title="Most liked" items={byMostLiked(discoveryPool)} />
            <Section title="Trending now" items={byTrending(discoveryPool)} />
          </div>
        )}

        {!loading && tutors.length === 0 && (!noFiltersActive || discoveryPool.length === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p>No tutors found. Try adjusting your search criteria.</p>
          </div>
        )}

        {!loading && tutors.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TutorCardProps {
  tutor: Tutor;
}

function TutorCard({ tutor }: TutorCardProps) {

  return (
    <div className="tutor-card bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-border text-foreground">
      <div className="flex items-start mb-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mr-4 border-2 border-primary">
          <span className="text-primary font-bold text-2xl">
            {tutor.name?.charAt(0) || 'T'}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-2xl text-primary">{tutor.name}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {tutor.verified && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Verified
              </span>
            )}
            <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium flex items-center">
              <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Available
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg 
            key={star} 
            className={`w-5 h-5 ${star <= Math.round(tutor.ratingAvg || 0) ? 'text-yellow-400' : 'text-border'}`}
            fill="currentColor" 
            viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="ml-2 text-muted-foreground">
          {tutor.ratingAvg?.toFixed(1) || '0.0'} ({tutor.reviewCount || 0} reviews)
        </span>
      </div>

      <div className="mb-5">
        <p className="text-muted-foreground line-clamp-3">
          {tutor.bio || 'Experienced tutor ready to help you succeed.'}
        </p>
      </div>

      <div className="mb-6">
        <div className="mb-2">
          <span className="font-bold">University:</span> {tutor.universityName}
        </div>
        <div className="mb-2">
          <span className="font-bold">Languages:</span> {(tutor.languages || []).join(', ')}
        </div>
        <div>
          <span className="font-bold">Expertise:</span> 
          <div className="inline-flex mt-1 ml-2">
            {(tutor.courseTags || []).slice(0, 1).map((tag) => (
              <span key={tag} className="bg-card text-foreground border border-border mr-2 px-3 py-1 rounded-full text-sm">
                {tag}
              </span>
            ))}
            {(tutor.courseTags?.length || 0) > 1 && 
              <span className="bg-card text-foreground border border-border px-3 py-1 rounded-full text-sm">
                +{(tutor.courseTags?.length || 0) - 1} more
              </span>
            }
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <div className="text-2xl font-bold text-primary">
            €{tutor.hourlyRate}/hr
          </div>
          <div className="text-muted-foreground text-sm flex items-center">
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {tutor.totalEarnings ? `${formatCurrency(tutor.totalEarnings)} earned` : '€0 earned'}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link href={`/tutor/${tutor.id}`}>
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md shadow-sm">
              View Profile
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}