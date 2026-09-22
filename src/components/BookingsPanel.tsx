"use client";

import { useState } from "react";
import { Calendar, Clock, BookOpen, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import useSWR from "swr";
import Link from "next/link";
interface BookingPanelProps{
  userId: string;
}
interface Booking {
  id: string;
  studentName: string;
  studentImage?: string;
  tutorName: string;
  tutorImage?: string;
  courseName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  hourlyRate: number;
  totalAmount: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  isStudent: boolean;
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

const getStatusIcon = (status: string) => {
  switch (status) {
    case "confirmed":
      return <CheckCircle className="w-4 h-4" />;
    case "pending":
      return <AlertCircle className="w-4 h-4" />;
    case "completed":
      return <CheckCircle className="w-4 h-4" />;
    case "cancelled":
      return <XCircle className="w-4 h-4" />;
    default:
      return null;
  }
};
//TODO what to do with bookings from deleted conversations?
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function BookingsPanel({userId}: BookingPanelProps) {
  const [filter, setFilter] = useState<string>("all");
  //TODO: use userid for fetching(currently done in api route, but should be done here)
  const {data: result, error, isLoading} = useSWR(
        '/api/bookings',
        async (url: string) => fetch(url).then((res) => res.json()),
        {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
          dedupingInterval: 60000, // Cache for 1 minute
        }
      );
  if(isLoading){
    return <div className="w-full h-[80vh] rounded-lg border border-border bg-background text-foreground flex items-center justify-center">
      Loading...
    </div>;
  }
  if (error) {
    console.error("Failed to fetch bookings:", error);
    return <div>Failed to load bookings.</div>;
  }
  console.log("Raw fetched bookings:", result);
  console.log("Current userId:", userId);
       // Merge mock data with fetched bookings(to simulate how completed bookings look like)
      const bookings: Booking[] = [
        ...(result?.data?.map((booking: any) => ({
          ...booking,
          isStudent: booking.studentId === userId,
        })) || []), // Ensure it's an array even if result.data is undefined
      ];
      console.log("Fetched bookings", bookings);
  const filteredBookings =
    filter === "all"
      ? bookings
      : bookings.filter((b: Booking) => b.status === filter);
  console.log("Filtered Bookings:", filteredBookings);
  return (
    <div className="w-full h-[80vh] rounded-lg border border-border bg-background text-foreground flex flex-col">
      {/* Header with filters */}
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold mb-3">Your Bookings</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-muted"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === "pending"
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-muted"
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter("confirmed")}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === "confirmed"
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-muted"
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === "completed"
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-muted"
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === "cancelled"
                ? "bg-primary text-primary-foreground"
                : "border border-border hover:bg-muted"
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No bookings found
          </div>
        ) : (
          filteredBookings.map((booking: Booking) => (
            <div
              key={booking.id}
              className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {(booking.isStudent ? booking.tutorImage : booking.studentImage) ? (
                    <img
                      src={booking.isStudent ? booking.tutorImage : booking.studentImage}
                      alt={booking.isStudent ? booking.tutorName : booking.studentName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                      {(booking.isStudent ? booking.tutorName : booking.studentName).charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-sm">{booking.isStudent ? booking.tutorName : booking.studentName}</h3>
                    <p className="text-xs text-muted-foreground">{booking.courseName}</p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(
                    booking.status
                  )}`}
                >
                  {getStatusIcon(booking.status)}
                  <span className="capitalize">{booking.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(booking.sessionDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>
                    {booking.startTime} - {booking.endTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>{booking.duration} min</span>
                </div>
                <div className="text-right font-semibold">
                  €{booking.totalAmount.toFixed(2)}
                </div>
              </div>

              <div className="flex gap-2">
                {booking.status === "pending" && booking.isStudent && (
                  <>
                    <button className="flex-1 px-3 py-1 rounded text-xs bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors">
                      Accept
                    </button>
                    <button className="flex-1 px-3 py-1 rounded text-xs bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors">
                      Decline
                    </button>
                  </>
                )}
                {booking.status === "confirmed" && (
                  <button className="w-full px-3 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    Mark as In Progress
                  </button>
                )}
                {booking.status === "in_progress" && (
                  <button className="w-full px-3 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    Mark as Completed
                  </button>
                )}
                {booking.status === "completed" && !booking.isStudent && (
                  <Link href={`/bookings/${booking.id}`}>
                    <button className="w-full px-3 py-1 rounded text-xs border border-border text-muted-foreground hover:bg-muted transition-colors">
                      View Reviews
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
