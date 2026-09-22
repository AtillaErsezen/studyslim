import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Lazy imports
    const { db } = await import('@/db');
    const { tutors, user, universities, tutorCourses } = await import('@/db/schema');
    const { eq, and, desc, asc, gte, lte, sql, inArray } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    
    console.log("sent GET request");
    
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    // If ID is provided, fetch that specific tutor (for profile page)
    if (user_id) {
      const result = await db
        .select({
          id: tutors.id,
          userId: tutors.userId,
          name: user.name,
          email: user.email,
          image: user.image,
          location: user.location,
          universityId: tutors.universityId,
          universityName: universities.name,
          hourlyRate: tutors.hourlyRate,
          ratingAvg: tutors.ratingAvg,
          reviewCount: tutors.reviewCount,
          languages: tutors.languages,
          courseTags: tutors.courseTags,
          bio: tutors.bio,
          verified: tutors.verified,
          isAvailable: tutors.isAvailable,
          createdAt: tutors.createdAt,
          updatedAt: tutors.updatedAt,
        })
        .from(tutors)
        .leftJoin(user, eq(tutors.userId, user.id))
        .leftJoin(universities, eq(tutors.universityId, universities.id))
        .where(eq(tutors.userId, user_id))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Tutor not found',
          code: 'TUTOR_NOT_FOUND'
        }, { status: 404 });
      }

      const tutor = result[0];
      return NextResponse.json({
        success: true,
        data: [{
          ...tutor,
          languages: typeof tutor.languages === 'string' ? JSON.parse(tutor.languages) : tutor.languages || [],
          courseTags: typeof tutor.courseTags === 'string' ? JSON.parse(tutor.courseTags) : tutor.courseTags || []
        }]
      });
    }

    // Otherwise, handle search/filter queries
    const query = searchParams.get('query');
    const universityId = searchParams.get('university_id');
    const courseId = searchParams.get('course_id');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const minRating = searchParams.get('min_rating');
    const language = searchParams.get('language');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);

    // Build conditions array
    const conditions: any[] = [
      eq(tutors.verified, true),
      eq(tutors.isAvailable, true),
      eq(user.isActive, true)
    ];

    // Apply filters conditionally
    if (query) {
      conditions.push(
        sql`(${user.name} LIKE ${'%' + query + '%'} OR ${tutors.bio} LIKE ${'%' + query + '%'})`
      );
    }
    if (universityId && typeof universityId === 'string' && universityId.trim() !== '') {
      conditions.push(eq(tutors.universityId, universityId));
    }

    // Filter by course if courseId is provided
    if (courseId && typeof courseId === 'string' && courseId.trim() !== '') {
      // Get tutor IDs that teach this course
      const tutorsForCourse = await db
        .select({ tutorId: tutorCourses.tutorId })
        .from(tutorCourses)
        .where(eq(tutorCourses.courseId, courseId));
      
      const tutorIds = tutorsForCourse
        .map(tc => tc.tutorId)
        .filter((id): id is string => id !== null);
      
      if (tutorIds.length > 0) {
        conditions.push(inArray(tutors.id, tutorIds));
      } else {
        // No tutors teach this course, return empty result
        return NextResponse.json({
          success: true,
          data: []
        });
      }
    }

    if (minPrice && !isNaN(parseFloat(minPrice))) {
      conditions.push(gte(tutors.hourlyRate, parseFloat(minPrice)));
    }

    if (maxPrice && !isNaN(parseFloat(maxPrice))) {
      conditions.push(lte(tutors.hourlyRate, parseFloat(maxPrice)));
    }

    if (minRating && !isNaN(parseFloat(minRating))) {
      conditions.push(gte(tutors.ratingAvg, parseFloat(minRating)));
    }

    if (language && language.trim() !== '') {
      conditions.push(sql`${tutors.languages} LIKE ${'%' + language + '%'}`);
    }
    
    // Create the where clause
    const whereClause = and(...conditions);

    // Determine sort expression
    const sort = searchParams.get('sort') || 'ratingAvg';
    const order = searchParams.get('order') || 'desc';
    
    // Determine sort column
    const sortColumn = 
      sort === 'hourlyRate' ? tutors.hourlyRate :
      sort === 'createdAt' ? tutors.createdAt :
      tutors.ratingAvg;
    
    // Execute query with all conditions in one step
    const results = await db
      .select({
        id: tutors.id,
        name: user.name,
        image: user.image,
        universityId: tutors.universityId,
        universityName: universities.name,
        hourlyRate: tutors.hourlyRate,
        ratingAvg: tutors.ratingAvg,
        reviewCount: tutors.reviewCount,
        languages: tutors.languages,
        courseTags: tutors.courseTags,
        verified: tutors.verified,
        totalEarnings: tutors.totalEarnings,
        isAvailable: tutors.isAvailable,
        createdAt: tutors.createdAt,
        updatedAt: tutors.updatedAt,
        bio: sql<string>`substr(${tutors.bio}, 1, 200)`.as('bio')
      })
      .from(tutors)
      .leftJoin(user, eq(tutors.userId, user.id))
      .leftJoin(universities, eq(tutors.universityId, universities.id))
      .where(whereClause)
      .orderBy(order === 'asc' ? asc(sortColumn) : desc(sortColumn))
      .limit(limit);

    // Parse JSON strings for languages and courseTags
    const parsedResults = results.map(tutor => ({
      ...tutor,
      languages: typeof tutor.languages === 'string' ? JSON.parse(tutor.languages) : tutor.languages || [],
      courseTags: typeof tutor.courseTags === 'string' ? JSON.parse(tutor.courseTags) : tutor.courseTags || []
    }));

    return NextResponse.json({
      success: true,
      data: parsedResults
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
    const { tutors, universities } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const requestBody = await request.json();
    
    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        success: false,
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const universityId = requestBody.universityId;
    if (!universityId || typeof universityId !== 'string' || universityId.trim() === '') {
      return NextResponse.json({ 
        success: false,
        error: "Valid university ID is required",
        code: "MISSING_UNIVERSITY_ID" 
      }, { status: 400 });
    }

    // Validate university exists
    const university = await db
      .select()
      .from(universities)
      .where(eq(universities.id, universityId))
      .limit(1);

    if (university.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Invalid university ID",
        code: "INVALID_UNIVERSITY_ID" 
      }, { status: 400 });
    }
    
    const now = new Date().toISOString();
    const tutorData = {
      id: uuidv4(),
      userId: session.user.id,
      universityId: universityId,
      name: session.user.name,
      bio: "",
      hourlyRate: 0,
      languages: JSON.stringify([]),
      courseTags: JSON.stringify([]),
      verified: false,
      isAvailable: true,
      ratingAvg: 0,
      reviewCount: 0,
      totalEarnings: 0,
      createdAt: now,
      updatedAt: now
    };
    
    const result = await db
      .insert(tutors)
      .values(tutorData)
      .returning();
    
    return NextResponse.json({
      success: true,
      data: result[0]
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Lazy imports
    const { db } = await import('@/db');
    const { tutors, universities } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    
    console.log("Received PUT request for tutor profile update");
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json({ 
        success: false,
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const requestBody = await request.json();
    
    // Security check: reject if userId provided in body
    if ('userId' in requestBody || 'user_id' in requestBody) {
      return NextResponse.json({ 
        success: false,
        error: "User ID cannot be provided in request body",
        code: "USER_ID_NOT_ALLOWED" 
      }, { status: 400 });
    }

    const conditions: any[] = [eq(tutors.userId, user_id)];
    if (session.user.role !== 'admin') {
      conditions.push(eq(tutors.userId, session.user.id));
    }
    
    const authCondition = and(...conditions);

    // Check if tutor exists and belongs to user (or user is admin)
    const existingTutor = await db
      .select()
      .from(tutors)
      .where(authCondition)
      .limit(1);

    if (existingTutor.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Tutor profile not found',
        code: 'TUTOR_NOT_FOUND' 
      }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    const { 
      hourlyRate, 
      languages, 
      courseTags, 
      universityId, 
      bio,
      verified,
      isAvailable,
      location
    } = requestBody;

    // Validate and update fields
    if (hourlyRate !== undefined) {
      if (hourlyRate < 0 || hourlyRate > 200) {
        return NextResponse.json({ 
          success: false,
          error: "Hourly rate must be between 0 and 200",
          code: "INVALID_HOURLY_RATE" 
        }, { status: 400 });
      }
      updates.hourlyRate = parseFloat(hourlyRate);
    }

    if (languages !== undefined) {
      if (!Array.isArray(languages) || languages.length === 0) {
        return NextResponse.json({ 
          success: false,
          error: "Languages must be a non-empty array",
          code: "INVALID_LANGUAGES" 
        }, { status: 400 });
      }
      updates.languages = JSON.stringify(languages);
    }

    if (courseTags !== undefined) {
      if (!Array.isArray(courseTags)) {
        return NextResponse.json({ 
          success: false,
          error: "Course tags must be an array",
          code: "INVALID_COURSE_TAGS" 
        }, { status: 400 });
      }
      updates.courseTags = JSON.stringify(courseTags);
    }

    if (universityId !== undefined) {
      if (typeof universityId !== 'string' || universityId.trim() === '') {
        return NextResponse.json({ 
          success: false,
          error: "Valid university ID is required",
          code: "INVALID_UNIVERSITY_ID" 
        }, { status: 400 });
      }

      const university = await db
        .select()
        .from(universities)
        .where(eq(universities.id, universityId))
        .limit(1);

      if (university.length === 0) {
        return NextResponse.json({ 
          success: false,
          error: "University not found",
          code: "UNIVERSITY_NOT_FOUND" 
        }, { status: 400 });
      }
      
      updates.universityId = universityId;
    }

    if (bio !== undefined) {
      updates.bio = bio ? bio.trim() : null;
    }
    if (location !== undefined) {
      updates.location = location ? location.trim() : null;
    }

    // Only admin can update verified status
    if (verified !== undefined && session.user.role === 'admin') {
      updates.verified = Boolean(verified);
    }

    if (isAvailable !== undefined) {
      updates.isAvailable = Boolean(isAvailable);
    }

    const result = await db
      .update(tutors)
      .set(updates)
      .where(authCondition)
      .returning();

    return NextResponse.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('PUT error:', error);
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
    const { tutors } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false,
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }
    
    const conditions: any[] = [eq(tutors.id, id)];
    if (session.user.role !== 'admin') {
      conditions.push(eq(tutors.userId, session.user.id));
    }
    
    const authCondition = and(...conditions);
 
    // Check if tutor exists and belongs to user (or user is admin)
    const existingTutor = await db
      .select()
      .from(tutors)
      .where(authCondition)
      .limit(1);

    if (existingTutor.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Tutor profile not found',
        code: 'TUTOR_NOT_FOUND' 
      }, { status: 404 });
    }

    const deleted = await db
      .delete(tutors)
      .where(authCondition)
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Tutor profile deleted successfully',
      data: deleted[0]
    });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}