import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
     console.log('==========================================');
  console.log('UNIVERSITIES ROUTE STARTED');
  console.log('==========================================');
  
    // Lazy imports
    const { db } = await import('@/db');
    console.error('DB imported in universities route'); // DEBUG error
    const { universities } = await import('@/db/schema');
    console.error('Universities schema imported in universities route'); // DEBUG error
    const { eq } = await import('drizzle-orm');
    console.error('Drizzle ORM imported in universities route'); // DEBUG error
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
      return NextResponse.json({
        success: false,
        error: "Invalid pagination parameters",
        code: "INVALID_PAGINATION"
      }, { status: 400 });
    }

    const activeUniversities = await db
      .select({
        id: universities.id,
        name: universities.name,
        shortName: universities.shortName,
        city: universities.city,
        country: universities.country
      })
      .from(universities)
      .where(eq(universities.isActive, true))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: activeUniversities
    }, { status: 200 });

  } catch (error) {
    console.error('GET universities error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      code: "INTERNAL_ERROR"
    }, { status: 500 });
  }
}