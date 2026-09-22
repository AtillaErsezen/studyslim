"use client";

import React from "react";
import { Calendar, Clock, User, BookOpen, CheckCircle, XCircle, Star, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BookingDetailsProps {
  booking: {
    id: string;
  studentName: string;
  studentImage?: string;
  courseName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  hourlyRate: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  isStudent: boolean;
  reviews?: Array<{
      id: string;
      rating: number;
      comment: string;
      studentName: string;
    }>;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-blue-500/10 text-blue-500 border-blue-200";
    case "pending":
      return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
    case "in_progress":
      return "bg-purple-500/10 text-purple-600 border-purple-200";
    case "completed":
      return "bg-green-500/10 text-green-600 border-green-200";
    case "cancelled":
      return "bg-red-500/10 text-red-600 border-red-200";
    default:
      return "bg-gray-500/10 text-gray-600 border-gray-200";
  }
};

const BookingDetails: React.FC<BookingDetailsProps> = ({ booking }) => {
  const router = useRouter();
  
  // Temporary mock reviews for UI preview
  const mockReviews = [
    {
      id: "1",
      rating: 5,
      comment: "Excellent tutor! Very clear explanations and patient with my questions. Would definitely book again.",
      studentName: "Sarah Mock"
    },
    {
      id: "2",
      rating: 4,
      comment: "Great session. Helped me understand the concepts much better. Just wish we had more time.",
      studentName: "Max Mock"
    },
    {
      id: "3",
      rating: 5,
      comment: "Amazing! Made difficult topics easy to understand. Highly recommend this tutor.",
      studentName: "Lisa Mock"
    },
    {
      id: "4",
      rating: 1,
      comment: "Hater comment",
      studentName: "Jesse Mock"
    }
  ];

  // Use mock reviews if no reviews exist (for UI preview)
  const displayReviews = booking.reviews && booking.reviews.length > 0 ? booking.reviews : mockReviews;

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="mx-auto max-w-4xl flex gap-6 items-start">
        {/* Back to Dashboard Button */}
        <button 
          className="group flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
          onClick={() => router.push('/dashboard')}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-900/5 group-hover:ring-indigo-500/20 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Back to Dashboard
        </button>

        {/* Booking Details Panel */}
        <div className="flex-1 p-6 border border-border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Booking Details</h2>

      <div className="flex items-center gap-4 mb-6">
        {booking.studentImage ? (
          <img
            src={booking.studentImage}
            alt={booking.studentName}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-300 flex items-center justify-center text-lg">
            {booking.studentName.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold">{booking.studentName}</h3>
          <p className="text-sm text-muted-foreground">{booking.courseName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-5 h-5" />
          <span>{new Date(booking.sessionDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-5 h-5" />
          <span>
            {booking.startTime} - {booking.endTime}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <BookOpen className="w-5 h-5" />
          <span>{booking.duration} min</span>
        </div>
        <div className="text-right font-semibold">
          €{booking.totalAmount}
        </div>
      </div>

      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm border ${getStatusColor(
          booking.status
        )}`}
      >
        {booking.status === "completed" ? (
          <CheckCircle className="w-5 h-5" />
        ) : booking.status === "cancelled" ? (
          <XCircle className="w-5 h-5" />
        ) : null}
        <span className="capitalize">{booking.status}</span>
      </div>

      {/* Reviews Section */}
      {displayReviews && displayReviews.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Reviews</h3>
          <div className="space-y-4">
            {displayReviews.map((review) => (
              <div
                key={review.id}
                className="border border-border rounded-lg p-4 bg-muted/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{review.studentName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-foreground">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  </div>
  );
};

export default BookingDetails;