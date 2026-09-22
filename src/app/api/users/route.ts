import { NextRequest, NextResponse } from 'next/server';
import validator from 'validator';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Lazy imports
    const { db } = await import('@/db');
    const { user } = await import('@/db/schema');
    const { eq, like, and } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('id');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    const location = searchParams.get('location');
    const universityId = searchParams.get('universityId');
    const limit = searchParams.get('limit');

    console.log("Received GET users request with params:", {
      user_id,
      name,
      email,
      role,
      location,
      universityId,
      limit
    });

    // If user_id is provided, fetch that specific user
    if (user_id) {
      if (typeof user_id !== 'string' || user_id.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: 'User ID must be a non-empty string',
          code: 'INVALID_USER_ID'
        }, { status: 400 });
      }

      const result = await db
        .select({
          email: user.email,
          id: user.id,
          name: user.name,
          role: user.role,
          location: user.location,
          image: user.image,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          universityId: user.universityId,
        })
        .from(user)
        .where(eq(user.id, user_id))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        }, { status: 404 });
      }

      console.log("GET user by ID result:", result[0]);
      return NextResponse.json({
        success: true,
        data: result[0]
      });
    }

    // Otherwise, validate search parameters if provided
    if (name !== null && name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({
        success: false,
        error: 'Name must be a non-empty string',
        code: 'INVALID_NAME'
      }, { status: 400 });
    }

    if (email !== null && email !== undefined && !validator.isEmail(email)) {
      return NextResponse.json({
        success: false,
        error: 'Email must be a valid email address',
        code: 'INVALID_EMAIL'
      }, { status: 400 });
    }

    // Validate limit parameter
    let parsedLimit = 100; // default limit
    if (limit !== null && limit !== undefined) {
      const limitNum = parseInt(limit);
      if (isNaN(limitNum) || limitNum <= 0) {
        return NextResponse.json({
          success: false,
          error: 'Limit must be a positive integer',
          code: 'INVALID_LIMIT'
        }, { status: 400 });
      }
      if (limitNum > 1000) {
        return NextResponse.json({
          success: false,
          error: 'Limit cannot exceed 1000',
          code: 'LIMIT_EXCEEDED'
        }, { status: 400 });
      }
      parsedLimit = limitNum;
    }

    // Build where conditions for search
    const conditions: any[] = [];
    if (name) conditions.push(like(user.name, `%${name}%`));
    if (email) conditions.push(eq(user.email, email));
    if (role) conditions.push(eq(user.role, role));
    if (location) conditions.push(like(user.location, `%${location}%`));

    // Execute query with all conditions
    let query = db
      .select({
        email: user.email,
        id: user.id,
        name: user.name,
        role: user.role,
        location: user.location,
        image: user.image,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
      })
      .from(user);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.limit(parsedLimit);

    console.log("GET users results:", results);
    return NextResponse.json({
      success: true,
      data: results
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
    const { user } = await import('@/db/schema');
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

    const { 
      name, 
      email,
      role
    } = requestBody;
    console.log("Received user creation request:");
    console.log(name, email, role);

    // Validate name field
    if (!name || name.trim().length <= 1) {
      return NextResponse.json({ 
        success: false,
        error: "Valid name is required",
        code: "MISSING_NAME" 
      }, { status: 400 });
    }

    if (!email || !validator.isEmail(email)) {
      return NextResponse.json({ 
        success: false,
        error: "Valid email is required",
        code: "MISSING_EMAIL" 
      }, { status: 400 });
    }
    // Validate user role
    if (role !== 'tutor' && role !== 'admin' && role !== 'student') {
      return NextResponse.json({ 
        success: false,
        error: 'Only valid roles(student, tutor, admin) can create tutor profiles',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    // Check if tutor profile already exists for this user
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
      console.log("Existing user check:");
      console.log(existingUser);
      console.log(email);
    if (existingUser.length > 0) {
       return NextResponse.json({ 
        success: false,
        error: "email already exists for this user",
        code: "EMAIL_EXISTS" 
      }, { status: 400 });
    }
    const now = new Date().toISOString();
    
    const userData = {
      id: uuidv4(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
      createdAt: now,
      updatedAt: now,
      image: null,
      isActive: true
    };
    console.log("Creating new user with data:");
    console.log(userData);
    let result;
    result = await db
      .insert(user)
      .values(userData)
      .returning();

    console.log("New user created with ID:", result[0].id);
    console.log(result);
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
    const { user } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log("Received user update request for searchParams:", searchParams);
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
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
    // Check if tutor exists and belongs to user (or user is admin)
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'User profile not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    const { 
      name, 
      email,
      image,
      location,
      isActive,
      universityId,
      major,
      emailVerified,
    } = requestBody;

    // Validate and update fields
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length <= 1) {
        return NextResponse.json({ 
          success: false,
          error: "Name must be at least 2 characters",
          code: "INVALID_NAME" 
        }, { status: 400 });
      }
      updates.name = name.trim();
    }
    if (universityId !== undefined) {
      if (typeof universityId !== 'string') {
        return NextResponse.json({ 
          success: false,
          error: "universityId must be string",
          code: "INVALID_UNIVERSITY_ID" 
        }, { status: 400 });
      }
      updates.universityId = universityId.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || email.trim().length === 0 || !validator.isEmail(email)) {
        return NextResponse.json({ 
          success: false,
          error: "Email must be a valid email address",
          code: "INVALID_EMAIL" 
        }, { status: 400 });
      }
      updates.email = email.trim().toLowerCase();
    }

    if (image !== undefined) {
      updates.image = image;
    }
    if (location !== undefined) {
      updates.location = location;
    }

    if (emailVerified !== undefined) {
      updates.emailVerified = emailVerified;
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json({ 
          success: false,
          error: "isActive must be a boolean",
          code: "INVALID_ACTIVE" 
        }, { status: 400 });
      }
      updates.isActive = isActive;
    }

    const result = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, id))
      .returning();
    console.log("User updated with ID:", id);
    console.log(result);
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
    const { user } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }
    // Create condition to find user by ID
    const authCondition = eq(user.id, id);
 
    // Check if user exists and belongs to user (or user is admin)
    const existingUser = await db
      .select()
      .from(user)
      .where(authCondition)
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'User profile not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    // Use the same authCondition for the delete
    const deleted = await db
      .delete(user)
      .where(authCondition)
      .returning();

    return NextResponse.json({
      success: true,
      message: 'User profile deleted successfully',
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