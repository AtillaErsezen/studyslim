import {NextRequest, NextResponse} from "next/server";
import {v4 as uuidv4} from "uuid";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest){
  try{
    // Lazy imports
    const { db } = await import('@/db');
    const { tutorCourses, courses, tutors } = await import('@/db/schema');
    const { eq, desc, and } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    
    const {searchParams} = new URL(request.url);
    const id = searchParams.get('id');
    const tutorId = searchParams.get('tutor_id');
    const courseId = searchParams.get('course_id');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;
    
    const whereConditions = [];
    if (id) {
        whereConditions.push(eq(tutorCourses.id, id));
    }
    if (tutorId) {
        whereConditions.push(eq(tutorCourses.tutorId, tutorId));
    }
    if (courseId) {
        whereConditions.push(eq(tutorCourses.courseId, courseId));
    }
    
    const results = await db.select()
      .from(tutorCourses)
      .leftJoin(courses, eq(tutorCourses.courseId, courses.id))
      .leftJoin(tutors, eq(tutorCourses.tutorId, tutors.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(tutorCourses.createdAt))
      .limit(limit);

    return NextResponse.json({ success: true, data: results }, { status: 200 });
  }catch(error){
    console.error('GET tutor_courses error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest){
  try{
    // Lazy imports
    const { db } = await import('@/db');
    const { tutorCourses, courses, tutors } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    if (session.user.role !== 'tutor' && session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Only tutors can add courses' }, { status: 403 });
    }

    const tutorRecord = await db.select().from(tutors).where(eq(tutors.userId, session.user.id)).limit(1);
    if (tutorRecord.length === 0 && session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Tutor profile not found' }, { status: 404 });
    }
    const tutorId = tutorRecord[0].id;
    
    const {course_id, experience_level} = await request.json();
    
    if (!course_id) {
      return NextResponse.json({ success: false, error: 'courseId is required' }, { status: 400 });
    }
    if (!experience_level) {
      return NextResponse.json({ success: false, error: 'experience_level is required' }, { status: 400 });
    }
    
    const courseRecord = await db.select().from(courses).where(eq(courses.id, course_id)).limit(1);
    if (courseRecord.length === 0) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }
    
    const validExperienceLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validExperienceLevels.includes(experience_level)) {
      return NextResponse.json({ success: false, error: 'Invalid experience_level' }, { status: 400 });
    }
    
    const existingRecord = await db.select().from(tutorCourses).where(and(
      eq(tutorCourses.tutorId, tutorId),
      eq(tutorCourses.courseId, course_id)
    )).limit(1);
    if (existingRecord.length > 0) {
      return NextResponse.json({ success: false, error: 'Tutor already has this course' }, { status: 409 });
    }
    
    const newRecord = await db.insert(tutorCourses).values({
      id: uuidv4(),
      tutorId: tutorId,
      courseId: course_id,
      experienceLevel: experience_level,
      createdAt: new Date().toISOString()
    }).returning();

    return NextResponse.json({ success: true, data: newRecord }, { status: 201 });
  }catch(error){
    console.error('POST tutor_courses error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest){
  try{
    // Lazy imports
    const { db } = await import('@/db');
    const { tutorCourses, tutors } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    
    const {id, experience_level} = await request.json();
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    if (!experience_level) {
      return NextResponse.json({ success: false, error: 'experience_level is required' }, { status: 400 });
    }
    
    const validExperienceLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validExperienceLevels.includes(experience_level)) {
      return NextResponse.json({ success: false, error: 'Invalid experience_level' }, { status: 400 });
    }
    
    const record = await db.select().from(tutorCourses).where(eq(tutorCourses.id, id)).limit(1);
    if (record.length === 0) {
      return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    }
    
    const tutorRecord = await db.select().from(tutors).where(eq(tutors.userId, session.user.id)).limit(1);
    if (tutorRecord.length === 0 && session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Tutor profile not found' }, { status: 404 });
    }

    if (record[0].tutorId !== tutorRecord[0]?.id && session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const updatedRecord = await db.update(tutorCourses)
      .set({
        experienceLevel: experience_level,
      })
      .where(eq(tutorCourses.id, id))
      .returning();
      
    return NextResponse.json({ success: true, data: updatedRecord }, { status: 200 });
  }catch(error){
    console.error('PUT tutor_courses error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest){
  try{
    // Lazy imports
    const { db } = await import('@/db');
    const { tutorCourses, tutors } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const {searchParams} = new URL(request.url);
    const id = searchParams.get('id');
    const course_id = searchParams.get('course_id');

    if (session.user.role !== 'tutor' && session.user.role !== 'admin') 
      return NextResponse.json({ success: false, error: 'Only tutors can delete courses' }, { status: 403 });

    const tutorRecord = await db.select().from(tutors).where(eq(tutors.userId, session.user.id)).limit(1);
    if (tutorRecord.length === 0) {
      return NextResponse.json({ success: false, error: 'Tutor profile not found' }, { status: 404 });
    }

    if(id){
      const record = await db.select().from(tutorCourses).where(eq(tutorCourses.id, id)).limit(1);
      if (record.length === 0) {
        return NextResponse.json({ success: false, error: 'No record found' }, { status: 404 });
      }
      
      if (record[0].tutorId !== tutorRecord[0]?.id && session.user.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
      
      await db.delete(tutorCourses).where(eq(tutorCourses.id, id));
    }
    else{
      if (course_id) {
        await db.delete(tutorCourses).where(and(
          eq(tutorCourses.tutorId, tutorRecord[0].id),
          eq(tutorCourses.courseId, course_id)
        ));
      } else {
        await db.delete(tutorCourses).where(
          eq(tutorCourses.tutorId, tutorRecord[0].id)
        );
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  }catch(error){
    console.error('DELETE tutor_courses error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}