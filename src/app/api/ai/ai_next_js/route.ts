import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }
    const response = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      throw new Error('Python AI service error');
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      data: { response: data.chat_response},
    });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}