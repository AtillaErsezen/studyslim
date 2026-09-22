import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Lazy imports
    const { db } = await import('@/db');
    const { conversations, user } = await import('@/db/schema');
    const { auth } = await import('@/lib/auth');
    const { eq, or, and, desc } = await import('drizzle-orm');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userId = session.user.id;

    // Get all conversations where user is participant
    const userConversations = await db
      .select({
        conversation: conversations,
        otherUser: user,
      })
      .from(conversations)
      .leftJoin(
        user,
        or(
          and(eq(conversations.user1Id, userId), eq(user.id, conversations.user2Id)),
          and(eq(conversations.user2Id, userId), eq(user.id, conversations.user1Id))
        )
      )
      .where(
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    return NextResponse.json({ success: true, data: userConversations });
  } catch (error) {
    console.error('GET conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Lazy imports
    const { db } = await import('@/db');
    const { conversations } = await import('@/db/schema');
    const { auth } = await import('@/lib/auth');
    const { eq, or, and } = await import('drizzle-orm');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { other_user_id } = await request.json();

    if (!other_user_id) {
      return NextResponse.json({ error: 'other_user_id is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Check if conversation already exists
    const existing = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(eq(conversations.user1Id, userId), eq(conversations.user2Id, other_user_id)),
          and(eq(conversations.user1Id, other_user_id), eq(conversations.user2Id, userId))
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'conversation already exists' }, { status: 400 });
    }

    // Create new conversation
    const timestamp = new Date().toISOString();
    const newConversation = await db
      .insert(conversations)
      .values({
        id: uuidv4(),
        user1Id: userId,
        user2Id: other_user_id,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    return NextResponse.json({ success: true, data: newConversation[0] }, { status: 201 });
  } catch (error) {
    console.error('POST conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest){
  try {
    // Lazy imports
    const { db } = await import('@/db');
    const { conversations } = await import('@/db/schema');
    const { auth } = await import('@/lib/auth');
    const { eq } = await import('drizzle-orm');

    const session = await auth.api.getSession(request);
    if(!session) return NextResponse.json({error: 'Unauthorized'}, {status: 401});

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');
    
    if(!conversationId){
      return NextResponse.json({error: 'conversation_id is required'}, {status: 400});
    }

    const deleteResult = await db.delete(conversations).where(eq(conversations.id, conversationId));
    
    if(deleteResult.rowsAffected === 0){
      return NextResponse.json({error: 'Conversation not found'}, {status: 404});
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch(error) {
    console.error('DELETE conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}