import {NextRequest, NextResponse} from "next/server";
import {v4 as uuidv4} from "uuid";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest){
  try{
    // Lazy imports
    const { db } = await import('@/db');
    const { messages } = await import('@/db/schema');
    const { eq, desc, and } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    
    const {searchParams} = new URL(request.url);
    const id = searchParams.get('id');
    const senderId = searchParams.get('sender_id');
    const conversationId = searchParams.get('conversation_id');
    const content = searchParams.get('content');
    const bookingId = searchParams.get('booking_id');
    const isRead = searchParams.get('is_read');
    
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam), 1000) : 50;
    
    const whereConditions = [];
    if (id) whereConditions.push(eq(messages.id, id));
    if (senderId) whereConditions.push(eq(messages.senderId, senderId));
    if (conversationId) whereConditions.push(eq(messages.conversationId, conversationId));
    if (content) whereConditions.push(eq(messages.content, content));
    if (bookingId) whereConditions.push(eq(messages.bookingId, bookingId));
    if (isRead !== null) whereConditions.push(eq(messages.isRead, isRead === 'true'));
    
    const results = await db.select()
        .from(messages)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(messages.createdAt))
        .limit(limit);

    return NextResponse.json({ success: true, data: results }, { status: 200 });
  }catch(error){
    console.error('GET messages error:', error);
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
    const { messages, conversations } = await import('@/db/schema');
    const { eq, and, or } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversation_id, content, message_type, attachment_url, booking_id } = await request.json();

    if (!conversation_id || !content) {
      return NextResponse.json({ error: 'conversation_id and content are required' }, { status: 400 });
    }

    // Verify user is part of conversation
    const conversation = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversation_id),
          or(
            eq(conversations.user1Id, session.user.id),
            eq(conversations.user2Id, session.user.id)
          )
        )
      )
      .limit(1);

    if (conversation.length === 0) {
      return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 });
    }

    const timestamp = new Date().toISOString();

    // Create message
    const newMessage = await db
      .insert(messages)
      .values({
        id: uuidv4(),
        conversationId: conversation_id,
        senderId: session.user.id,
        content,
        messageType: message_type || 'text',
        attachmentUrl: attachment_url,
        bookingId: booking_id,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    // Update conversation's lastMessageAt
    await db
      .update(conversations)
      .set({
        lastMessageAt: timestamp,
        lastMessageContent: content.substring(0, 100),
        updatedAt: timestamp,
      })
      .where(eq(conversations.id, conversation_id));

    return NextResponse.json({ success: true, data: newMessage[0] }, { status: 201 });
  } catch (error) {
    console.error('POST messages error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest){
  try{
    // Lazy imports
    const { db } = await import('@/db');
    const { messages, conversations } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    
    const { id, content, is_read } = await request.json();
    
    if (!id) {
      return NextResponse.json({ success: false, error: 'id is required' }, { status: 400 });
    }
    
    if (content === undefined && is_read === undefined) {
      return NextResponse.json({ success: false, error: 'At least one field to update is required (content or is_read)' }, { status: 400 });
    }
    
    const messageRecord = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    if (messageRecord.length === 0) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }
    
    const message = messageRecord[0];
    
    if (content !== undefined) {
      if (message.senderId !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Only the sender can edit message content' }, { status: 403 });
      }
      if (!content || content.trim() === '') {
        return NextResponse.json({ success: false, error: 'content cannot be empty' }, { status: 400 });
      }
    }
    
    if (is_read !== undefined) {
      const conversationRecord = await db.select().from(conversations).where(eq(conversations.id, message.conversationId)).limit(1);
      if (conversationRecord.length === 0) {
        return NextResponse.json({ success: false, error: 'Conversation not found' }, { status: 404 });
      }
      
      const conversation = conversationRecord[0];
      const receiverId = conversation.user1Id === message.senderId ? conversation.user2Id : conversation.user1Id;
      
      if (receiverId !== session.user.id && session.user.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Only the receiver can mark message as read' }, { status: 403 });
      }
    }
    
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (content !== undefined) {
      updateData.content = content.trim();
    }
    
    if (is_read !== undefined) {
      updateData.isRead = is_read;
    }
    
    const updatedMessage = await db.update(messages)
      .set(updateData)
      .where(eq(messages.id, id))
      .returning();
      
    return NextResponse.json({ success: true, data: updatedMessage[0] }, { status: 200 });
  }catch(error){
    console.error('PUT messages error:', error);
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
    const { messages } = await import('@/db/schema');
    const { eq, and } = await import('drizzle-orm');
    const { auth } = await import('@/lib/auth');

    const session = await auth.api.getSession(request);
    if (!session) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const conversationId = searchParams.get('conversation_id');
    const whereConditions = [];
    
    if (!id && !conversationId) {
      return NextResponse.json({ success: false, error: 'id or conversation_id is required' }, { status: 400 });
    }
    if (conversationId){
      whereConditions.push(eq(messages.conversationId, conversationId));
    }
    if(id){
      whereConditions.push(eq(messages.id, id));
    }
    const messageRecord = await db.select().from(messages).where(whereConditions.length > 0 ? and(...whereConditions) : undefined).limit(1);
    if (messageRecord.length === 0) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }
    const deleteResponse = await db.delete(messages).where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
    if (deleteResponse.rowsAffected === 0) {
      return NextResponse.json({ success: false, error: 'Message deletion failed' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Message deleted successfully' }, { status: 200 });
  }catch(error){
    console.error('DELETE messages error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}