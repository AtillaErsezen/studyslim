import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Simple QR code generation
function generateQRCode(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export async function GET(request: NextRequest) {
  try {
    // Lazy imports
    const { db } = await import('@/db');
    const { bookings, bookingEvents, user, tutors, courses, tutorCourses } = await import('@/db/schema');
    const { eq, and, desc, sql } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('id');
    const status = searchParams.get('status');
    const tutorId = searchParams.get('tutor_id');
    const studentId = searchParams.get('student_id');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Role-based filtering
    let whereConditions = [];
    
    if (session.user.role === 'student') {
      whereConditions.push(eq(bookings.studentId, session.user.id));
    } else if (session.user.role === 'tutor') {
      const tutorRecord = await db.select().from(tutors).where(eq(tutors.userId, session.user.id)).limit(1);
      if (tutorRecord.length === 0) {
        return NextResponse.json({ success: false, error: 'Tutor profile not found' }, { status: 404 });
      }
      whereConditions.push(eq(bookings.tutorId, tutorRecord[0].id));
    }

    if (status) {
      whereConditions.push(eq(bookings.status, status));
    }
    if (tutorId && session.user.role === 'admin') {
      whereConditions.push(eq(bookings.tutorId, tutorId));
    }
    if (studentId && session.user.role === 'admin') {
      whereConditions.push(eq(bookings.studentId, studentId));
    }

    if (bookingId) {
      const booking = await db.select({
        id: bookings.id,
        studentId: bookings.studentId,
        tutorId: bookings.tutorId,
        courseId: bookings.courseId,
        sessionDate: bookings.sessionDate,
        startTime: bookings.startTime,
        endTime: bookings.endTime,
        duration: bookings.duration,
        hourlyRate: bookings.hourlyRate,
        totalAmount: bookings.totalAmount,
        status: bookings.status,
        paymentIntentId: bookings.paymentIntentId,
        sessionNotes: bookings.sessionNotes,
        qrCode: bookings.qrCode,
        createdAt: bookings.createdAt,
        updatedAt: bookings.updatedAt,
        studentName: user.name,
        courseName: courses.name,
        courseCode: courses.code
      })
      .from(bookings)
      .leftJoin(user, eq(bookings.studentId, user.id))
      .leftJoin(courses, eq(bookings.courseId, courses.id))
      .where(eq(bookings.id, bookingId))
      .limit(1);

      if (booking.length === 0) {
        return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
      }

      if (session.user.role === 'student' && booking[0].studentId !== session.user.id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
      if (session.user.role === 'tutor') {
        const tutorRecord = await db.select().from(tutors).where(eq(tutors.userId, session.user.id)).limit(1);
        if (tutorRecord.length === 0 || booking[0].tutorId !== tutorRecord[0].id) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
        }
      }

      const tutorUser = await db.select({ name: user.name })
        .from(user)
        .innerJoin(tutors, eq(tutors.userId, user.id))
        .where(eq(tutors.id, booking[0].tutorId))
        .limit(1);

      return NextResponse.json({ 
        success: true, 
        data: { ...booking[0], tutorName: tutorUser[0]?.name || 'Unknown Tutor' }
      });
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const query = db.select({
      id: bookings.id,
      studentId: bookings.studentId,
      tutorId: bookings.tutorId,
      courseId: bookings.courseId,
      sessionDate: bookings.sessionDate,
      startTime: bookings.startTime,
      endTime: bookings.endTime,
      duration: bookings.duration,
      hourlyRate: bookings.hourlyRate,
      totalAmount: bookings.totalAmount,
      status: bookings.status,
      paymentIntentId: bookings.paymentIntentId,
      sessionNotes: bookings.sessionNotes,
      qrCode: bookings.qrCode,
      createdAt: bookings.createdAt,
      updatedAt: bookings.updatedAt,
      studentName: user.name,
      courseName: courses.name,
      courseCode: courses.code,
      tutorName: sql`tutor_user.name`.as('tutorName')
    })
    .from(bookings)
    .leftJoin(user, eq(bookings.studentId, user.id))
    .leftJoin(courses, eq(bookings.courseId, courses.id))
    .leftJoin(tutors, eq(bookings.tutorId, tutors.id))
    .leftJoin(sql`${user} as tutor_user`, eq(tutors.userId, sql`tutor_user.id`))
    .where(whereClause)
    .orderBy(desc(bookings.createdAt))
    .limit(limit)
    .offset(offset);

    const results = await query;

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('GET bookings error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { db } = await import('@/db');
    const { bookings, bookingEvents, user, tutors, courses, tutorCourses } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    if (session.user.role !== 'tutor') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only tutors can create bookings',
        code: 'UNAUTHORIZED_ROLE' 
      }, { status: 403 });
    }

    const tutorRecord = await db.select().from(tutors).where(eq(tutors.userId, session.user.id)).limit(1);
    if (tutorRecord.length === 0) {
      return NextResponse.json({ success: false, error: 'Tutor profile not found' }, { status: 404 });
    }
    const tutorId = tutorRecord[0].id;
    
    const requestBody = await request.json();
    const {
      student_id,
      course_id, 
      session_date, 
      start_time, 
      end_time, 
      duration,
      hourly_rate,
      session_notes 
    } = requestBody;

    if (!student_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'student_id is required',
        code: 'MISSING_STUDENT_ID' 
      }, { status: 400 });
    }
    if (!course_id) {
      return NextResponse.json({ success: false, error: 'course_id is required' }, { status: 400 });
    }
    if (!session_date) {
      return NextResponse.json({ success: false, error: 'session_date is required' }, { status: 400 });
    }
    if (!start_time || !end_time) {
      return NextResponse.json({ success: false, error: 'start_time and end_time are required' }, { status: 400 });
    }
    if (!hourly_rate) {
      return NextResponse.json({ 
        success: false, 
        error: 'hourly_rate is required',
        code: 'MISSING_HOURLY_RATE' 
      }, { status: 400 });
    }

    const hourlyRateNum = typeof hourly_rate === 'number' ? hourly_rate : parseFloat(hourly_rate);
    if (isNaN(hourlyRateNum) || hourlyRateNum <= 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'hourly_rate must be a valid number greater than 0',
        code: 'INVALID_HOURLY_RATE' 
      }, { status: 400 });
    }

    if (session_notes && (typeof session_notes !== 'string' || session_notes.length > 140)) {
      return NextResponse.json({ 
        success: false, 
        error: 'session_notes must be a string with max 140 characters',
        code: 'INVALID_SESSION_NOTES' 
      }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(session_date)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid session_date format. Use YYYY-MM-DD',
        code: 'INVALID_DATE_FORMAT' 
      }, { status: 400 });
    }

    const sessionDateObj = new Date(session_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (sessionDateObj < today) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot create bookings for past dates',
        code: 'PAST_DATE' 
      }, { status: 400 });
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid time format. Use HH:mm',
        code: 'INVALID_TIME_FORMAT' 
      }, { status: 400 });
    }

    const startMinutes = parseInt(start_time.split(':')[0]) * 60 + parseInt(start_time.split(':')[1]);
    const endMinutes = parseInt(end_time.split(':')[0]) * 60 + parseInt(end_time.split(':')[1]);
    
    if (endMinutes <= startMinutes) {
      return NextResponse.json({ 
        success: false, 
        error: 'End time must be after start time',
        code: 'INVALID_TIME_RANGE' 
      }, { status: 400 });
    }

    if (duration < 30) {
      return NextResponse.json({ 
        success: false, 
        error: 'Session must be at least 30 minutes long',
        code: 'SESSION_TOO_SHORT' 
      }, { status: 400 });
    }

    const course = await db.select().from(courses).where(eq(courses.id, course_id)).limit(1);
    if (course.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Course not found',
        code: 'COURSE_NOT_FOUND' 
      }, { status: 404 });
    }

    const tutorCourse = await db.select()
      .from(tutorCourses)
      .where(and(
        eq(tutorCourses.tutorId, tutorId),
        eq(tutorCourses.courseId, course_id)
      ))
      .limit(1);

    if (tutorCourse.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'You do not teach this course. Add it to your courses first.',
        code: 'TUTOR_COURSE_MISMATCH' 
      }, { status: 400 });
    }

    const totalAmount = (duration / 60) * hourlyRateNum;
    const qrCode = generateQRCode();
    const bookingId = uuidv4();

    const bookingValues: any = {
      id: bookingId,
      studentId: student_id,
      tutorId: tutorId,
      courseId: course_id,
      sessionDate: session_date,
      startTime: start_time,
      endTime: end_time,
      duration: duration,
      hourlyRate: hourlyRateNum,
      totalAmount: totalAmount,
      status: 'pending',
      qrCode: qrCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newBooking = await db.insert(bookings)
      .values(bookingValues)
      .returning();

    await db.insert(bookingEvents)
      .values({
        id: uuidv4(),
        bookingId: bookingId,
        eventType: 'created',
        eventData: JSON.stringify({
          sessionDate: session_date,
          startTime: start_time,
          endTime: end_time,
          totalAmount: totalAmount
        }),
        triggeredBy: session.user.id,
        createdAt: new Date().toISOString()
      });

    return NextResponse.json({ 
      success: true, 
      data: newBooking[0] 
    }, { status: 201 });
  } catch (error) {
    console.error('POST bookings error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { db } = await import('@/db');
    const { bookings, bookingEvents, tutors } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const {searchParams} = new URL(request.url);
    const id = searchParams.get('id');
    const requestBody = await request.json();
    const {session_date, start_time, end_time, status: bookingStatus, session_notes } = requestBody;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking ID is required',
        code: 'MISSING_BOOKING_ID' 
      }, { status: 400 });
    }

    const existingBooking = await db.select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (existingBooking.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND' 
      }, { status: 404 });
    }

    const booking = existingBooking[0];

    if (session.user.role === 'student' && booking.studentId !== session.user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized to update this booking',
        code: 'UNAUTHORIZED' 
      }, { status: 403 });
    }

    const tutorRecord = await db.select().from(tutors).where(eq(tutors.userId, session.user.id)).limit(1);
    const isTutor = tutorRecord.length > 0 && booking.tutorId === tutorRecord[0].id;
    const isStudent = session.user.role === 'student' && booking.studentId === session.user.id;
    const isAdmin = session.user.role === 'admin';

    if (!isTutor && !isStudent && !isAdmin) {
      return NextResponse.json({ 
        success: false, 
        error: 'You can only update your own bookings',
        code: 'UNAUTHORIZED' 
      }, { status: 403 });
    }

    if (session_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(session_date)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid session_date format. Use YYYY-MM-DD',
          code: 'INVALID_DATE_FORMAT' 
        }, { status: 400 });
      }

      const sessionDateObj = new Date(session_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (sessionDateObj < today) {
        return NextResponse.json({ 
          success: false, 
          error: 'Cannot create bookings for past dates',
          code: 'PAST_DATE' 
        }, { status: 400 });
      }
    }

    if (start_time || end_time) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (start_time && !timeRegex.test(start_time)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid start_time format. Use HH:mm',
          code: 'INVALID_TIME_FORMAT' 
        }, { status: 400 });
      }
      if (end_time && !timeRegex.test(end_time)) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid end_time format. Use HH:mm',
          code: 'INVALID_TIME_FORMAT' 
        }, { status: 400 });
      }
    }

    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'];
    if (bookingStatus && !validStatuses.includes(bookingStatus)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', '),
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    let duration: number | undefined;
    let totalAmount: number | undefined;
    const finalStartTime = start_time || booking.startTime;
    const finalEndTime = end_time || booking.endTime;

    if (finalStartTime && finalEndTime) {
      const startMinutes = parseInt(finalStartTime.split(':')[0]) * 60 + parseInt(finalStartTime.split(':')[1]);
      const endMinutes = parseInt(finalEndTime.split(':')[0]) * 60 + parseInt(finalEndTime.split(':')[1]);
      
      if (endMinutes <= startMinutes) {
        return NextResponse.json({ 
          success: false, 
          error: 'End time must be after start time',
          code: 'INVALID_TIME_RANGE' 
        }, { status: 400 });
      }

      duration = endMinutes - startMinutes;
      
      if (duration < 30) {
        return NextResponse.json({ 
          success: false, 
          error: 'Session must be at least 30 minutes long',
          code: 'SESSION_TOO_SHORT' 
        }, { status: 400 });
      }

      if (booking.hourlyRate) {
        totalAmount = (duration / 60) * booking.hourlyRate;
      }
    }

    const updateValues: any = {
      updatedAt: new Date().toISOString()
    };

    if (session_date) updateValues.sessionDate = session_date;
    if (start_time) updateValues.startTime = start_time;
    if (end_time) updateValues.endTime = end_time;
    if (duration !== undefined) updateValues.duration = duration;
    if (totalAmount !== undefined) updateValues.totalAmount = totalAmount;
    if (bookingStatus) updateValues.status = bookingStatus;
    if (session_notes !== undefined) updateValues.sessionNotes = session_notes;

    const updatedBooking = await db.update(bookings)
      .set(updateValues)
      .where(eq(bookings.id, id))
      .returning();

    await db.insert(bookingEvents)
      .values({
        id: uuidv4(),
        bookingId: id,
        eventType: 'updated',
        eventData: JSON.stringify(updateValues),
        triggeredBy: session.user.id,
        createdAt: new Date().toISOString()
      });

    return NextResponse.json({ 
      success: true, 
      data: updatedBooking[0] 
    });
  } catch (error) {
    console.error('PUT bookings error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { db } = await import('@/db');
    const { bookings, bookingEvents, tutors } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
  
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking ID is required',
        code: 'MISSING_BOOKING_ID' 
      }, { status: 400 });
    }

    const existingBooking = await db.select()
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);

    if (existingBooking.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND' 
      }, { status: 404 });
    }

    const booking = existingBooking[0];

    if (session.user.role === 'student' && booking.studentId !== session.user.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized to delete this booking',
        code: 'UNAUTHORIZED' 
      }, { status: 403 });
    }

    if (session.user.role === 'tutor') {
      const tutorRecord = await db.select().from(tutors).where(eq(tutors.userId, session.user.id)).limit(1);
      if (tutorRecord.length === 0 || booking.tutorId !== tutorRecord[0].id) {
        return NextResponse.json({ 
          success: false, 
          error: 'Unauthorized to delete this booking',
          code: 'UNAUTHORIZED' 
        }, { status: 403 });
      }
    }

    const cancelledBooking = await db.update(bookings)
      .set({
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      })
      .where(eq(bookings.id, id))
      .returning();

    await db.insert(bookingEvents)
      .values({
        id: uuidv4(),
        bookingId: id,
        eventType: 'cancelled',
        eventData: JSON.stringify({ reason: 'Deleted by user' }),
        triggeredBy: session.user.id,
        createdAt: new Date().toISOString()
      });

    return NextResponse.json({ 
      success: true, 
      message: 'Booking cancelled successfully',
      data: cancelledBooking[0] 
    });
  } catch (error) {
    console.error('DELETE bookings error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 });
  }
}