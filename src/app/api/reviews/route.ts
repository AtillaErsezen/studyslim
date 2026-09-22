import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Lazy imports
    const { db } = await import('@/db');
    const { reviews, bookings, user, tutors } = await import('@/db/schema');
    const { eq, and, desc, count, sql } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutor_id');
    const studentId = searchParams.get('student_id');
    const bookingId = searchParams.get('booking_id');
    //TODO remove public_only, all reviews will be public
    const publicOnly = searchParams.get('public_only') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // For student_id filtering, require authentication
    const session = await auth.api.getSession(request);
    if (!session) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required to filter by student',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }
    const conditions = [];
    if (studentId) {
      // user can only see their own reviews when filtering by student_id
      if (studentId !== session.user.id) {
        return NextResponse.json({ 
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED' 
        }, { status: 403 });
      }
      conditions.push(eq(reviews.studentId, studentId));
    }
    if (tutorId) {
      conditions.push(eq(reviews.tutorId, tutorId));
    }
    if (bookingId) {
      conditions.push(eq(reviews.bookingId, bookingId));
    }
    //TODO remove public_only filtering, all reviews will be public
    if (publicOnly) {
      conditions.push(eq(reviews.isPublic, true));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const reviewsWithDetails = await db
      .select({
        id: reviews.id,
        bookingId: reviews.bookingId,
        studentId: reviews.studentId,
        tutorId: reviews.tutorId,
        rating: reviews.rating,
        comment: reviews.comment,
        isPublic: reviews.isPublic,// TODO: all reviews will be public
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        studentName: sql<string>`${user.name}`,
        bookingDate: sql<string>`${bookings.sessionDate}`,
        bookingStartTime: sql<string>`${bookings.startTime}`,
        courseId: sql<number>`${bookings.courseId}`
      })
      .from(reviews)
      .leftJoin(user, eq(reviews.studentId, user.id))
      .leftJoin(bookings, eq(reviews.bookingId, bookings.id))
      .where(whereClause)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: reviewsWithDetails
    });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Lazy imports
    const { db } = await import('@/db');
    const { reviews, bookings, tutors } = await import('@/db/schema');
    const { eq, count, sql } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session){
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }
    const requestBody = await request.json();
    // Security check: reject if user identifiers provided in body
    if ('studentId' in requestBody || 'student_id' in requestBody || 'tutorId' in requestBody || 'tutor_id' in requestBody) {
      return NextResponse.json({ 
        success: false,
        error: "User IDs cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const {booking_id, rating, comment } = requestBody;
    if(!booking_id) {
      return NextResponse.json({ 
        success: false,
        error: 'Booking ID is required',
        code: 'MISSING_BOOKING_ID' 
      }, { status: 400 });
    }
    if (!rating) {
      return NextResponse.json({ 
        success: false,
        error: 'Rating is required',
        code: 'MISSING_RATING' 
      }, { status: 400 });
    }
    // Validate rating
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ 
        success: false,
        error: 'Rating must be an integer between 1 and 5',
        code: 'INVALID_RATING' 
      }, { status: 400 });
    }

    // Validate comment length if provided
    if (comment && comment.trim().length < 10) {
      return NextResponse.json({ 
        success: false,
        error: 'Comment must be at least 10 characters long',
        code: 'COMMENT_TOO_SHORT' 
      }, { status: 400 });
    }

    // Check if booking exists and is completed
    const booking = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, booking_id))
      .limit(1);

    if (booking.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND' 
      }, { status: 404 });
    }
    // Validate student is the booking's student
    if (booking[0].studentId !== session.user.id) {
      return NextResponse.json({ 
        success: false,
        error: 'You can only review your own bookings',
        code: 'ACCESS_DENIED' 
      }, { status: 403 });
    }

    // Validate booking is completed
    if (booking[0].status !== 'completed') {
      return NextResponse.json({ 
        success: false,
        error: 'Booking must be completed before reviewing',
        code: 'BOOKING_NOT_COMPLETED' 
      }, { status: 400 });
    }


    // Create the review
    const newReview = await db.insert(reviews)
      .values({
        id: uuidv4(),
        bookingId: booking_id,
        studentId: session.user.id,
        tutorId: booking[0].tutorId,
        rating,
        comment: comment ? comment.trim() : null,
        isPublic: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    // Update tutor's rating average and review count
    const tutorReviews = await db
      .select({
        avgRating: sql<number>`CAST(AVG(${reviews.rating}) AS REAL)`,
        reviewCount: count(reviews.id)
      })
      .from(reviews)
      .where(eq(reviews.tutorId, booking[0].tutorId));

    const { avgRating, reviewCount } = tutorReviews[0];

    await db.update(tutors)
      .set({
        ratingAvg: avgRating ? parseFloat(avgRating.toFixed(2)) : 0,
        reviewCount: reviewCount || 0
      })
      .where(eq(tutors.id, booking[0].tutorId));

    return NextResponse.json({
      success: true,
      data: newReview[0]
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

//TODO: for future implementation
export async function DELETE(request: NextRequest){
  try {
    // Lazy imports
    const { db } = await import('@/db');
    const { reviews } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session){
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('review_id');

    if (!reviewId) {
      return NextResponse.json({ 
        success: false,
        error: 'Review ID is required',
        code: 'MISSING_REVIEW_ID' 
      }, { status: 400 });
    }

    // TODO: Add review deletion logic here
    
    return NextResponse.json({ 
      success: false,
      error: 'Not implemented yet',
      code: 'NOT_IMPLEMENTED' 
    }, { status: 501 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}