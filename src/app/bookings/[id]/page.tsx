"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import BookingDetails from "@/components/BookingDetails";

export default function BookingDetailsPage() {
  const params = useParams();
  const id = params.id as string; // Get booking ID from the URL

  // Fetch booking details based on the ID using useSWR
  const { data: bookingResult, error: bookingError, isLoading: bookingLoading } = useSWR(
    id ? `/api/bookings?id=${id}` : null,
    (url: string) => fetch(url).then((res) => res.json())
  );

  const { data: reviewsResult, error: reviewsError, isLoading: reviewsLoading } = useSWR(
    id ? `/api/reviews?booking_id=${id}` : null,
    (url: string) => fetch(url).then((res) => res.json())
  );

  // Loading state
  if (bookingLoading || reviewsLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div>Loading booking details...</div>
      </div>
    );
  }

  // Error handling
  if (bookingError || reviewsError) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-red-500">Failed to load booking details. Please try again.</div>
      </div>
    );
  }

  // No booking found
  if (!bookingResult?.success || !bookingResult?.data) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div>Booking not found</div>
      </div>
    );
  }

 bookingResult.data.reviews = reviewsResult?.success && reviewsResult?.data ? reviewsResult.data : [];

  console.log('Booking details:', bookingResult.data);

  return <BookingDetails booking={bookingResult.data} />;
}