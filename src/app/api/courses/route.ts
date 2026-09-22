import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Lazy import db to avoid build-time initialization
    const { db } = await import('@/db');
    const { courses, universities } = await import('@/db/schema');
    const { eq, like, and, or, desc } = await import('drizzle-orm');
    
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('university_id');
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const conditions = [];
    
    conditions.push(eq(courses.isActive, true));
    
    if (universityId) {
      conditions.push(eq(courses.universityId, universityId));
    }
    
    if (department) {
      conditions.push(eq(courses.department, department));
    }
    
    if (search) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          like(courses.name, searchTerm),
          like(courses.code, searchTerm),
          like(courses.description, searchTerm)
        )!
      );
    }

    const whereClause = conditions.length === 1 
      ? conditions[0] 
      : and(...conditions);

    const results = await db.select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
      department: courses.department,
      universityId: courses.universityId,
      description: courses.description,
      tags: courses.tags,
      isActive: courses.isActive,
      createdAt: courses.createdAt,
      updatedAt: courses.updatedAt,
      universityName: universities.name,
      universityShortName: universities.shortName
    })
    .from(courses)
    .leftJoin(universities, eq(courses.universityId, universities.id))
    .where(whereClause)
    .orderBy(desc(courses.createdAt))
    .limit(limit)
    .offset(offset);

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}