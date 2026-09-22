import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Add this to prevent static generation(avoid build error)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Lazy imports to avoid build-time issues
    const { db } = await import('@/db');
    const { availabilitySlots, tutors, user } = await import('@/db/schema');
    const { SQL, eq, and, desc } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const { searchParams } = new URL(request.url);
    const tutorId = searchParams.get('tutor_id');
    const dayOfWeek = searchParams.get('day_of_week');
    const activeOnly = searchParams.get('active_only') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build conditions array with proper SQL type
    const conditions: any[] = [];
    
    // Authenticated tutor's own slots
    const session = await auth.api.getSession(request);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required to access own availability slots',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    // Get tutor record for the authenticated user
    const tutorRecord = await db.select()
      .from(tutors)
      .where(eq(tutors.userId, session.user.id))
      .limit(1);

    if (tutorRecord.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tutor profile not found',
        code: 'TUTOR_NOT_FOUND'
      }, { status: 404 });
    }
    
    const tutorIdToUse = tutorRecord[0].id;
    
    // Add tutor ID condition
    conditions.push(eq(availabilitySlots.tutorId, tutorIdToUse));

    // Add day of week condition if provided
    if (dayOfWeek !== null && dayOfWeek !== '') {
      const dayInt = parseInt(dayOfWeek);
      if (isNaN(dayInt) || dayInt < 0 || dayInt > 6) {
        return NextResponse.json({
          success: false,
          error: 'Day of week must be between 0 and 6 (Sunday=0)',
          code: 'INVALID_DAY_OF_WEEK'
        }, { status: 400 });
      }
      conditions.push(eq(availabilitySlots.dayOfWeek, dayInt));
    }

    // Add active only condition if requested
    if (activeOnly) {
      conditions.push(eq(availabilitySlots.isActive, true));
    }

    // Create the where clause
    const whereClause = conditions.length === 1 
      ? conditions[0] 
      : and(...conditions);

    // Execute the query with the where clause
    const results = await db.select({
      id: availabilitySlots.id,
      tutorId: availabilitySlots.tutorId,
      dayOfWeek: availabilitySlots.dayOfWeek,
      startTime: availabilitySlots.startTime,
      endTime: availabilitySlots.endTime,
      timezone: availabilitySlots.timezone,
      isRecurring: availabilitySlots.isRecurring,
      specificDate: availabilitySlots.specificDate,
      isActive: availabilitySlots.isActive,
      createdAt: availabilitySlots.createdAt,
      updatedAt: availabilitySlots.updatedAt
    })
    .from(availabilitySlots)
    .where(whereClause)
    .orderBy(desc(availabilitySlots.createdAt))
    .limit(limit)
    .offset(offset);

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('GET availability slots error:', error);
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
    const { availabilitySlots, tutors } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session){
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    // Get tutor record for the authenticated user
    const tutorRecord = await db.select()
      .from(tutors)
      .where(eq(tutors.userId, session.user.id))
      .limit(1);

    if (tutorRecord.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tutor profile not found',
        code: 'TUTOR_NOT_FOUND'
      }, { status: 404 });
    }

    const requestBody = await request.json();
    const {
      day_of_week,
      start_time,
      end_time,
      timezone = 'Europe/Amsterdam',
      is_recurring = true,
      specific_date
    } = requestBody;

    // Security check: reject if tutorId provided in body
    if ('tutorId' in requestBody || 'tutor_id' in requestBody) {
      return NextResponse.json({
        success: false,
        error: 'Tutor ID cannot be provided in request body',
        code: 'TUTOR_ID_NOT_ALLOWED'
      }, { status: 400 });
    }

    // Validate required fields
    if (day_of_week === undefined || day_of_week === null) {
      return NextResponse.json({
        success: false,
        error: 'Day of week is required',
        code: 'MISSING_DAY_OF_WEEK'
      }, { status: 400 });
    }

    if (!start_time) {
      return NextResponse.json({
        success: false,
        error: 'Start time is required',
        code: 'MISSING_START_TIME'
      }, { status: 400 });
    }

    if (!end_time) {
      return NextResponse.json({
        success: false,
        error: 'End time is required',
        code: 'MISSING_END_TIME'
      }, { status: 400 });
    }

    // Validate day_of_week
    if (typeof day_of_week !== 'number' || day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json({
        success: false,
        error: 'Day of week must be between 0 and 6 (Sunday=0)',
        code: 'INVALID_DAY_OF_WEEK'
      }, { status: 400 });
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time)) {
      return NextResponse.json({
        success: false,
        error: 'Start time must be in HH:mm format',
        code: 'INVALID_START_TIME_FORMAT'
      }, { status: 400 });
    }

    if (!timeRegex.test(end_time)) {
      return NextResponse.json({
        success: false,
        error: 'End time must be in HH:mm format',
        code: 'INVALID_END_TIME_FORMAT'
      }, { status: 400 });
    }

    // Validate start_time < end_time
    const [startHour, startMin] = start_time.split(':').map(Number);
    const [endHour, endMin] = end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      return NextResponse.json({
        success: false,
        error: 'Start time must be before end time',
        code: 'INVALID_TIME_RANGE'
      }, { status: 400 });
    }

    // Validate minimum duration (30 minutes)
    const durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 30) {
      return NextResponse.json({
        success: false,
        error: 'Minimum slot duration is 30 minutes',
        code: 'DURATION_TOO_SHORT'
      }, { status: 400 });
    }

    // Validate maximum duration (8 hours = 480 minutes)
    if (durationMinutes > 480) {
      return NextResponse.json({
        success: false,
        error: 'Maximum slot duration is 8 hours',
        code: 'DURATION_TOO_LONG'
      }, { status: 400 });
    }

    // Validate specific_date format and future date
    if (specific_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(specific_date)) {
        return NextResponse.json({
          success: false,
          error: 'Specific date must be in YYYY-MM-DD format',
          code: 'INVALID_DATE_FORMAT'
        }, { status: 400 });
      }

      const specificDateObj = new Date(specific_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (specificDateObj < today) {
        return NextResponse.json({
          success: false,
          error: 'Specific date must be in the future',
          code: 'DATE_IN_PAST'
        }, { status: 400 });
      }
    }

    // Check for overlapping slots
    const baseConditions: any[] = [
      eq(availabilitySlots.tutorId, tutorRecord[0].id),
      eq(availabilitySlots.dayOfWeek, day_of_week),
      eq(availabilitySlots.isActive, true)
    ];
    
    // Add date-specific condition
    const dateCondition: any = specific_date
      ? eq(availabilitySlots.specificDate, specific_date)
      : eq(availabilitySlots.isRecurring, true);

    const existingSlots = await db.select()
      .from(availabilitySlots)
      .where(and(...baseConditions, dateCondition));

    // Check for time overlap
    for (const slot of existingSlots) {
      const [existingStartHour, existingStartMin] = slot.startTime.split(':').map(Number);
      const [existingEndHour, existingEndMin] = slot.endTime.split(':').map(Number);
      const existingStartMinutes = existingStartHour * 60 + existingStartMin;
      const existingEndMinutes = existingEndHour * 60 + existingEndMin;

      // Check if there's overlap
      if (!(endMinutes <= existingStartMinutes || startMinutes >= existingEndMinutes)) {
        return NextResponse.json({
          success: false,
          error: 'Time slot overlaps with existing availability',
          code: 'OVERLAPPING_SLOT'
        }, { status: 400 });
      }
    }

    // Create the availability slot
    const newSlot = await db.insert(availabilitySlots)
      .values({
        id: uuidv4(),
        tutorId: tutorRecord[0].id,
        dayOfWeek: day_of_week,
        startTime: start_time,
        endTime: end_time,
        timezone: timezone,
        isRecurring: is_recurring,
        specificDate: specific_date || null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newSlot[0]
    }, { status: 201 });

  } catch (error) {
    console.error('POST availability slot error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Lazy imports
    const { db } = await import('@/db');
    const { availabilitySlots, tutors } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session){
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 });
    }

    // Get tutor record for the authenticated user
    const tutorRecord = await db.select()
      .from(tutors)
      .where(eq(tutors.userId, session.user.id))
      .limit(1);

    if (tutorRecord.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Tutor profile not found',
        code: 'TUTOR_NOT_FOUND'
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Valid slot ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if slot exists and belongs to the authenticated tutor
    const slotConditions: any[] = [
      eq(availabilitySlots.id, id),
      eq(availabilitySlots.tutorId, tutorRecord[0].id)
    ];
    
    const existingSlot = await db.select()
      .from(availabilitySlots)
      .where(and(...slotConditions))
      .limit(1);

    if (existingSlot.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Availability slot not found',
        code: 'SLOT_NOT_FOUND'
      }, { status: 404 });
    }

    // Delete the slot
    const deleteCondition = and(
      eq(availabilitySlots.id, id),
      eq(availabilitySlots.tutorId, tutorRecord[0].id)
    );
    
    const deleted = await db.delete(availabilitySlots)
      .where(deleteCondition)
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Slot deleted',
        deletedSlot: deleted[0]
      }
    });

  } catch (error) {
    console.error('DELETE availability slot error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}