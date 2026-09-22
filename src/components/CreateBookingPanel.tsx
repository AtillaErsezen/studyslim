"use client";

import { useState } from "react";
import { X, Calendar as CalendarIcon, Clock } from "lucide-react";
import useSWR from "swr";

interface CreateBookingPanelProps {
  onClose: () => void;
  tutorId?: string;
  studentId?: string;
  studentName?: string;
  conversationId?: string;
}

export default function CreateBookingPanel({ onClose, tutorId, studentId, studentName, conversationId }: CreateBookingPanelProps) {
  const {data: coursesData, isLoading} = useSWR(
    tutorId ? `/api/tutor_courses?tutor_id=${tutorId}` : null,
    (url) => fetch(url).then(res => res.json()),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );
  
  const [formData, setFormData] = useState({
    courseId: "",
    sessionDate: "",
    startTime: "",
    endTime: "",
    duration: 60,
    hourlyRate: 25,
    sessionNotes: "",
  });

  const [loading, setLoading] = useState(false);
  const [timeError, setTimeError] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateDuration = (startTime?: string, endTime?: string) => {
    const start = startTime || formData.startTime;
    const end = endTime || formData.endTime;
    
    if (start && end) {
      const [startHour, startMin] = start.split(':').map(Number);
      const [endHour, endMin] = end.split(':').map(Number);
      const duration = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      
      if (duration <= 0) {
        setTimeError("End time must be after start time");
        setFormData(prev => ({ ...prev, duration: 0 }));
      } else if (duration < 30) {
        setTimeError("Session must be at least 30 minutes");
        setFormData(prev => ({ ...prev, duration }));
      } else {
        setTimeError("");
        setFormData(prev => ({ ...prev, duration }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate time
    if (formData.duration <= 0) {
      setTimeError("End time must be after start time");
      return;
    }
    
    if (formData.duration < 30) {
      setTimeError("Session must be at least 30 minutes");
      return;
    }
    
    setLoading(true);

    try {
      console.log('studentId:', studentId);
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          course_id: formData.courseId,
          session_date: formData.sessionDate,
          start_time: formData.startTime,
          end_time: formData.endTime,
          duration: formData.duration,
          hourly_rate: formData.hourlyRate,
          session_notes: formData.sessionNotes,
        }),
      });
      
      const result = await response.json();
      console.log('API Response:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      console.log('Booking created:', result);
      
      // Send booking message to chat
      if (conversationId && result.data) {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation_id: conversationId,
            content: `Booking created for ${formData.sessionDate} at ${formData.startTime}`,
            message_type: 'booking',
            booking_id: result.data.id,
          }),
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error instanceof Error ? error.message : 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create New Booking</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Student Info */}
          {studentName && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Booking with</p>
              <p className="font-semibold">{studentName}</p>
            </div>
          )}

          {/* Course Selection */}
          <div>
            <label htmlFor="courseId" className="block text-sm font-medium mb-2">
              Course *
            </label>
            <select
              id="courseId"
              name="courseId"
              value={formData.courseId}
              onChange={handleInputChange}
              required
              disabled={isLoading}
              className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              <option value="">
                {isLoading ? 'Loading courses...' : 'Select a course'}
              </option>
              {coursesData?.data?.map((item: any) => (
                <option key={item.tutor_courses.id} value={item.courses.id}>
                  {item.courses.code} - {item.courses.name}
                </option>
              ))}
            </select>
          </div>

          {/* Session Date */}
          <div>
            <label htmlFor="sessionDate" className="block text-sm font-medium mb-2">
              <CalendarIcon className="w-4 h-4 inline mr-1" />
              Session Date *
            </label>
            <input
              type="date"
              id="sessionDate"
              name="sessionDate"
              value={formData.sessionDate}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Start Time *
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={(e) => {
                  handleInputChange(e);
                  setTimeout(() => calculateDuration(e.target.value, formData.endTime), 0);
                }}
                required
                className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                End Time *
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={(e) => {
                  handleInputChange(e);
                  setTimeout(() => calculateDuration(formData.startTime, e.target.value), 0);
                }}
                required
                className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Duration Display */}
          {timeError && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-900 dark:text-red-100">
                {timeError}
              </p>
            </div>
          )}
          {formData.duration > 0 && !timeError && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Session duration: <span className="font-semibold">{formData.duration} minutes</span>
              </p>
            </div>
          )}
          {/* Hourly Rate */}
          <div>
            <label htmlFor="hourlyRate" className="block text-sm font-medium mb-2">
              Hourly Rate (€) *
            </label>
            <input
              type="number"
              id="hourlyRate"
              name="hourlyRate"
              value={formData.hourlyRate}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Total Amount Display */}
          {formData.duration > 0 && formData.hourlyRate > 0 && !timeError && (
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-primary">
                €{((formData.duration / 60) * formData.hourlyRate).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor(formData.duration / 60)}h {formData.duration % 60}m × €{formData.hourlyRate}/hour
              </p>
            </div>
          )}

          {/* Session Notes */}
          <div>
            <label htmlFor="sessionNotes" className="block text-sm font-medium mb-2">
              Session Notes (Optional)
            </label>
            <textarea
              id="sessionNotes"
              name="sessionNotes"
              value={formData.sessionNotes}
              onChange={handleInputChange}
              rows={4}
              placeholder="Add any specific topics or requests for this session..."
              className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-md border border-border bg-background text-foreground text-sm font-semibold hover:bg-muted disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || timeError !== "" || formData.duration <= 0}
              className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
